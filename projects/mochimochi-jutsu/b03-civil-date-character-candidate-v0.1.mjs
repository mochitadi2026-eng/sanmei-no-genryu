/**
 * B03 - date-only birth-character policy candidate.
 * An ORIGINAL editorial classification, not a Japanese Sanmei school rule.
 * Uses user's recorded Gregorian civil calendar date in Japan, NOT a birth
 * instant; 23:00/00:00 alternatives are not inferred.
 *
 * No persistence, no remote I/O, no personal-data log. This candidate MUST
 * NOT be presented as a finalized published fortune or validated personality.
 */
import {auditCivilDayGanzhi, proposeCharacterFromSymbol}
  from './b01-day-cycle-and-character-study-v0.1.mjs';

export const B03_POLICY_VERSION = 'b03-civil-jp-midnight-candidate-v0.1';
export const B03_POLICY = Object.freeze({
  id: B03_POLICY_VERSION,
  rule_status:'proposed_original_convention',
  recorded_calendar:'Gregorian',
  date_scope:'Japan-recorded civil calendar dates',
  civil_date_boundary:'00:00 local date, by date label not by timestamp conversion',
  source_of_character:'day earthly branch',
  source_of_variant:'day heavenly stem five element',
  support_years:[1900,2027],
  standard_sanmei_day_boundary_claim:false,
  method_is_school_certified:false,
  production_usable:false
});
function invalid(message){
  const error = new TypeError(message);
  error.code='B03_INVALID_INPUT';throw error;
}
function object(x){return x!==null && typeof x==='object' && !Array.isArray(x);}
/**
 * Restricted to date-only previews and Japanese civil-date input.
 * Actual birth times belong only to the separate M06 birth chart review.
 */
export function previewFixedCharacter(input,m02){
  if(!object(input)||Object.keys(input).sort().join(',')!=='calendar,civil_date,country'
      ||input.calendar!=='Gregorian'||input.country!=='JP'
      ||typeof input.civil_date!=='string')
    invalid('Require exactly Gregorian civil_date and country JP; birth time is not accepted');
  const date = input.civil_date;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))invalid('Invalid YYYY-MM-DD');
  const year = Number(date.slice(0,4));
  if(year<1900||year>2027) {
    return {
      version:B03_POLICY_VERSION,status:'unsupported',
      reason:'M06_SUPPORT_RANGE_NOT_REVIEWED',
      production_usable:false,retained_input:false
    };
  }
  const day=auditCivilDayGanzhi(date,m02);
  const mapped=proposeCharacterFromSymbol({
    mode:'anonymous_symbol_study',symbol:day.day_pillar
  },m02);
  return {
    version:B03_POLICY_VERSION,
    status:'candidate_preview_only',
    method:B03_POLICY.id,
    original_method:true,
    production_usable:false,
    retained_input:false,
    external_requests:false,
    fixed_character_certified:false,
    chart_m06_approved:false,
    date_boundary:'00:00_CIVIL_JP',
    day_symbol:day.day_pillar,
    character_slot:mapped.proposed_character_id,
    character_branch:mapped.proposed_character_branch,
    variant_element:mapped.proposed_variant_element,
    variant_id:mapped.proposed_variant_id,
    notice:'出生日の暦日から付けるオリジナルの象徴キャラ（試作）。算命学の流派による人格鑑定や、本番用命式の証明ではありません。'
  };
}
