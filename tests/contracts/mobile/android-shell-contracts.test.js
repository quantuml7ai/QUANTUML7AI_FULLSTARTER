import { describe, expect, test } from 'vitest';
import { fileText, relExists } from '../../support/runtimeGovernance.js';

const androidFiles = [
  'mobile/android/README.md',
  'mobile/android/ANDROID_SECURITY.md',
  'mobile/android/ANDROID_RELEASE.md',
  'mobile/android/ANDROID_RELEASE_DECISIONS.md',
  'mobile/android/ANDROID_TEST_MATRIX.md',
  'mobile/android/ANDROID_APP_LINKS.md',
  'mobile/android/ANDROID_REMOTE_CONFIG.md',
  'mobile/android/ANDROID_NATIVE_BRIDGE.md',
  'mobile/android/ANDROID_MEDIA_PERMISSIONS.md',
  'mobile/android/ANDROID_WALLET_PAYMENT.md',
  'mobile/android/ANDROID_OBSERVABILITY.md',
  'mobile/android/ANDROID_NOTIFICATIONS.md',
  'mobile/android/ANDROID_STORE_METADATA.md',
  'mobile/android/ANDROID_ACCEPTANCE_CHECKLIST.md',
  'mobile/android/GRADLE_WRAPPER.md',
  'mobile/android/LDPLAYER_TESTING.md',
  'mobile/android/local.properties.example',
  'mobile/android/keystore.properties.example',
  'mobile/android/tools/android-doctor.ps1',
  'mobile/android/tools/build-debug-apk.ps1',
  'mobile/android/tools/build-release.ps1',
  'mobile/android/tools/print-signing-fingerprints.ps1',
  'mobile/android/tools/install-ldplayer.ps1',
  'public/.well-known/assetlinks.json',
  'mobile/android/app/src/main/AndroidManifest.xml',
  'mobile/android/app/src/main/res/xml/data_extraction_rules.xml',
  'mobile/android/app/src/main/java/com/quantuml7ai/app/MainActivity.kt',
  'mobile/android/app/src/main/java/com/quantuml7ai/app/AuthReturnActivity.kt',
  'mobile/android/app/src/main/java/com/quantuml7ai/app/QuantumLauncherActivity.kt',
  'mobile/android/app/src/main/java/com/quantuml7ai/app/QuantumNotificationService.kt',
  'mobile/android/app/src/main/java/com/quantuml7ai/app/QuantumFirebaseMessagingService.kt',
  'mobile/android/app/src/main/java/com/quantuml7ai/app/NativePushRegistrar.kt',
  'mobile/android/app/src/main/java/com/quantuml7ai/app/AppShellConfig.kt',
  'mobile/android/app/src/main/java/com/quantuml7ai/app/NativeBridge.kt',
  'app/api/push/native/link/route.js',
  'app/api/push/native/register/route.js',
  'app/api/push/native/status/route.js',
  'app/api/push/native/unlink/route.js',
  'app/api/push/events/route.js',
];

const androidStringDirs = [
  'values',
  'values-ru',
  'values-uk',
  'values-es',
  'values-tr',
  'values-ar',
  'values-zh-rCN',
];

