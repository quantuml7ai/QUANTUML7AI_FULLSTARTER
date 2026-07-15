# Android Acceptance Checklist

## Native Shell

- [ ] `.\tools\android-doctor.ps1` показывает готовность Android toolchain.
- [ ] `.\tools\build-debug-apk.ps1` создаёт `app-debug.apk`.
- [ ] `.\tools\install-ldplayer.ps1` ставит APK в LDPlayer.
- [ ] WebView открывает `https://www.quantuml7ai.com`.
- [ ] Нет белого flash на cold start.
- [ ] Native Back сначала идёт по WebView history.
- [ ] Unknown domains не открываются внутри shell.
- [ ] External wallet/payment links открываются через OS intent.
- [ ] Remote config кэшируется и имеет safe default.
- [ ] Force update блокирует runtime.
- [ ] Maintenance mode показывает shell-state.
- [ ] Renderer crash восстанавливает WebView без падения приложения.
- [ ] Cookies flush происходят при pause/stop/destroy.

## Security

- [ ] `usesCleartextTraffic=false`.
- [ ] SSL errors cancel, не proceed.
- [ ] WebView debugging выключен в release.
- [ ] Dangerous file access выключен.
- [ ] Native bridge работает только с trusted origin.
- [ ] Backup/data transfer не забирает auth/local shell data.
- [ ] Release secrets не лежат в репозитории.

## Store Readiness

- [ ] `applicationId` утверждён.
- [ ] Release keystore создан вне repo.
- [ ] SHA256 fingerprint утверждён.
- [ ] `assetlinks.json` опубликован после утверждения signing strategy.
- [ ] Google Play payment policy проверена.
- [ ] Internal testing пройден на реальных устройствах.

## Web Core Boundary

- [ ] Forum работает как в браузере.
- [ ] Quantum Wallet работает как в браузере.
- [ ] MetaMarket работает как в браузере.
- [ ] Messenger/media/Q-Cast работают через Web Core.
- [ ] Shell не дублирует бизнес-логику.
