/**
 * Mochimochi M08: deterministic, read-only, questionnaire classifier.
 * Original creative labels only. Not a psychometric or natal-chart engine.
 * No network, IO, random seed, time, storage, or birth information.
 * Node >=22 / modern browser ESM. Catalogs must be supplied by caller.
 */
export const ALGORITHM_VERSION = 'mochimochi-classifier-v0.1';
const Q_IDS = Object.freeze(['Q1', 'Q2', 'Q3', 'Q4', 'Q5']);
const INPUT_KEYS = Object.freeze([
  'question_set_id', 'question_version', 'tag_mapping_version',
  'type_catalog_version', 'algorithm_version', 'answers',
]);
const THEMES = Object.freeze(['MOCHI', 'KETSU', 'NUKI', 'NEBA', 'YURA', 'EN']);
const PHASES = Object.freeze(['FP01', 'FP02', 'FP03', 'FP04', 'FP05']);
const MODES = Object.freeze(['open', 'settle']);

function plainRecord(x) {
  if (x === null || typeof x !== 'object' || Array.isArray(x)) return false;
  const proto = Object.getPrototypeOf(x);
  return proto === Object.prototype || proto === null;
}
function failure(code, message) {
  const err = new TypeError(message);
  err.code = code;
  throw err;
}
function exactlyKeys(value, requiredKeys, code, label) {
  if (!plainRecord(value)) failure(code, label + ' must be an object');
  const actual = Object.keys(value);
  const unwanted = actual.filter(k => !requiredKeys.includes(k));
  if (unwanted.length) failure(code, label + ' has unexpected keys: ' + unwanted.join(','));
}
function allUnique(values) {
  return new Set(values).size === values.length;
}
/**
 * Validate the two externally supplied, versioned catalogs every invocation.
 * No silent coercion or fallback to old scoring rules.
 */
export function validateCatalogs(questionBank, typeCatalog) {
  if (!plainRecord(questionBank) || !plainRecord(typeCatalog)) {
    failure('CATALOG_INVALID', 'Both JSON catalogs are required');
  }
  if (questionBank.question_set_id !== 'mochimochi-five-v0.1'
    || questionBank.question_version !== 'm07-questions-v0.1'
    || questionBank.tag_mapping_version !== 'm07-tags-v0.1'
    || typeCatalog.version !== '0.1') {
    failure('CATALOG_VERSION_UNSUPPORTED', 'Unexpected question or type catalog version');
  }
  if (!Array.isArray(questionBank.themes_order)
    || questionBank.themes_order.join('|') !== THEMES.join('|')
    || !Array.isArray(typeCatalog.theme_order)
    || typeCatalog.theme_order.join('|') !== THEMES.join('|')) {
    failure('CATALOG_INVALID', 'Six theme IDs/order must match');
  }
  if (!Array.isArray(questionBank.questions) || questionBank.questions.length !== 5
    || questionBank.questions.map(q => q.id).join('|') !== Q_IDS.join('|')) {
    failure('CATALOG_INVALID', 'Exactly Q1 through Q5 are required');
  }
  for (const q of questionBank.questions) {
    const expected = ['Q1', 'Q2', 'Q4'].includes(q.id) ? THEMES
      : q.id === 'Q3' ? PHASES : MODES;
    const expectedRole = ['Q1', 'Q2', 'Q4'].includes(q.id) ? 'theme'
      : q.id === 'Q3' ? 'phase' : 'mode';
    if (q.map_to !== expectedRole || !Array.isArray(q.choices)
      || q.choices.length !== expected.length + 1
      || !allUnique(q.choices.map(c => c.id))) {
      failure('CATALOG_INVALID', 'Invalid choices/role for ' + q.id);
    }
    const values = q.choices.map(c => c.value);
    if (values.filter(v => v === null).length !== 1
      || expected.some(v => values.filter(w => w === v).length !== 1)
      || q.choices.some(c => !plainRecord(c)
        || typeof c.id !== 'string'
        || !/^[a-z]$/.test(c.id)
        || typeof c.label !== 'string' || !c.label.trim()
        || (c.value === null) !== (c.id === 'x'))) {
      failure('CATALOG_INVALID', 'Invalid or unbalanced mapping for ' + q.id);
    }
  }
  if (!Array.isArray(typeCatalog.types) || typeCatalog.types.length !== 12
    || !Array.isArray(typeCatalog.phases) || typeCatalog.phases.length !== 5
    || typeCatalog.phases.map(p => p.id).join('|') !== PHASES.join('|')) {
    failure('CATALOG_INVALID', 'Expected 12 types and 5 phases in stable order');
  }
  const typeIds = typeCatalog.types.map(t => t.id);
  const pairs = typeCatalog.types.map(t => t.theme + '/' + t.mode);
  if (!allUnique(typeIds) || !allUnique(pairs)
    || typeCatalog.types.some(t => !THEMES.includes(t.theme) || !MODES.includes(t.mode))
    || THEMES.some(theme => MODES.some(mode => !pairs.includes(theme + '/' + mode)))
    || typeIds.some((id, i) => id !== 'MT' + String(i + 1).padStart(2, '0'))) {
    failure('CATALOG_INVALID', 'Type IDs and theme/mode pairs must be stable');
  }
  return true;
}
function versions(questionBank, typeCatalog) {
  return {
    question_set_id: questionBank.question_set_id,
    question_version: questionBank.question_version,
    tag_mapping_version: questionBank.tag_mapping_version,
    type_catalog_version: typeCatalog.version,
    algorithm_version: ALGORITHM_VERSION,
  };
}
/**
 * Input shape: {question_set_id,question_version,tag_mapping_version,
 *   type_catalog_version,algorithm_version,answers:{Q1:'a',...,Q5:'x'}}
 * Complete-but-undetermined results are valid. Missing answers never leak
 * partial classification; the explicit 'x' choice is an answered question.
 */
