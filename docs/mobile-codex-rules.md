# Mobile Codex Rules

Codex должен работать с mobile shell поэтапно и хирургически.

## Разрешенные зоны для foundation-этапа

- `mobile/`
- `docs/mobile-*.md`
- `public/.well-known/`
- `app/api/app-shell/config/route.js`

## Запрещенные зоны без отдельного разрешения

- `app/forum/`
- `app/api/forum/`
- `components/`
- `shared/`
- текущие Forum, Wallet, MetaMarket, Messenger, VideoFeed API;
- текущая бизнес-логика Web Core;
- `package.json`, если нет крайней необходимости.

## Отчет после этапа

Каждый этап должен сообщать:

- какие файлы созданы;
- какие файлы изменены;
- какие Web Core модули не трогались;
- какие риски остались;
- какие проверки выполнены;
- какой следующий шаг.

## Проверки

После структурных изменений:

```powershell
pnpm project:docs:full
pnpm test:codex
```

`pnpm test:codex` является канонической финальной проверкой проекта.

