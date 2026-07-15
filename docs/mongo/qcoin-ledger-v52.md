# QL7 QCoin Ledger Static Schema v52

Status marker: `QL7_QCOIN_LEDGER_SCHEMA_STATIC_V52`.

This stage adds static ledger helper/schema definitions only. It does not call app routes, does not write MongoDB, does not mutate Redis, and does not enable write cutover.

Collections prepared for the next stages:

- `qcoin_ledger_events`: append-only ledger mirror.
- `qcoin_account_balances`: Mongo balance projection mirror.
- `qcoin_idempotency`: dedupe guard.
- `qcoin_reconciliation_runs`: evidence reports.

Forbidden until separate approval:

- topup webhook smoke,
- provider/payment calls,
- real user balance mutation,
- Redis cleanup/delete,
- write cutover / dual-write enablement.
