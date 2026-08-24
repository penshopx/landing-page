---
name: Scalev hosted payment authority
description: Why a hosted checkout confirmation page must not be treated as a settled payment
---

# Scalev hosted checkout payment status

**Rule:** Treat Scalev's provider `payment_status=paid` (and the corresponding webhook) as the sole authority for fulfillment and Purchase tracking. Do not infer payment from the hosted-page headline such as “Order Anda telah dikonfirmasi”.

**Why:** The hosted page can show a confirmation headline and access CTA while the provider API still reports `unpaid`; no local order, entitlement, webhook Purchase, or CAPI Purchase should exist in that state. The page also displayed duplicate-looking access cards even though provider variants showed a quantity of one.

**How to apply:** When a buyer reports payment, query the provider order reference and show only non-PII fields (status, amount, product/quantity). If still unpaid after a short propagation wait, tell them not to pay again blindly: first verify their banking/QRIS receipt and use the provider's payment support path if funds were deducted.