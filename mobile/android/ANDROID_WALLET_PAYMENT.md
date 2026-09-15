# Android Wallet And Payment Flows

## Authentication browser boundary

Release authentication runs in the verified Trusted Web Activity browser context. Do not move only the
Google account page into an external browser while keeping Web3Modal in the embedded WebView: that
separates `window.opener`, cookies and browser storage and leaves AppKit in a pending state.

The supported return flow is:

1. Web3Modal/AppKit starts inside the Trusted Web Activity.
2. Google or a wallet completes authentication in the same Chrome profile.
3. HTTPS App Links return directly to the Trusted Web Activity.
4. `quantuml7ai://wc` and `quantuml7ai://auth` are accepted by `AuthReturnActivity`, which restores the
   Trusted Web Activity at the production Web Core URL.

Wallet и payment flows открываются вне основного WebView. Native shell не хранит платёжные секреты, не подписывает транзакции и не выступает кошельком.

## Wallet links

Поддерживаемые схемы кошельков задаются allowlist-политикой Android shell. Неизвестные custom schemes блокируются.

При WalletConnect/AppKit авторизации:

1. WebView создаёт pending-запрос.
2. Кошелёк или Google открывается снаружи.
3. После подтверждения приложение принимает `quantuml7ai://wc`, `quantuml7ai://auth` либо trusted HTTPS App Link.
4. Возврат обрабатывается в существующем `MainActivity` и существующем WebView.
5. Frontend получает `ql7:mobile-return`, `focus`, `online` и `visibilitychange`, после чего wagmi/AppKit может завершить pending-сессию.

Custom callback не должен перезагружать WebView: это уничтожило бы исходный pending-запрос WalletConnect.

## Payment links

Разрешённые payment domains открываются вне основного WebView. Возврат в приложение допускается только через trusted Quantum L7 AI URL или утверждённый custom return scheme.

Платёж считается подтверждённым только после серверной проверки и webhook. Сам факт возврата в приложение не является доказательством оплаты.

## Store compliance

До финального решения по Google Play Billing / external payment policy remote config сохраняет:

```text
paymentMode = review_pending
```

Нельзя включать спорные digital-goods payment сценарии в mobile release без юридической и store-review проверки.
