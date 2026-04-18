'use client';

import React from 'react';

function el(type, props, ...children) {
  return React.createElement(type, props, ...children);
}

function renderList(items = []) {
  if (!items.length) return el('span', null, 'none');
  return el('span', null, items.join(', '));
}

export default function RuntimePassportPanel({ passport }) {
  if (!passport) return null;

  return el(
    'section',
    { 'data-runtime-passport-panel': '1' },
    el('h3', null, 'Runtime Passport'),
    el(
      'dl',
      null,
      el('dt', null, 'Route'),
      el('dd', null, passport.route),
      el('dt', null, 'Profile'),
      el('dd', null, passport.routeBudgetProfile),
      el('dt', null, 'Mode'),
      el('dd', null, `${passport.runtimeMode} (${passport.telemetryLevel})`),
      el('dt', null, 'Owners'),
      el('dd', null, renderList(passport.activeMediaOwners)),
      el('dt', null, 'Iframe / Native / Ad'),
      el('dd', null, `${passport.countActiveIframe} / ${passport.countActiveNativeVideo} / ${passport.countActiveAdMedia}`),
      el('dt', null, 'QCast'),
      el('dd', null, String(passport.qcastState?.count || 0)),
      el('dt', null, 'Timers / Observers'),
      el('dd', null, `${passport.timersCount} / ${passport.observersCount}`),
      el('dt', null, 'Budget Pressure'),
      el('dd', null, `${passport.currentBudgetPressureScore} / memory ${passport.memoryPressureScore || 0} / main-thread ${passport.mainThreadPressureScore || 0}`),
      el('dt', null, 'Adaptive'),
      el('dd', null, `${passport.activeAdaptiveProfile} / tier ${passport.currentEffectDegradationTier}`),
      el('dt', null, 'Adaptive Actions'),
      el('dd', null, renderList(passport.degradeActionsTaken)),
      el('dt', null, 'Blocked / Survival / Forensic'),
      el('dd', null, `${passport.blockedPromotionsCount || 0} / ${passport.survivalModeActive ? 'yes' : 'no'} / ${passport.forensicModeActive ? 'yes' : 'no'}`),
    ),
  );
}
