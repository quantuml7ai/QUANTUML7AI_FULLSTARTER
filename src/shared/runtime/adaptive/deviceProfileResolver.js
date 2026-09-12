function hasCoarsePointer(pointerCoarse) {
  return pointerCoarse === true;
}

export function resolveDeviceProfile({
  userAgent = '',
  deviceMemory = 0,
  hardwareConcurrency = 0,
  pointerCoarse = false,
  downlink = 10,
  effectiveType = '',
  viewportWidth = 0,
} = {}) {
  const ua = String(userAgent || '');
  const isWebView = /Telegram|WebView|wv\)/i.test(ua);
  const isMobileSafari = /iP(hone|ad|od).+Safari/i.test(ua) && !/CriOS/i.test(ua);
  const isMobileChrome = /Android.+Chrome/i.test(ua) || /CriOS/i.test(ua);
  const coarse = hasCoarsePointer(pointerCoarse) || /Android|iP(hone|ad|od)/i.test(ua);
  const memory = Number(deviceMemory || 0);
  const cpu = Number(hardwareConcurrency || 0);
  const lowMemory = memory > 0 && memory <= 3;
  const weakCpu = cpu > 0 && cpu <= 4;
  const slowNetwork = /2g|3g/i.test(String(effectiveType || '')) || Number(downlink || 0) < 1.5;
  const desktop = !coarse && Number(viewportWidth || 0) >= 1024;

  let performanceClass = 'mid';
  if (desktop && !lowMemory && !weakCpu) performanceClass = 'high';
  if (lowMemory || weakCpu || slowNetwork) performanceClass = 'low-end';

  return {
    performanceClass,
    lowMemory,
    weakCpu,
    slowNetwork,
    coarse,
    desktop,
    isWebView,
    isMobileSafari,
    isMobileChrome,
  };
}
