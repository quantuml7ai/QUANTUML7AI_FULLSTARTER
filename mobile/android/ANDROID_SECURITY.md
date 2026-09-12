# Android Shell Security Notes

## Runtime hardening

- `usesCleartextTraffic=false`.
- `network_security_config.xml` запрещает cleartext traffic.
- SSL errors отменяются через `SslErrorHandler.cancel()`.
- WebView debugging включён только в debug-сборке.
- Unknown domains не загружаются внутри основного WebView.
- Main WebView разрешает только HTTPS production domains из allowlist.
- External wallet/payment links открываются вне WebView через OS intent.
- JavaScript bridge минимален и доступен только при trusted WebView navigation.

## Запрещённые данные в shell

Android shell не должен хранить:

- private keys;
- seed phrases;
- auth tokens;
- payment secrets;
- wallet signatures;
- cookies в logs;
- private messages/media в diagnostics.

## Release secrets

В репозиторий нельзя добавлять:

- `.jks` / `.keystore`;
- `keystore.properties`;
- Google Play service account JSON;
- NOWPayments, wallet, auth или backend secrets.

Все release-секреты должны жить в локальном secure storage или CI secrets.

