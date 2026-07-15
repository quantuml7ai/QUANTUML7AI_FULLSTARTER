# Quantum L7 AI iOS Native Shell

Эта папка зарезервирована под официальный iOS Native Shell проекта Quantum L7 AI.

На текущем этапе здесь не создается полноценное iOS-приложение и не дублируется логика Web Core. iOS Shell должен стать отдельной нативной оболочкой, которая открывает production Web Core:

```text
https://www.quantuml7ai.com
```

## Роль iOS Shell

- запускать Quantum L7 AI Web Core внутри безопасного WKWebView;
- поддерживать Universal Links и Associated Domains;
- поддерживать camera/microphone/photo/file flows через нативные permissions;
- давать premium splash, offline screen и native Back/Close поведение;
- собираться отдельно через Xcode Archive для TestFlight и App Store.

## Что нельзя делать

- переписывать Web Core в native;
- хранить чувствительные данные в UserDefaults;
- отключать ATS или добавлять произвольные insecure loads;
- логировать cookies, tokens, payment data или wallet secrets;
- коммитить certificates, provisioning profiles или App Store Connect API keys.

## Будущая сборка

Когда iOS skeleton будет создан, сборка должна выполняться на macOS через Xcode:

```text
mobile/ios/QuantumL7AI.xcodeproj
```

Далее:

```text
Product -> Archive -> Distribute App
```

В TestFlight/App Store отправляется только собранный iOS archive/ipa, а не весь репозиторий.

