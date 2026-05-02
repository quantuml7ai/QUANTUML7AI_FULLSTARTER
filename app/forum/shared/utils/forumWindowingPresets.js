'use client'

function readWindowingDeviceProfile() {
  try {
    const w = Number(window?.innerWidth || 0)
    const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches
    const dm = Number(window?.navigator?.deviceMemory || 0)
    const lowMem = Number.isFinite(dm) && dm > 0 && dm <= 4
    const veryLowMem = Number.isFinite(dm) && dm > 0 && dm <= 2
    const breakpoint = w >= 1024 ? 'desktop' : (w >= 640 ? 'tablet' : 'mobile')
    return { breakpoint, coarse, lowMem, veryLowMem }
  } catch {
    return { breakpoint: 'tablet', coarse: false, lowMem: false, veryLowMem: false }
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
  const { breakpoint, coarse, lowMem, veryLowMem } = readWindowingDeviceProfile()
  const constrained = coarse || lowMem

  switch (String(kind || 'post')) {
    case 'topic':
      if (breakpoint === 'mobile' || veryLowMem) return 10
      return constrained ? 12 : 16
    case 'dm_dialog':
      if (breakpoint === 'mobile' || veryLowMem) return 10
      return constrained ? 12 : 16
    case 'dm_message':
      if (breakpoint === 'mobile' || veryLowMem) return 9
      return constrained ? 10 : 12
    case 'post':
    default:
      if (veryLowMem) return 5
      if (breakpoint === 'mobile' || coarse) return 6
      if (lowMem) return 7
      return 9
  }
}

export function readForumWindowingOverscan(kind = 'post', velocity = 0) {
  const { breakpoint, coarse } = readWindowingDeviceProfile()
  const profile = {
    post: {
      mobile: 1120,
      tablet: 1380,
      desktop: 1580,
      boost: coarse ? 0.1 : 0.16,
    },
    topic: {
      mobile: 740,
      tablet: 860,
      desktop: 960,
      boost: coarse ? 0.1 : 0.14,
    },
    dm_dialog: {
      mobile: 560,
      tablet: 640,
      desktop: 720,
      boost: coarse ? 0.08 : 0.12,
    },
    dm_message: {
      mobile: 820,
      tablet: 960,
      desktop: 1080,
      boost: coarse ? 0.1 : 0.15,
    },
  }

  const cfg = profile[String(kind || 'post')] || profile.post
  const base = Number(cfg?.[breakpoint] || cfg?.tablet || 960)
  const boost = Number(cfg?.boost || 0.14)
  const v = Math.min(1, Math.abs(Number(velocity || 0)) / 3.2)
  return Math.round(base * (1 + (v * boost)))
}
