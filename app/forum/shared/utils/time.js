export const now = () => Date.now()

export const getTimeBucket = (ttlSec = 1) => Math.floor((Date.now() / 1000) / ttlSec)