describe('android native shell contracts', () => {
  test('web entry offers the APK only to Android browsers outside the installed app shell', () => {
    const prompt = fileText('components/AndroidAppPrompt.jsx');
    const layout = fileText('app/layout.js');

    expect(layout).toContain("import('../components/AndroidAppPrompt')");
    expect(layout).toContain('<AndroidAppPrompt />');
    expect(prompt).toContain('/Android/i.test(userAgent)');
    expect(prompt).toContain('/QuantumL7AIApp\\//i.test(userAgent)');
    expect(prompt).toContain("['standalone', 'fullscreen', 'minimal-ui']");
    expect(prompt).toContain("startsWith('android-app://')");
    expect(prompt).toContain('Quantum%20L7%20AI%20release%201.0.7.apk');
  });

  test('android shell keeps its store-ready documentation and runtime files', () => {
    for (const relPath of androidFiles) {
      expect(relExists(relPath), relPath).toBe(true);
    }
  });

  test('android shell has localized native state strings for project languages', () => {
    for (const dir of androidStringDirs) {
      const relPath = `mobile/android/app/src/main/res/${dir}/strings.xml`;
      const xml = fileText(relPath);
      expect(xml).toContain('name="offline_title"');
      expect(xml).toContain('name="offline_body"');
      expect(xml).toContain('name="retry"');
      expect(xml).toContain('name="blocked_url"');
      expect(xml).toContain('name="maintenance_title"');
      expect(xml).toContain('name="force_update_title"');
    }
  });

  test('android manifest is hardened for links, media permissions, app links and backups', () => {
    const manifest = fileText('mobile/android/app/src/main/AndroidManifest.xml');

    expect(manifest).toContain('android:usesCleartextTraffic="false"');
    expect(manifest).toContain('android:allowBackup="false"');
    expect(manifest).toContain('android:dataExtractionRules="@xml/data_extraction_rules"');
    expect(manifest).toContain('android:name="android.permission.CAMERA"');
    expect(manifest).toContain('android:name="android.permission.RECORD_AUDIO"');
    expect(manifest).toContain('android:name="android.permission.VIBRATE"');
    expect(manifest).toContain('android:name="android.permission.POST_NOTIFICATIONS"');
    expect(manifest).toContain('android:name="android.permission.MODIFY_AUDIO_SETTINGS"');
    expect(manifest).toContain('android:name="android.permission.ACCESS_FINE_LOCATION"');
    expect(manifest).toContain('android:name="android.permission.ACCESS_COARSE_LOCATION"');
    expect(manifest).toContain('android:name="android.permission.READ_MEDIA_IMAGES"');
    expect(manifest).toContain('android:autoVerify="true"');
    expect(manifest).toContain('android:host="www.quantuml7ai.com"');
    expect(manifest).toContain('android:host="quantuml7ai.com"');
    expect(manifest).toContain('android:scheme="quantuml7ai" android:host="wc"');
    expect(manifest).toContain('android:scheme="quantuml7ai" android:host="auth"');
    expect(manifest).toContain('android:name=".QuantumLauncherActivity"');
    expect(manifest).toContain('android:name=".QuantumNotificationService"');
    expect(manifest).toContain('android:name=".QuantumFirebaseMessagingService"');
    expect(manifest).toContain('android:host="push-link"');
    expect(manifest).toContain('android:host="push-unlink"');
    expect(manifest).toContain('android.support.customtabs.trusted.TRUSTED_WEB_ACTIVITY_SERVICE');
    expect(manifest).toContain('android.support.customtabs.trusted.DEFAULT_URL');
    expect(manifest).toContain('android:scheme="wc"');
    expect(manifest).toContain('android:scheme="tonkeeper"');
  });

  test('android webview runtime enforces secure shell boundaries', () => {
    const main = fileText('mobile/android/app/src/main/java/com/quantuml7ai/app/MainActivity.kt');
    const config = fileText('mobile/android/app/src/main/java/com/quantuml7ai/app/AppShellConfig.kt');
    const bridge = fileText('mobile/android/app/src/main/java/com/quantuml7ai/app/NativeBridge.kt');
    const walletRuntime = fileText('components/WalletRuntimeBridge.jsx');
    const authReturn = fileText('mobile/android/app/src/main/java/com/quantuml7ai/app/AuthReturnActivity.kt');

    expect(main).toContain('WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)');
    expect(main).toContain('allowFileAccess = false');
    expect(main).toContain('allowUniversalAccessFromFileURLs = false');
    expect(main).toContain('mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW');
    expect(main).toContain('safeBrowsingEnabled = true');
    expect(main).toContain('setGeolocationEnabled(true)');
    expect(main).toContain('onGeolocationPermissionsShowPrompt');
    expect(main).toContain('PermissionRequest.RESOURCE_VIDEO_CAPTURE');
    expect(main).toContain('PermissionRequest.RESOURCE_AUDIO_CAPTURE');
    expect(main).toContain('MediaStore.ACTION_IMAGE_CAPTURE');
    expect(main).toContain('MediaStore.ACTION_VIDEO_CAPTURE');
    expect(main).toContain('MediaStore.Audio.Media.RECORD_SOUND_ACTION');
    expect(main).toContain('handler.cancel()');
    expect(main).toContain('onRenderProcessGone');
    expect(main).toContain('CookieManager.getInstance().flush()');
    expect(main).toContain('urlPolicy.isBlockedByKillSwitch(target)');
    expect(main).toContain('override fun onNewIntent(intent: Intent)');
    expect(main).toContain('override fun onCreateWindow(');
    expect(main).toContain('override fun onCloseWindow(window: WebView)');
    expect(main).toContain('setSupportMultipleWindows(true)');
    expect(main).toContain('javaScriptCanOpenWindowsAutomatically = true');
    expect(main).toContain('quantuml7ai://auth/popup-closed');
    expect(main).toContain('popupWebView?.let { notifyWebSurfaceResume(it, source) }');
    expect(main).toContain("CustomEvent('ql7:mobile-return'");
    expect(main).toContain("document.dispatchEvent(new Event('visibilitychange'))");

    expect(config).toContain('remoteKillSwitches');
    expect(config).toContain('isNativeBridgeEnabled');
    expect(config).toContain('isBlockedByKillSwitch');
    expect(config).toContain('paymentMode = "review_pending"');
    expect(config).toContain('allowedDomains = setOf("quantuml7ai.com", "www.quantuml7ai.com")');
    expect(config).toContain('fun isAppReturnUrl(url: String?)');
    expect(config).toContain('fun isExternalOAuthUrl(url: String?)');
    expect(config).toContain('EXTERNAL_OAUTH_HOSTS = setOf("accounts.google.com")');
    expect(config).toContain('fun isTrustedRootUrl(url: String?)');
    expect(main).toContain('urlPolicy.isExternalOAuthUrl(target)');

    expect(bridge).toContain('if (!urlPolicy.isNativeBridgeEnabled()) return');
    expect(bridge).toContain('if (!activity.isCurrentPageTrusted()) return');
    expect(bridge).not.toContain('getAuthToken');
    expect(bridge).not.toContain('getPrivateKey');
    expect(bridge).not.toContain('getSeedPhrase');

    expect(walletRuntime).toContain("native: 'quantuml7ai://wc'");
    expect(walletRuntime).toContain('universal: `${origin}/`');
    expect(authReturn).toContain('Intent(this, QuantumLauncherActivity::class.java)');
    expect(authReturn).toContain('Uri.parse("${BuildConfig.MAIN_URL}$suffix")');
  });

  test('android debug apk and ldplayer workflow is documented and scriptable', () => {
    const decisions = fileText('mobile/android/ANDROID_RELEASE_DECISIONS.md');
    const ldplayer = fileText('mobile/android/LDPLAYER_TESTING.md');
    const buildScript = fileText('mobile/android/tools/build-debug-apk.ps1');
    const releaseScript = fileText('mobile/android/tools/build-release.ps1');
    const installScript = fileText('mobile/android/tools/install-ldplayer.ps1');

    expect(decisions).toContain('applicationId`: `com.quantuml7ai.app`');
    expect(decisions).toContain('Debug APK path');
    expect(decisions).toContain('app-debug.apk');
    expect(decisions).toContain('https://www.quantuml7ai.com/api/app-shell/config');

    expect(ldplayer).toContain('LDPlayer');
    expect(ldplayer).toContain('app/build/outputs/apk/debug/app-debug.apk');
    expect(ldplayer).toContain('.\\tools\\android-doctor.ps1');
    expect(ldplayer).toContain('.\\tools\\build-debug-apk.ps1');
    expect(ldplayer).toContain('.\\tools\\install-ldplayer.ps1');

    expect(buildScript).toContain(':app:assembleDebug');
    expect(buildScript).toContain('app-debug.apk');
    expect(releaseScript).toContain(':app:assembleRelease');
    expect(releaseScript).toContain(':app:bundleRelease');
    expect(releaseScript).toContain('keystore.properties');
    expect(releaseScript).toContain('Quantum L7 AI release 1.0.7.apk');
    expect(releaseScript).toContain('Move-Item -LiteralPath $canonicalApk');
    expect(releaseScript).not.toContain('Copy-Item -LiteralPath $canonicalApk');
    expect(installScript).toContain('adb');
    expect(installScript).toContain('install -r');
  });

  test('android app links bind release and debug packages to real signing fingerprints', () => {
    const assetLinks = JSON.parse(fileText('public/.well-known/assetlinks.json'));
    const release = assetLinks.find((entry) => entry.target?.package_name === 'com.quantuml7ai.app');
    const debug = assetLinks.find((entry) => entry.target?.package_name === 'com.quantuml7ai.app.debug');

    expect(release?.target?.sha256_cert_fingerprints).toContain(
      '3D:7B:28:37:71:93:E6:06:0B:7E:9A:BF:74:4D:AA:F6:8D:02:9B:7C:7C:DA:6F:AF:3D:91:C7:43:2E:FD:A4:42',
    );
    expect(debug?.target?.sha256_cert_fingerprints).toContain(
      '13:E6:62:C2:12:38:D1:C8:BD:12:CF:03:7C:89:85:8A:EE:E6:14:E2:57:3C:0C:EB:3E:79:A4:29:54:EF:F1:5E',
    );
  });

  test('android background notifications keep the Web Push delivery contour wired', () => {
    const sync = fileText('components/AndroidNotificationBadgeSync.jsx');
    const worker = fileText('public/ql7-notification-sw.js');
    const docs = fileText('mobile/android/ANDROID_NOTIFICATIONS.md');
    const dmRuntime = fileText('app/forum/features/dm/hooks/useForumDmRuntime.js');
    const dmUnreadState = fileText('app/forum/features/dm/hooks/useDmUnreadState.js');
    const nativePush = fileText('lib/nativePush.js');
    const fcm = fileText('lib/fcm.js');
    const nativeService = fileText('mobile/android/app/src/main/java/com/quantuml7ai/app/QuantumFirebaseMessagingService.kt');
    const nativeRegistrar = fileText('mobile/android/app/src/main/java/com/quantuml7ai/app/NativePushRegistrar.kt');

    expect(sync).toContain("registration.pushManager.subscribe");
    expect(sync).toContain("'/api/push/subscribe'");
    expect(sync).toContain("'/api/push/unsubscribe'");
    expect(sync).toContain("'/api/push/sync'");
    expect(sync).toContain("fetch('/api/push/events'");
    expect(sync).toContain("payload?.type === 'notification-state-changed'");
    expect(sync).toContain('refreshFromNotificationImpulse()');
    expect(sync).toContain('PUSH_SUBSCRIPTION_FINGERPRINT_STORAGE_KEY');
    expect(sync).toContain('pushSubscriptionRegistrationIsFresh(accountId, fingerprint)');
    expect(sync).toContain('clientOnly: payload?.forceSync !== true');
    expect(sync).toContain('const exactImpulse = Number.isFinite(Number(payload?.count))');
    expect(sync).toContain('/android|iphone|ipad|ipod|mobile|crios|fxios|edgios/i');
    expect(sync).toContain('isIPadOSDesktopMode');
    expect(sync).toContain('readSources');
    expect(sync).toContain('navigator.setAppBadge');
    expect(worker).toContain("self.addEventListener('push'");
    expect(worker).toContain('ql7-notification-');
    expect(worker).toContain('updateLauncherBadge');
    expect(worker).toContain('notificationMatches');
    expect(worker).toContain('current.length === 1');
    expect(docs).toContain('WEB_PUSH_VAPID_PRIVATE_KEY');
    expect(fileText('app/api/dm/send/route.js')).toContain("source: 'messenger_messages'");
    expect(fileText('app/api/forum/mutate/route.js')).toContain("source: 'messenger_replies'");
    expect(fileText('app/api/forum/mutate/route.js')).toContain('minAlertIntervalSeconds: 60');
    expect(fileText('app/api/forum/mutate/route.js')).toContain('dedupeKey: `reply:');
    expect(fileText('app/api/forum/mutate/route.js')).toContain("itemId: String(post?.id || '')");
    expect(fileText('app/api/metamarket/gift/route.js')).toContain("source: 'metamarket_gifts'");
    expect(fileText('lib/webPush.js')).toContain('markPushSourcesRead');
    expect(fileText('lib/webPush.js')).toContain('markPushItemsRead');
    expect(fileText('lib/webPush.js')).toContain("require('./mongo/push-primary.cjs')");
    expect(fileText('lib/webPush.js')).toContain("runtimeState: (userId) => `notif:${shortUserId(userId)}`");
    expect(fileText('lib/webPush.js')).toContain("return `push:events:${shortUserId(rawUserId)}`");
    expect(fileText('lib/webPush.js')).toContain('writeRuntimePushSnapshot(userId, normalized)');
    expect(fileText('lib/webPush.js')).toContain('migrateLegacyPushSubscriptionsToMongo');
    expect(fileText('lib/webPush.js')).toContain('const migrated = await migrateLegacyPushSubscriptionsToMongo(userId, legacy)');
    expect(fileText('lib/mongo/push-primary.cjs')).toContain("const NOTIFICATION_STATES = 'notification_states'");
    expect(fileText('lib/mongo/push-primary.cjs')).toContain("const PUSH_SUBSCRIPTIONS = 'push_subscriptions'");
    expect(fileText('lib/mongo/permanent-policy.cjs')).toContain("push: true");
    expect(fileText('lib/mongo/permanent-policy.cjs')).toContain('including push notification state and push subscriptions');
    expect(fileText('app/forum/features/dm/hooks/useDmRepliesSeen.js')).toContain(
      'readItems: { messenger_replies: freshIds }',
    );
    expect(fileText('lib/webPush.js')).toContain("urgency: intervalSeconds > 0 ? 'normal' : 'high'");
    expect(fileText('public/ql7-notification-sw.js')).toContain("type: 'ql7:notification-received'");
    expect(fileText('components/AndroidNotificationBadgeSync.jsx')).toContain(
      "event?.data?.type !== 'ql7:notification-received'",
    );
    expect(fileText('components/AndroidNotificationBadgeSync.jsx')).toContain(
      'fetchServerState().catch(() => {',
    );
    expect(fileText('components/AndroidNotificationBadgeSync.jsx')).not.toContain(
      'NATIVE_VISIBLE_STATE_REFRESH_MS',
    );
    expect(fileText('mobile/android/app/src/main/java/com/quantuml7ai/app/QuantumNotificationService.kt')).toContain(
      'rememberSourceCount',
    );
    expect(fileText('mobile/android/app/src/main/java/com/quantuml7ai/app/QuantumNotificationService.kt')).toContain(
      'setNumber(sourceCount)',
    );
    expect(fileText('mobile/android/app/src/main/java/com/quantuml7ai/app/QuantumNotificationService.kt')).toContain(
      'channel.setShowBadge(true)',
    );
    expect(fileText('lib/notificationCenter.js')).toContain("SYSTEM: 'system'");
    expect(fileText('lib/notificationCenter.js')).toContain("ADMIN: 'admin'");
    expect(dmRuntime).not.toContain("detail: { source, count: 0, read: true }");
    expect(dmUnreadState).not.toContain('readAt?.messenger_messages');
    expect(nativePush).toContain('createNativePushLink');
    expect(nativePush).toContain('registerNativePushDevice');
    expect(nativePush).toContain('unlinkNativePushDevice');
    expect(nativePush).toContain('tokenDevice');
    expect(nativePush).toContain('sendNativePush');
    expect(fcm).toContain('https://fcm.googleapis.com/v1/projects/');
    expect(nativeService).toContain('class QuantumFirebaseMessagingService');
    expect(nativeService).toContain('NativePushRegistrar.refresh');
    expect(nativeService).toContain('.setNumber(count)');
    expect(nativeRegistrar).toContain('/api/push/native/register');
    expect(nativeRegistrar).toContain('/api/push/native/unlink');
    expect(nativeRegistrar).toContain('retryPendingUnlink');
    expect(sync).toContain("'/api/push/native/link'");
    expect(sync).toContain('quantuml7ai://push-link?nonce=');
    expect(sync).toContain('if (!accountId || !isInstalledAndroidShell()) return false');
    expect(sync).not.toContain('firebase/messaging');
    expect(sync).not.toContain('getToken(');
    expect(fileText('package.json')).not.toContain('"firebase"');
    expect(sync).not.toContain('__QL7_PENDING_NOTIFICATION_READ__');
    expect(sync).toContain('shouldUseForegroundImpulseStream');
    expect(sync).toContain("document.visibilityState !== 'visible'");
    expect(sync).toContain('stopMobileImpulseStream()');
    expect(worker).not.toContain('event.notification.close()');
    expect(fileText('lib/webPush.js')).toContain('record.nativeShell === true && Number(native?.sent || 0) > 0');
    expect(fileText('lib/webPush.js')).toContain('publishMetaMarketGiftImpulse(userId');
    expect(fileText('lib/webPush.js')).toContain(
      'source === NOTIFICATION_SOURCES.METAMARKET_GIFTS',
    );
    expect(fileText('app/api/push/events/route.js')).toContain(
      'Redis.fromEnv().subscribe(notificationImpulseChannel(userId))',
    );
    expect(fileText('app/api/push/events/route.js')).toContain(
      "'content-type': 'text/event-stream; charset=utf-8'",
    );
    expect(fileText('mobile/android/app/build.gradle.kts')).toContain('firebase-messaging');
    expect(fileText('mobile/android/app/build.gradle.kts')).toContain('src/release/google-services.json');
    expect(docs).toContain('FCM_PROJECT_ID');
    expect(docs).toContain('FCM is Android-app-only');
    expect(docs).toContain('Do not install or initialize Firebase Web Messaging in the Web Core');
    expect(docs).toContain('/api/push/native/status');
  });
});
