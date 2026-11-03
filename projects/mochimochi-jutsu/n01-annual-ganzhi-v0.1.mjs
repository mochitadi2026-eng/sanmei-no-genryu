/**
 * N01 limited annual calendar evidence adapter.
 * Annual sexagenary symbol only. No natal chart, da-yun, personal turning
 * point, actual lived event or future prediction is generated here.
 */
export const N01_VERSION='n01-annual-ganzhi-v0.1';
const STEMS=Object.freeze(['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']);
const BRANCHES=Object.freeze(['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']);
const REGISTRY_MINUTE=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):00\+09:00$/;
const JST_INSTANT=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\+09:00$/;
const BOUNDARY_HOLD_MS=60_000;
function fail(message){const e=new TypeError(message);e.code='N01_INVALID_INPUT';throw e;}
function obj(x){return x!==null&&typeof x==='object'&&!Array.isArray(x);}
function exactTime(text,pattern){
 if(typeof text!=='string'||!pattern.test(text))fail('Expected ISO8601 JST (+09:00) with seconds');
 const ms=Date.parse(text);
 if(!Number.isFinite(ms))fail('Invalid timestamp');
 const restored=new Date(ms+9*3600_000).toISOString().slice(0,19);
 if(restored!==text.slice(0,19))fail('Impossible Gregorian date or clock time');
 return ms;
}
function ganzhi(year){
 const n=((year-1984)%60+60)%60;
 return {stem:STEMS[n%10],branch:BRANCHES[n%12],
   ganzhi:STEMS[n%10]+BRANCHES[n%12],cycle_index:n};
}
export function validateN01RisshunRegistry(registry){
 if(!obj(registry)||registry.version!=='n01-risshun-naoj-v0.1'
   ||registry.scope?.timezone!=='Asia/Tokyo'
   ||registry.status!=='verified_published_minute_boundaries_only'
   ||registry.constraints?.boundary_hold_seconds!==60
   ||!Array.isArray(registry.boundary_minutes)
   ||registry.boundary_minutes.length!==4)
   fail('Unsupported registry/version');
 for(let i=0;i<4;i++){
   const row=registry.boundary_minutes[i],y=2024+i;
   const source='https://eco.mtk.nao.ac.jp/koyomi/yoko/'+y+'/rekiyou'+String(y).slice(2)+'2.html';
   if(!obj(row)||row.year!==y||row.published_precision!=='minute'
     ||row.source!==source||typeof row.jst!=='string'
     ||!row.jst.startsWith(y+'-02-'))
     fail('Unrecognized NAOJ year/source');
   exactTime(row.jst,REGISTRY_MINUTE);
 }
 return true;
}
function output(status,other={}){
 return {version:N01_VERSION,status,source_precision:'minute',
   natal_chart_computed:false,da_yun_computed:false,
   turning_point_computed:false,personality_computed:false,...other};
}
/** Dates for 2024-2027 only, with ±60s held around published minute. */
export function resolveAnnualGanzhi({timestamp_jst,registry}={}){
 validateN01RisshunRegistry(registry);
 const timestamp=exactTime(timestamp_jst,JST_INSTANT);
 const calendarYear=Number(timestamp_jst.slice(0,4));
 if(calendarYear<2024||calendarYear>2027)
   return output('unsupported',{reason:'YEAR_NOT_IN_REGISTRY',calendar_year:calendarYear});
 const boundary=registry.boundary_minutes[calendarYear-2024];
 const minute=exactTime(boundary.jst,REGISTRY_MINUTE);
 if(Math.abs(timestamp-minute)<=BOUNDARY_HOLD_MS)
   return output('needs_review',{
      reason:'RISSHUN_MINUTE_PRECISION',calendar_year:calendarYear,
      boundary_published_jst:boundary.jst,boundary_source:boundary.source
   });
 const effective=timestamp>minute?calendarYear:calendarYear-1;
 if(effective<2024)
   return output('unsupported',{reason:'PREVIOUS_YEAR_OUTSIDE_REGISTRY',calendar_year:calendarYear});
 const included=effective===calendarYear
   ?[boundary]:[registry.boundary_minutes[effective-2024],boundary];
 return output('symbol_only',{
   calendar_year:calendarYear,effective_cycle_year:effective,
   ...ganzhi(effective),
   rule_id:'SOLAR_YEAR_RISSHUN_1984_JIAZI',
   source_urls:included.map(x=>x.source),
   scope_note:'年干支の記号のみ。個人の過去の転機・未来・大運は算定していません。'
 });
}
