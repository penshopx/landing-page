---
name: Dual-auth active-session parity
description: Protected routes must recognize both OIDC and email sessions while enforcing the same account-revocation policy.
---

**Rule:** Never use `req.isAuthenticated()` as the sole login check in this project. Protected middleware and middleware-free special branches (such as a paid gate inside a public chat route) must use the same shared authentication checker so OIDC and `session.emailUser` identities are normalized identically.

**Why:** Email-session buyers were rejected by paid status/admin routes when only Passport auth was checked. Accepting the email-session ID directly fixed login but accidentally let inactive or blocked users keep using a paid stream. Identity recognition and active-account revocation must remain one policy.

**How to apply:** Use the shared checker for protected routes. If a route must stay public and cannot mount auth middleware globally, call the shared checker only inside its protected branch. Test happy paths for both auth modes plus inactive/blocked denial with no quota or state mutation.