/**
 * B01: independent civil-date sexagenary cycle check and a PROVISIONAL
 * original character mapping. NOT a birth-chart engine or psychological
 * classification. Does not use the original animal-character classifications.
 *
 * The independent calendar reference tests a known public anchor and must
 * never replace the M06 day-boundary-reviewed natal engine in production.
 */
export const B01_VERSION = 'b01-day-character-study-v0.1';
export const DAY_ANCHOR = Object.freeze({
  date:'2026-10-17',ganzhi:'甲子',
  sources:Object.freeze([
    'https://www.calend.jp/2026/10/17',
    'https://www.rili.com.cn/wannianli/2026/1017.html'
  ])
});
const MS_DAY=86400000;
const datePattern=/^(\d{4})-(\d{2})-(\d{2})$/;
const positiveMod=(x,p)=>((x%p)+p)%p;
const ELEMENT_IDS=Object.freeze({'木':'WOOD','火':'FIRE','土':'EARTH','金':'METAL','水':'WATER'});
function fail(message){const e=new TypeError(message);e.code='B01_INVALID_INPUT';throw e;}
function object(x){return x!==null&&typeof x==='object'&&!Array.isArray(x);}
function arraySame(a,b){return Array.isArray(a)&&a.length===b.length&&a.every((v,i)=>v===b[i]);}
function dayNo(date){
 if(typeof date!=='string'||!datePattern.test(date))fail('Expected YYYY-MM-DD Gregorian civil date');
 const [year,month,day]=date.split('-').map(Number);
 if(year<1900||year>2099||month<1||month>12||day<1||day>31)fail('Date out of study range');
 const t=Date.UTC(year,month-1,day);
 const back=new Date(t);
 if(back.getUTCFullYear()!==year||back.getUTCMonth()!==month-1||back.getUTCDate()!==day)fail('Impossible date');
 return t/MS_DAY;
}
function catalog(m02){
 if(!object(m02)||m02.version!=='0.1'
   ||!Array.isArray(m02.stems)||!Array.isArray(m02.branches)
   ||m02.stems.length!==10||m02.branches.length!==12
   ||m02.sixty_cycle?.index!=='0..59')fail('M02 catalog not supported');
 const s=m02.stems.map(r=>r?.[0]),b=m02.branches;
 if(!arraySame(s,[...'甲乙丙丁戊己庚辛壬癸'])||!arraySame(b,[...'子丑寅卯辰巳午未申酉戌亥'])
   ||m02.stems.some((r,i)=>!Array.isArray(r)||r.length!==3
      ||r[1]!==['木','木','火','火','土','土','金','金','水','水'][i]
      ||r[2]!== (i%2===0?'陽':'陰')))
   fail('Canonical stem/branch catalog must match M02 v0.1');
 return {stems:s,branches:b};
}
export function getSixtyCycleTable(m02){
 const {stems,branches}=catalog(m02);
 return Array.from({length:60},(_,i)=>({
   cycle_index:i,cycle_number:i+1,
   ganzhi:stems[i%10]+branches[i%12],
   stem:stems[i%10],branch:branches[i%12],
   branch_index:i%12,stem_index:i%10,
   element:m02.stems[i%10][1],
   polarity:m02.stems[i%10][2]
 }));
}
/**
 * Date-only independent arithmetic audit, NOT natal classification.
 * JST midnight here is a temporary CIVIL-DATE convention; a person born
 * between 23:00 and 23:59 may fall in a different day-boundary convention.
 */
export function auditCivilDayGanzhi(date_jst,m02){
 const table=getSixtyCycleTable(m02);
 const a=dayNo(DAY_ANCHOR.date);
 const d=dayNo(date_jst);
 const idx=positiveMod(d-a,60);
 const record=table[idx];
 return {
   status:'audit_reference_only',
   version:B01_VERSION,
   day_boundary_policy:'JST_00_PROVISIONAL',
   supported_range:'1900-2099_gregorian_civil_date',
   day_pillar:record.ganzhi,
   cycle_number:record.cycle_number,
   cycle_index:idx,
   not_a_verified_birth_character:true
 };
}
/**
 * Deliberately accepts ONLY an anonymous valid 60-cycle symbol, not
 * a birthday/sex/gender/5Q responses/actual natal record.
 * Mapping: branch chooses 12 proposed character slots; stem's element
 * chooses one of 5 variants in that branch; this yields exactly 12×5=60.
 */
export function proposeCharacterFromSymbol(input,m02){
 if(!object(input)||Object.keys(input).sort().join(',')!=='mode,symbol'
   ||input.mode!=='anonymous_symbol_study'||typeof input.symbol!=='string')
   fail('Only anonymous 60-cycle symbol study is supported');
 const table=getSixtyCycleTable(m02);
 const record=table.find(r=>r.ganzhi===input.symbol);
 if(!record)fail('Invalid 60-cycle stem and branch combination');
 return {
   status:'candidate_only',
   version:B01_VERSION,
   production_usable:false,
   fixed_character_rule_adopted:false,
   cycle_index:record.cycle_index,
   cycle_number:record.cycle_number,
   symbol:record.ganzhi,
   proposed_character_id:'BC'+String(record.branch_index+1).padStart(2,'0'),
   proposed_character_branch:record.branch,
   proposed_variant_id:'EL_'+ELEMENT_IDS[record.element],
   proposed_variant_element:record.element,
   stem:record.stem,
   zodiac_classification_claim:false,
   personal_traits_inferred:false,
   character_name:null,
   artwork:null,
   note:'出生日からの正式な個人キャラではなく、暦記号の60→12×5対応を検証する仮分類です。'
 };
}
