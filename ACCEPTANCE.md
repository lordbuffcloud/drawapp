# Acceptance Checklist — Drawing Tutorial Poster Web App (MVP)

Use this as the definition of done. Each item should be verifiable in a running build.

## Poster layout correctness (deterministic composition)
- [ ] Generated poster contains **exactly 7 panels** in a consistent grid.
- [ ] Gutters/margins are **consistent** across all panels.
- [ ] Each panel has a **thin border** (consistent stroke width).
- [ ] The **only text on the poster** is “Step 1”, “Step 2”, … “Step 7”.
- [ ] Step labels appear in consistent position, size, and style across panels.
- [ ] Composition is programmatic/deterministic (not a one-shot “poster prompt” layout).

## Output formats (printable)
- [ ] User can download **PNG** for a generated poster.
- [ ] User can download **PDF** for a generated poster.
- [ ] PDF supports **US Letter** size with correct dimensions and margins.
- [ ] PDF supports **A4** size with correct dimensions and margins.
- [ ] Print output is crisp (no unexpected scaling artifacts; borders/labels remain readable).

## Free quota (1 per user per day)
- [ ] First free generation of the day succeeds for a new/eligible user.
- [ ] Second free generation on the same day is blocked with a clear upgrade/message.
- [ ] Quota resets the next day (based on canonical day boundary, e.g., UTC).
- [ ] Quota is enforced **server-side via KV** (not just client state).
- [ ] Quota keying uses **device id + IP hash** (no raw IP stored).

## Anti-abuse protections
- [ ] Turnstile is **required** for free-tier generation requests.
- [ ] Turnstile token is **verified server-side** (reject invalid/missing tokens).
- [ ] Server enforces basic **per-minute rate limit** (KV-backed).
- [ ] Attempts to bypass quota by modifying client state do not work.

## Pro unlock (Lemon Squeezy)
- [ ] UI provides a Lemon Squeezy **checkout link** (from config/env).
- [ ] Entering a **valid license key** unlocks Pro.
- [ ] Pro status persists via an **httpOnly cookie** (not localStorage).
- [ ] Pro status is revalidated **at least daily** server-side.
- [ ] Invalid/expired license keys fail gracefully with clear messaging.

## Gallery (global shared tutorials)
- [ ] User can publish a generated poster to the public gallery.
- [ ] Publish creates a **public entry** with a **thumbnail**.
- [ ] Gallery lists **recent** items (newest first).
- [ ] Gallery supports basic **search** and/or **filter by style**.
- [ ] Gallery item detail view loads the poster preview/downloads without leaking secrets.

## PWA installability
- [ ] App includes a valid web app **manifest**.
- [ ] App has required **icons** referenced by the manifest.
- [ ] App is **installable** (passes basic install criteria in browser).
- [ ] Service worker registered to cache at least the app shell (offline shell loads).

## Security, privacy, and secrets
- [ ] No secrets are present in client bundle (no API keys/tokens).
- [ ] Server-only secrets are read from env vars and never logged.
- [ ] No **raw IP** is stored anywhere (only salted hash).
- [ ] Logs avoid PII (no raw IP, no license keys, no full prompts/uploads).


