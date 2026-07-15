const APP_SHELL_CONFIG = Object.freeze({
  ok: true,
  appShell: {
    minAndroidBuild: 1,
    minIosBuild: 1,
      maintenanceMode: false,
      forceUpdate: false,
      softUpdate: false,
      paymentMode: 'review_pending',
      mainUrl: 'https://www.quantuml7ai.com',
      allowedDomains: [
        'quantuml7ai.com',
        'www.quantuml7ai.com',
      ],
      externalPaymentDomains: [],
      walletSchemes: [],
      featureFlags: {
        nativeShare: false,
        haptics: false,
        pushNotifications: false,
        biometrics: false,
      },
      remoteKillSwitches: {
        androidWebView: false,
        walletLinks: false,
        paymentLinks: false,
        nativeBridge: false,
      },
      supportUrl: 'https://www.quantuml7ai.com/contact',
      privacyUrl: 'https://www.quantuml7ai.com/privacy',
      termsUrl: 'https://www.quantuml7ai.com/privacy',
    },
  });

export async function GET() {
  return Response.json(APP_SHELL_CONFIG, {
    headers: {
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    },
  });
}
