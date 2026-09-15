export function serializeRuntimePassport(passport) {
  return JSON.stringify(passport, null, 2);
}

export function formatRuntimePassportText(passport) {
  return [
    `route: ${passport.route}`,
    `profile: ${passport.routeBudgetProfile}`,
    `mode: ${passport.runtimeMode} (${passport.telemetryLevel}${passport.telemetryLabel ? ` / ${passport.telemetryLabel}` : ''})`,
    `active owners: ${passport.activeMediaOwners.join(', ') || 'none'}`,
    `iframe/native/ad: ${passport.countActiveIframe}/${passport.countActiveNativeVideo}/${passport.countActiveAdMedia}`,
    `qcast: ${passport.qcastState.count}`,
    `providers: ${JSON.stringify(passport.providerCounts)}`,
    `timers/observers: ${passport.timersCount}/${passport.observersCount}`,
    `pressure: budget=${passport.currentBudgetPressureScore} memory=${passport.memoryPressureScore || 0} main-thread=${passport.mainThreadPressureScore || 0} same-src=${passport.sameSrcPressureScore}`,
    `adaptive: profile=${passport.activeAdaptiveProfile} tier=${passport.currentEffectDegradationTier} survival=${passport.survivalModeActive ? 'yes' : 'no'}`,
    `actions: ${(passport.degradeActionsTaken || []).join(', ') || 'none'}`,
  ].join('\n');
}
