# Android notification center

Quantum L7 AI uses the verified TWA notification delegation path. The Web Core aggregates:

- unread direct messages;
- unread replies to the user's posts;
- unseen MetaMarket gifts.

The notification center keeps separate source branches:

- `messenger_messages` opens Quantum Messenger messages and is delivered immediately;
- `messenger_replies` opens comments/replies and is rate-limited to one alert per minute;
- `metamarket_gifts` opens MetaMarket user collections and is delivered immediately;
- `system` and `admin` are reserved extension points for future platform notifications.

Each branch has its own notification tag, localized body and destination. The launcher badge remains
the aggregate of all active unread branches. Reading a branch updates its real unread count, closes
the corresponding notification and subtracts it from the launcher total.

The service worker reconciles an existing source notification instead of closing and recreating an
unchanged notification during focus or visibility synchronization. One DM, gift or aggregated reply
alert therefore produces one user-visible notification until its source count actually changes.

Redis is the canonical unread/read-state owner. Browser storage is only a local cache, so reading a
branch on one device removes the matching notification and launcher-badge share on every device
using the same authenticated account. Repeated delivery of one DM, reply or gift transaction is
blocked by a server-side deduplication key.

Comment/reply events are protected from notification noise. The first event opens a 60-second Redis
alert window. Further replies inside that window increase the accumulated counter without producing
more alerts. The first event after the window sends one notification with the accumulated count.

`QuantumNotificationService` preserves delegated notifications and maps the localized notification
body's numeric count into a persisted per-source counter. It enables notification-channel badges,
keeps each active notification's source count accurate and removes a source when its delegated
notification is cancelled. Compatible launchers aggregate these source counts into the app badge;
the Web Badging API writes the same canonical total directly where supported.

Android launcher behavior is controlled by the device vendor:

- some launchers show the exact number;
- Pixel Launcher commonly shows a notification dot;
- users can disable notification dots or notification permission in system settings.

Xiaomi/Redmi devices additionally require notification badges and background activity to be allowed
for Quantum L7 AI and Chrome in MIUI/HyperOS settings. Android does not permit applications to grant
these vendor settings silently. Immediate DM and gift pushes use high urgency; aggregated replies use
normal urgency and remain limited to one visible alert per minute.

The root service worker also owns a server-driven Web Push/VAPID delivery pipeline. Once the user
grants notification permission, the Web Core stores the browser push subscription under the
authenticated canonical account in Redis. New direct messages, replies and MetaMarket gifts
increment the server-side unread counter and wake the service worker even when the TWA is closed.
Expired push endpoints are removed automatically.

Production requires these server-only environment variables:

- `WEB_PUSH_VAPID_PUBLIC_KEY`
- `WEB_PUSH_VAPID_PRIVATE_KEY`
- `WEB_PUSH_VAPID_SUBJECT`

Generate one stable VAPID pair once and install the same values in local development and Vercel.
Never expose or rotate the private key during routine releases, otherwise existing device
subscriptions stop receiving background notifications.

Verification flow:

1. Install the release APK and sign in.
2. Grant the Android notification permission and the origin notification permission.
3. Close the TWA completely.
4. From another account, send a direct message, reply to a post, or send a MetaMarket gift.
5. Confirm that Android receives a source-specific localized notification and updates the launcher badge/dot.
6. Open each notification and confirm that it routes to Messenger messages, Messenger replies or MetaMarket collections.
7. Read the events and confirm that the source notification and its share of the launcher count disappear.

Android 13 and newer require `POST_NOTIFICATIONS`. `QuantumLauncherActivity` requests this runtime
permission and the Web Core requests the origin notification grant after the first trusted
interaction in standalone/TWA mode. A revoked Android permission is checked again on the next app
launch. A permanently denied permission and Xiaomi background/badge restrictions must be enabled by
the user in system settings; Play-compliant applications cannot force-enable them.

## Native Firebase Cloud Messaging

The Android release also supports a native FCM transport independent of Chrome background delivery.
The canonical unread state, deduplication and one-minute reply aggregation remain in Redis; FCM is
only another transport for the same event.

**FCM is Android-app-only.** It is linked only after the authenticated page is running inside the
installed `com.quantuml7ai.app` shell and completes the signed `quantuml7ai://push-link` return.
Ordinary Chrome, desktop browsers, PWAs and the Web Core continue using the existing Web Push/VAPID
subscription and service worker. If native delivery is unavailable, an installed app's delegated
Web Push subscription remains a fallback instead of silently losing the notification.

Do not install or initialize Firebase Web Messaging in the Web Core. Firebase client code and
`google-services.json` belong only to `mobile/android`; browser delivery must remain on
`PushManager` + VAPID so ordinary web sessions keep their established permission, delivery and
service-worker behavior.

