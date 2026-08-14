# Mobile Monorepo Workflow

Quantum L7 AI развивается как единый репозиторий, где Web Core, Android Shell, iOS Shell и документация живут рядом, но собираются и публикуются отдельно.

## Разрешенная структура

```text
app/                 Web Core routes
components/          Web Core components
public/              public assets and .well-known
mobile/android/      Android Native Shell
mobile/ios/          iOS Native Shell
docs/mobile-*.md     mobile architecture and release docs
```

## Публикация

- Web Core деплоится на Vercel.
- Android собирается отдельно в `.aab`.
- iOS собирается отдельно через Xcode Archive.

Магазины не получают весь репозиторий. Они получают только собранные мобильные артефакты.

## Ветки

Рекомендуемая схема:

```text
main
develop
feature/mobile-shell-v3-foundation
feature/mobile-android-shell
feature/mobile-ios-shell
release/web-vX.Y.Z
release/android-vX.Y.Z
release/ios-vX.Y.Z
hotfix/mobile-config
```

## Контроль изменений

Любые изменения в Web Core должны проверяться отдельно. Mobile-only изменения не должны ломать Vercel build и не должны требовать изменения текущей бизнес-логики.

Codex работает этапами:

1. foundation docs and structure;
2. app-shell config;
3. Android skeleton;
4. Android WebView and permissions;
5. iOS skeleton;
6. iOS WKWebView and permissions;
7. wallet/payment return;
8. store package.

