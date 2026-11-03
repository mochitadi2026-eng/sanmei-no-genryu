/**
 * B03 adopted character convention for Mochimochi-jutsu only.
 * This is an original classification, not a certification from any school.
 * Date-only civil-day switching at midnight is adopted. Solar-term
 * boundaries for YEAR/MONTH pillars belong to M06 and are not changed.
 *
 * Deliberately development-only until B04/B05, chart reviews, user review,
 * privacy and release checks complete. No storage or browser/network calls.
 */
import { previewFixedCharacter } from './b03-civil-date-character-candidate-v0.1.mjs';

export const B03_RULE_VERSION = 'mochimochi-birth-character-v1.0';
export const B03_ADOPTED_RULE = Object.freeze({
  version:B03_RULE_VERSION,
  status:'adopted_original_character_convention',
  country:'JP',
  date_input:'recorded_Gregorian_civil_date',
  change_of_day:'00:00_civil_date',
  time_of_birth_used:false,
  character_key:'day_earthly_branch_12',
  variation_key:'day_stem_element_5',
  excludes:['monthly_solar_term_boundaries','yearly_risshun_boundaries','natal_fate_prediction'],
  endorsed_by_traditional_school:false,
  independently_validated_personality_measure:false,
  birth_chart_m06_integration:false,
  public_release_approved:false
});
/**
 * The accepted rule is fixed, but every output remains a development preview:
 *   "rule adopted" != "natal chart verified" != "public release approved".
 * Accepts the same explicitly restricted date-only object as B03 preview.
 */
export function resolveBirthCharacterForDevelopment(input,m02){
  const candidate=previewFixedCharacter(input,m02);
  if(candidate.status==='unsupported'){
    return {
      rule_version:B03_RULE_VERSION,
      rule_status:'adopted_original_character_convention',
      status:'unsupported',reason:candidate.reason,
      production_usable:false,personal_traits_inferred:false,
      input_retained:false
    };
  }
  return {
    rule_version:B03_RULE_VERSION,
    rule_status:'adopted_original_character_convention',
    status:'development_preview',
    production_usable:false,
    published_character_assigned:false,
    m06_natal_chart_approved:false,
    school_equivalence_claimed:false,
    personal_traits_inferred:false,
    input_retained:false,
    day_boundary:'00:00_civil_JP',
    day_ganzhi:candidate.day_symbol,
    character_id:candidate.character_slot,
    character_branch:candidate.character_branch,
    element_id:candidate.variant_id,
    element:candidate.variant_element,
    message:'もちもち占術独自の暦日キャラ分類ルール。公開前の開発用表示です。'
  };
}