export function classifyAnswers(input, { questionBank, typeCatalog } = {}) {
  validateCatalogs(questionBank, typeCatalog);
  exactlyKeys(input, INPUT_KEYS, 'INVALID_INPUT', 'input');
  const v = versions(questionBank, typeCatalog);
  for (const key of INPUT_KEYS.filter(k => k !== 'answers')) {
    if (input[key] !== v[key]) failure('VERSION_MISMATCH', key + ' does not match catalog');
  }
  exactlyKeys(input.answers, Q_IDS, 'INVALID_INPUT', 'answers');
  const missing = Q_IDS.filter(id => !Object.hasOwn(input.answers, id));
  if (missing.length) {
    return { status: 'incomplete', reason: 'MISSING_ANSWER',
      missing_questions: missing, ...v };
  }
  const selected = {};
  for (const q of questionBank.questions) {
    const id = input.answers[q.id];
    if (typeof id !== 'string') failure('INVALID_INPUT', 'Non-string choice for ' + q.id);
    const choice = q.choices.find(c => c.id === id);
    if (!choice) failure('INVALID_INPUT', 'Unknown choice for ' + q.id);
    selected[q.id] = choice.value;
  }
  const q4 = selected.Q4;
  const corroborated = q4 !== null && (q4 === selected.Q1 || q4 === selected.Q2);
  const primaryTheme = corroborated ? q4 : null;
  const mode = selected.Q5;
  const targetType = primaryTheme !== null && mode !== null
    ? typeCatalog.types.find(t => t.theme === primaryTheme && t.mode === mode)
    : null;
  if (primaryTheme !== null && mode !== null && !targetType) {
    failure('CATALOG_INVALID', 'No type matches theme and mode');
  }
  const candidateThemes = THEMES.filter(theme =>
    [selected.Q1, selected.Q2, selected.Q4].includes(theme));
  const typeReason = targetType ? null
    : primaryTheme === null ? 'NO_CORROBORATED_THEME' : 'MODE_NOT_SELECTED';
  return {
    status: 'resolved',
    type_status: targetType ? 'classified' : 'undetermined',
    type_reason: typeReason,
    primary_theme: primaryTheme,
    candidate_themes: candidateThemes,
    expression_mode: mode,
    mochi_type_id: targetType ? targetType.id : null,
    phase_id: selected.Q3,
    phase_status: selected.Q3 === null ? 'unselected' : 'selected',
    ...v,
  };
}
