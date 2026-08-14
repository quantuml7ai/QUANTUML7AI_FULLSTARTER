export const EFFECT_DEGRADATION_TIERS = Object.freeze({
  PREMIUM_FULL: 0,
  LIGHT_MOTION: 1,
  MINIMAL_MOTION: 2,
  STATIC_FALLBACK: 3,
  SURVIVAL_MODE: 4,
});

export function resolveEffectDegradationTier({
  budgetPressureScore = 0,
  lowMemory = false,
  slowNetwork = false,
  weakCpu = false,
  mainThreadPressure = false,
  backgrounded = false,
  decorativeRoute = false,
} = {}) {
  if (backgrounded || mainThreadPressure) return EFFECT_DEGRADATION_TIERS.SURVIVAL_MODE;
  if (lowMemory) return decorativeRoute ? EFFECT_DEGRADATION_TIERS.STATIC_FALLBACK : EFFECT_DEGRADATION_TIERS.MINIMAL_MOTION;
  if (weakCpu || slowNetwork || budgetPressureScore >= 85) return EFFECT_DEGRADATION_TIERS.MINIMAL_MOTION;
  if (budgetPressureScore >= 65 || decorativeRoute) return EFFECT_DEGRADATION_TIERS.LIGHT_MOTION;
  return EFFECT_DEGRADATION_TIERS.PREMIUM_FULL;
}
