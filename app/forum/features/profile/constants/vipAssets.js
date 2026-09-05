export const VIP_EMOJI = Array.from({ length: 150 }, (_, idx) => idx + 1)
  .filter((num) => num !== 52)
  .map((num) => `/vip/emoji/e${num}.gif`)

export const VIP_AVATARS = Array.from({ length: 130 }, (_, idx) => idx + 1)
  .map((num) => `/vip/avatars/a${num}.gif`)
