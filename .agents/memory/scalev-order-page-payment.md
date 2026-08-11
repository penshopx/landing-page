---
name: Scalev /o/ order page & payment methods
description: Why an API-created Scalev v3 order's public URL can show no VA/payment selector
---
The `/o/{secret_slug}` page on the store custom domain IS Scalev's hosted Nuxt SPA (scalev-fe-public), not a Gustafta wrapper. It renders purely from `GET https://api.scalev.com/v2/order/public/{secret_slug}`.

**Rule:** the page can only offer payment options from `store.payment_accounts` in that payload. If the store has NO payment accounts attached at store level (`/v2/stores/{id}/payment-accounts` empty), the order page shows only status + WhatsApp — no VA, no selector — even if business-level payment accounts and `xendit_va_bank_codes` exist.

**Why:** v3 `POST /orders` creates a `draft` order with `payment_method: null`; the /o/ page is an order-status/invoice page. Payment method is normally chosen in the checkout FORM flow (`/p/...`) before order creation, or must come from store-attached payment accounts.

**Nuance:** store-level `payment_methods` (e.g. `va_mandiri`) and `xendit_va_bank_codes` apply to the checkout FORM / payment-link flow only — they do NOT surface on the /o/ order page. Xendit VA is not a payment-account object (`/v2/payment-accounts` lists only manual bank_transfer accounts), so "attach VA to store" may only exist as a dashboard-side setting, if at all.

**How to apply:** for API-created orders to be payable via their public URL, attach payment accounts (bank transfer / Xendit VA) to the STORE in the Scalev dashboard, or set payment fields on the order. Verify by checking `store.payment_accounts` in the public order payload.