The account/device link is intentionally two-step:

1. the authenticated Web Core requests a five-minute one-time nonce;
2. `quantuml7ai://push-link` hands that nonce to the signed Android application;
3. Android exchanges the nonce plus its FCM token for a random device id and secret;
4. later Firebase token rotations are authenticated with that device credential.

The Android application never chooses or submits an account id. This prevents a modified client
from attaching its token to another user's notifications.

Firebase setup required for a real release:

1. In Firebase Console create or select the production Firebase project.
2. Add Android app package `com.quantuml7ai.app`.
3. Add the release SHA-256 fingerprint from `ANDROID_RELEASE.md`:
   `3D:7B:28:37:71:93:E6:06:0B:7E:9A:BF:74:4D:AA:F6:8D:02:9B:7C:7C:DA:6F:AF:3D:91:C7:43:2E:FD:A4:42`.
4. Download the production `google-services.json` to
   `mobile/android/app/src/release/google-services.json`.
5. To test native FCM in the debug package, also add Firebase Android app
   `com.quantuml7ai.app.debug` with the debug SHA-256 from `ANDROID_RELEASE.md`, then save its
   configuration as `mobile/android/app/src/debug/google-services.json`.
6. A single `mobile/android/app/google-services.json` containing both Firebase Android clients is
   also supported, but separate build-type files reduce accidental debug/release mixing.
7. Enable Firebase Cloud Messaging API for the Firebase/Google Cloud project.
8. Create a server service account with the `Firebase Cloud Messaging API Admin` role and
   download its JSON only to a secure local location. Never place that JSON in the repository.
9. Copy only these fields from the service-account JSON into Vercel server environment variables:
   - `FCM_PROJECT_ID` = JSON field `project_id`;
   - `FCM_CLIENT_EMAIL` = JSON field `client_email`;
   - `FCM_PRIVATE_KEY` = JSON field `private_key`.
10. Apply those variables to Production and the preview environment used for testing, then redeploy
    the Web Core.
11. Rebuild and reinstall the APK/AAB after adding `google-services.json`; an already-built APK
    cannot acquire Firebase configuration from Vercel.

`FCM_PRIVATE_KEY` is server-only. In Vercel it can be pasted as the multiline private key. In a
local `.env.local`, escaped `\n` newlines are accepted. Never prefix any FCM secret with
`NEXT_PUBLIC_`.

`google-services.json`, the service-account JSON and private keys are ignored by Git. If the Android
Firebase file or server variables are absent, the existing Web Push contour remains available and
the project still builds.

### Activation and verification

1. Deploy the Web Core with `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL` and `FCM_PRIVATE_KEY`.
2. Build and install the release APK containing
   `mobile/android/app/src/release/google-services.json`.
3. Sign in inside the installed Android app and grant notification permission.
4. The Web Core creates a five-minute one-time nonce and opens `quantuml7ai://push-link`; the signed
   Android app exchanges it for a native device id/secret and returns with `ql7NativePush=linked`.
5. While authenticated, request `GET /api/push/native/status` with the normal project auth headers.
   Expected production state: `{ "ok": true, "configured": true, "linkedDevices": 1 }` or a larger
   linked-device count.
6. Close the app and send a DM/gift from another account. The native notification must arrive
   without Chrome being open.
7. Reply alerts remain aggregated to at most one visible alert per minute; DM and gifts remain
   immediate.
8. Read the actual content. The server sends a silent native sync, removes that source notification
   and subtracts its count from the launcher badge.
9. Log out. Android securely unlinks the native device. If the network is temporarily unavailable,
   the pending unlink is retried on the next app launch.

Troubleshooting:

- `configured: false`: one or more Vercel `FCM_*` values are missing or the deployment was not
  restarted after adding them.
- `configured: true`, `linkedDevices: 0`: the installed APK does not contain the correct
  `google-services.json`, Firebase could not issue a token, or the signed app has not completed the
  `push-link` return after login.
- Native notification absent but Web Push arrives: native FCM delivery failed and the designed
  browser fallback protected delivery. Check the Firebase package, SHA-256, Cloud Messaging API and
  service-account permissions.
- Emulator receives no native FCM token: use an emulator image with compatible Google Play services.
  Firebase Messaging depends on Google Play services; plain AOSP emulator images cannot complete
  the native FCM path.
- Xiaomi/Redmi: allow notifications, badge/dot, autostart and unrestricted/background activity for
  Quantum L7 AI. Android does not allow the application to force these vendor settings.

Native notification taps open the exact source route with `ql7Notice`; after the concrete DM, reply
or gift is actually read, the canonical server state sends a silent FCM sync that removes the
matching native notification and updates the launcher badge. Opening Messenger tabs alone does not
mark their contents read.
