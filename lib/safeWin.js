// lib/safeWin.js
export const safeWindow = () => (typeof window !== 'undefined' ? window : undefined);
export const safeDocument = () => (typeof document !== 'undefined' ? document : undefined);
