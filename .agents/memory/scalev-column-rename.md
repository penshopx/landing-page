---
name: Scalev column rename (was Mayar)
description: mayar_order_id / mayar_payment_url renamed to scalev_order_id / scalev_payment_url in all tables and code
---

# Scalev Column Rename

## Rule
`mayar_order_id` and `mayar_payment_url` no longer exist. All references use `scalevOrderId` / `scalevPaymentUrl` (TS) and `scalev_order_id` / `scalev_payment_url` (SQL).

**Why:** Mayar was replaced by Scalev as payment provider. Columns kept the old name causing confusion for new developers.

**How to apply:** Any new code that stores a payment order ID or checkout URL on a subscription row must use `scalevOrderId` / `scalevPaymentUrl`. Never reference the old mayar names.

## Tables affected
- `client_subscriptions` — renamed via ALTER TABLE (done)
- `subscriptions_new` — renamed via ALTER TABLE (done)
- `subscriptions` (server/db/schema.ts legacy stub) — table does NOT exist in DB; schema stub updated for consistency

## Storage method renamed
`getSubscriptionByMayarOrderId` → `getSubscriptionByScalevOrderId` (storage.ts + db-storage.ts)
