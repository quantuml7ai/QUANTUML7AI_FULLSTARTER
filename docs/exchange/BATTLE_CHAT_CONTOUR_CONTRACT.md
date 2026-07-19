# Battle Chat Contour Contract

Battle Chat is an isolated BattleCoin surface. It must not be implemented through forum snapshots, BattleCoin state polling, or durable Redis storage.

## Source Of Truth

- Durable messages live only in Mongo collection `battlecoin_chat_messages`.
- Durable likes live only in Mongo collection `battlecoin_chat_likes`.
- Cooldown, minute rate limits, and session hard limits live in Mongo collection `battlecoin_chat_sender_state`.
- Redis may only publish compact transient realtime impulses through `battlecoin:chat:events:v1`; payloads contain only `type`, `channel`, `messageId`, `syncToken`, timestamp, and Mongo-primary metadata.
- Redis BattleChat events must never contain message text, author profiles, avatars, aliases, like rows, or full message DTOs. Clients hydrate compact impulses through `GET /api/battlecoin/chat/messages` Mongo deltas.

## API Boundary

- Public reads use `GET /api/battlecoin/chat/messages`.
- Authenticated message sends use `POST /api/battlecoin/chat/messages`.
- Authenticated likes use `POST /api/battlecoin/chat/reaction`.
- Public realtime events use `GET /api/battlecoin/chat/events`.
- `app/api/battlecoin/state/route.js` must not return chat messages or chat likes.

## Auth Boundary

- Client send/like actions must use `runAuthorizedClientAction`.
- Server mutations must verify wallet session token or Telegram Mini App `initData`.
- Request body `accountId`, nickname, avatar, wallet, or Telegram identifiers are never trusted as ownership proof.

## UI Boundary

- The chat UI lives under `app/exchange/battle-chat/`.
- The chat UI must not import forum runtime, forum snapshots, or forum feed state.
- BattleCoin trading logic, QCoin balances, VIP leverage, active orders, and history settlement are separate from chat and must remain independently testable.
- BattleCoin visual styling may be upgraded only through the scoped BattleCoin/BattleChat surfaces. It must not replace `QuantumWalletLaunchButton`, alter order mutation handlers, change balance polling semantics, or move durable chat state into the BattleCoin state route.
- BattleChat must render only the `Battle Chat` SVG brand and the animated live status in the chat header. The old subtitle/badge text such as "Live market talk for BattleCoin" must not be rendered or kept as a chat dictionary key.
- Message rows use rail-separated segments, forum-style avatar/nickname identity, localized nickname-copy action labels, localized copy-success toasts, and a right-side outline heart counter. The nickname lives in the left author column under the enlarged avatar, never inside the message body; its text must fit inside the badge, and the timestamp badge lives below that nickname with its own spacing. The nickname `title`/`aria-label` describes the action before click; the copied text appears only after the click succeeds.
- The composer keeps the character counter in the top-left notch, keeps quick emoji and icon-only send controls inside the input, and preserves two visual rails: the taller rail between the text field and emoji zone, and the smaller rail between selected emoji and the send envelope. The input must clamp pasted or typed content to 300 graphemes, not merely display an over-limit counter.
- The send envelope must be visually disabled until the message can be submitted; pressing Enter in the textarea submits the current message, while quick emoji buttons are `type="button"` and must not capture Enter as repeated emoji insertion.
- Quick emoji selection opens upward, sends the chosen emoji as its own message, remembers the last emoji on the picker, and uses localized `aria-label` text from the active dictionary.
- Emoji-only messages sit centered inside the message body and use distinct per-emoji animation classes that activate on hover/focus/attention rather than running continuously through the whole list. Heart, angry, fire, rocket, money, rich, diamond, market, bolt, and joy effects must have separate supporting particles/keyframes.
- The latest-message button appears only when the user has scrolled away from the tail; sending a local message returns the list to the latest message.
- The BattleCoin header and control surfaces use the MetaMarket-aligned cyan/gold/violet style layer with responsive grids. Text badges such as `Quantum Futures`, leverage buttons, VIP controls, symbol selectors, and history tabs must not break into one-letter columns or overflow their containers at narrow widths.
- The desktop BattleCoin history card may have horizontal overflow for table columns, but its inner vertical body must flex to the full available card height instead of becoming a short nested scroller.
- Active BattleCoin orders must be enriched from the realtime market source. If the bulk market list does not include the active symbol or reports a zero price, the state route must probe the active symbol directly before returning order PnL/change data.

## Privacy Boundary

- Public chat author payloads expose only `kind`, public display `nickname`, public `avatar`, and a hashed public key.
- Wallet addresses, Telegram IDs, raw aliases, and technical nicknames must not be exposed in chat messages.
- Technical or missing nicknames render as the existing Anonymous profile with `/anonymous/anonymous.png`.

This contract is enforced by `tests/contracts/project/battlecoin-chat-contracts.test.js` and unit tests for validation and Mongo-primary behavior.
