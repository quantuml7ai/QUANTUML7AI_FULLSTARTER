'use client'

function readWindowingDeviceProfile() {
  try {
    const w = Number(window?.innerWidth || 0)
    const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches
    const dm = Number(window?.navigator?.deviceMemory || 0)
    const lowMem = Number.isFinite(dm) && dm > 0 && dm <= 4
    const breakpoint = w >= 1024 ? 'desktop' : (w >= 640 ? 'tablet' : 'mobile')
    return { breakpoint, coarse, lowMem }
  } catch {
    return { breakpoint: 'tablet', coarse: false, lowMem: false }
  }
}

export function readForumCardEstimate(kind = 'post') {
  const { breakpoint } = readWindowingDeviceProfile()
  const lookup = {
    post: {
      mobile: 860,
      tablet: 760,
      desktop: 700,
    },
    topic: {
      mobile: 260,
      tablet: 236,
      desktop: 224,
    },
    dm_dialog: {
      mobile: 168,
      tablet: 152,
      desktop: 148,
    },
    dm_message: {
      mobile: 360,
      tablet: 330,
      desktop: 300,
    },
    ad: {
      mobile: 520,
      tablet: 620,
      desktop: 650,
    },
  }

  const family = lookup[String(kind || 'post')] || lookup.post
  return Number(family?.[breakpoint] || family?.tablet || 320)
}

export function readForumWindowingMaxRender(kind = 'post') {
  const { coarse, lowMem } = readWindowingDeviceProfile()
  const constrained = coarse || lowMem

  switch (String(kind || 'post')) {
    case 'topic':
      return constrained ? 14 : 18
    case 'dm_dialog':
      return constrained ? 14 : 18
    case 'dm_message':
      return constrained ? 12 : 14
    case 'post':
    default:
      return constrained ? 9 : 11
  }
}

export function readForumWindowingOverscan(kind = 'post', velocity = 0) {
  const { breakpoint, coarse } = readWindowingDeviceProfile()
  const profile = {
    post: {
      mobile: 1900,
      tablet: 2000,
      desktop: 2100,
      boost: coarse ? 0.16 : 0.22,
    },
    topic: {
      mobile: 920,
      tablet: 1000,
      desktop: 1080,
      boost: coarse ? 0.14 : 0.18,
    },
    dm_dialog: {
      mobile: 720,
      tablet: 760,
      desktop: 820,
      boost: coarse ? 0.12 : 0.16,
    },
    dm_message: {
      mobile: 1100,
      tablet: 1200,
      desktop: 1280,
      boost: coarse ? 0.14 : 0.2,
    },
  }

  const cfg = profile[String(kind || 'post')] || profile.post
  const base = Number(cfg?.[breakpoint] || cfg?.tablet || 960)
  const boost = Number(cfg?.boost || 0.16)
  const v = Math.min(1, Math.abs(Number(velocity || 0)) / 2.8)
  return Math.round(base * (1 + (v * boost)))
}
