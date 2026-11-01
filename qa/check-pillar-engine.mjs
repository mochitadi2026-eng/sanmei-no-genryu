#!/usr/bin/env node
/**
 * Public 2026 Japanese seasonal-term reference check.
 * Does NOT calculate a horoscope or prove interpretation accuracy.
 *
 * Usage:
 *   node qa/check-pillar-engine.mjs --verify-fixture
 *   node qa/check-pillar-engine.mjs --adapter ./path/to/engine-adapter.mjs
 * Expected adapter export:
 *   async function resolvePillars({localDateTime, timezone, calendarProfile})
 *   -> {yearPillar: "乙巳", monthPillar: "己丑", status: "ok"}
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const file = resolve(dir, 'fixtures/2026-sekki-naoj.json');
const input = JSON.parse(await readFile(file, 'utf8'));
const args = process.argv.slice(2);
const wantsFixtureOnly = args.length === 1 && args[0] === '--verify-fixture';
const adapterIndex = args.indexOf('--adapter');

function checkFixture(fixture) {
  if (fixture.schemaVersion !== 1 || fixture.events?.length !== 24) throw Error('expected 24 solar terms');
  const sections = new Set([285,315,345,15,45,75,105,135,165,195,225,255]);
  let testCases = 0;
  for (let i = 0; i < fixture.events.length; i++) {
    const e = fixture.events[i];
    if (!['節','中'].includes(e.kind)) throw Error('unknown seasonal term kind');
    if (e.kind !== (sections.has(e.solarLongitudeDegrees) ? '節' : '中')) throw Error('節 and 中 mismatch');
    if (e.samples?.length !== 2 || e.samples[0].relativeMinutes !== -2 || e.samples[1].relativeMinutes !== 2) throw Error('missing ±2 minute cases');
    if (Date.parse(e.samples[0].atJst) !== Date.parse(e.publishedAtJst)-120000 || Date.parse(e.samples[1].atJst) !== Date.parse(e.publishedAtJst)+120000) throw Error('sample instant mismatch');
    for (const s of e.samples) {
      if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\+09:00$/.test(s.atJst)) throw Error('invalid JST format');
      if (!/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/.test(s.expected.yearPillar) || !/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/.test(s.expected.monthPillar)) throw Error('invalid pillar pair');
      testCases++;
    }
    const before = e.samples[0].expected, after = e.samples[1].expected;
    const unchanged = before.yearPillar === after.yearPillar && before.monthPillar === after.monthPillar;
    if (e.kind === '中' && !unchanged) throw Error('中 must not change the month pillar in this profile');
    if (e.kind === '節' && unchanged) throw Error('節 must change the month pillar in this profile');
    if (i > 0) {
      const prev = fixture.events[i-1].samples[1].expected;
      if (before.yearPillar !== prev.yearPillar || before.monthPillar !== prev.monthPillar) throw Error('pillar continuity failed');
    }
  }
  if (testCases !== 48) throw Error('expected 48 cases');
  return testCases;
}

let cases;
try { cases = checkFixture(input); }
catch (e) { console.error('Fixture invalid:', e.message); process.exit(2); }
if (wantsFixtureOnly) {
  console.log('Reference fixture structure OK: 24 terms, 48 samples. Engine NOT tested.');
  process.exit(0);
}
if (adapterIndex < 0 || !args[adapterIndex+1] || args.length !== 2) {
  console.error('ENGINE NOT TESTED. Provide --adapter ./path/to/engine-adapter.mjs; or --verify-fixture for fixture-only check.');
  process.exit(2);
}
let resolvePillars;
try {
  const mod = await import(pathToFileURL(resolve(process.cwd(), args[adapterIndex+1])).href);
  resolvePillars = mod.resolvePillars;
  if (typeof resolvePillars !== 'function') throw Error('adapter must export resolvePillars');
} catch (e) {
  console.error('Cannot load engine adapter:', e.message);
  process.exit(2);
}
let passed = 0;
let failed = 0;
for (const term of input.events) {
  for (const sample of term.samples) {
    try {
      const actual = await resolvePillars({
        localDateTime: sample.atJst,
        timezone: 'Asia/Tokyo',
        calendarProfile: input.profile.id
      });
      if (actual?.status === 'ok' && actual.yearPillar === sample.expected.yearPillar && actual.monthPillar === sample.expected.monthPillar) {
        passed++;
      } else {
        failed++;
        console.error('FAIL',term.name,sample.atJst,'expected',JSON.stringify(sample.expected),'actual',JSON.stringify(actual));
      }
    } catch (e) {
      failed++;
      console.error('ERROR',term.name,sample.atJst,e.message);
    }
  }
}
console.log('Engine audit:',{total:cases,passed,failed});
process.exit(failed === 0 ? 0 : 1);
