# QL7 QCoin Synthetic Ledger Canary v53

Marker: `QL7_QCOIN_LEDGER_SYNTHETIC_CANARY_V53`.

This stage proves the QCoin Mongo ledger helper with a synthetic account only. It must not call app routes, topup/webhook/provider routes, mutate real balances, enable cutover, enable dual-write, or run Redis cleanup.

Allowed smoke scope:

- insert exact canary-only Mongo ledger/idempotency/projection/reconciliation docs;
- verify duplicate idempotency replay is ignored;
- verify account projection delta equals ledger sum;
- cleanup only exact canary docs;
- leave Redis primary behavior unchanged.
