# Mobile Payment Compliance

Quantum L7 AI содержит VIP, QCoin, MetaMarket, цифровые элементы и будущие игровые механики. Поэтому mobile payment flow должен быть заложен осторожно.

## Категории

Digital goods / digital access:

- VIP;
- QCoin;
- MetaMarket items;
- digital collections;
- future game items;
- premium features.

Для этой категории могут потребоваться Apple In-App Purchase и Google Play Billing.

Physical goods / external services:

- future Quantum Zigzag;
- реальные товары;
- внешние услуги.

Для этой категории внешний payment provider может быть допустим, но только после проверки правил магазина и законодательства.

## Default mode

До юридического и store-compliance решения используется:

```text
paymentMode: "review_pending"
```

## Запрещено

- выпускать внешний payment flow для digital goods без проверки правил App Store / Google Play;
- хранить payment secrets в mobile shell;
- исполнять платежи через native bridge без server validation;
- доверять client-side суммам.

