# PRD — Printable Step-by-Step Drawing Tutorial Posters

## Problem statement
People want to learn to draw specific subjects (characters, objects, animals, logos, etc.) quickly. Existing tutorials are hard to print consistently, not styled cohesively, and rarely optimized for a clean “poster” format that can be printed and shared.

## Target user
- Hobby artists / beginners who want clear, printable step-by-step drawing guides
- Teachers/parents who want quick, kid-friendly drawing activity sheets
- Creators who want to publish and share tutorials in a consistent visual format

## MVP scope (must-haves)
The MVP produces a printable 7-step tutorial poster from a prompt (and optionally a user reference image), supports downloads, has a subscription paywall, rate-limits free usage with anti-abuse, is installable as a PWA, and includes a global gallery.

### a) Prompt + optional image upload → poster
- User inputs a text prompt describing what to draw.
- User may upload an optional reference image to guide the drawing tutorial.
- System produces a **7-step** drawing tutorial poster:
  - **Deterministic composition**: 7-panel grid, consistent gutters, thin borders, and only “Step 1..7” labels (no extra text on the poster).
  - Style is chosen from presets or a custom style string.

### b) Download PNG/PDF
- User can download:
  - PNG (screen + print)
  - PDF (print-optimized) with correct sizes for **US Letter** and **A4**

### c) Lemon Squeezy paywall
- Free users can generate within quota rules.
- Pro is unlocked via Lemon Squeezy:
  - Checkout link (hosted by Lemon Squeezy)
  - Unlock Pro via **license key validation**
  - Pro status persists via secure session (httpOnly cookie)

### d) 1 free/day with anti-abuse
- One free poster generation per “user” per day.
- Anti-abuse measures:
  - Turnstile required for free generation (server-side verification).
  - Server-enforced quotas in KV.
  - Basic per-minute rate limiting.
  - Identify user by a composite of device cookie + **hashed IP** (no raw IP storage).

### e) PWA installability
- Installable PWA with:
  - Web app manifest
  - App icons
  - Service worker for offline shell (at minimum) and asset caching

### f) Global shared tutorials gallery
- Users can publish their generated tutorial poster to a shared public gallery.
- Users can browse recent posters and view details.
- Basic search/filter by style.

### g) Styles: presets + custom
- Provide style presets (e.g., “Minimal pencil”, “Ink outline”, “Kid-friendly bold”, “Manga sketch”).
- Allow a custom style text field that influences generation.

## Non-goals (explicitly out of scope for MVP)
- Full user accounts/passwords/social login
- Multi-page posters, variable step counts, or advanced layout editing
- Collaborative editing, comments, likes/follows
- Localized UI translations
- Full moderation tooling dashboard (beyond basic safety checks and takedown mechanism)

## User experience flows

### Free user flow
1. Land on create page.
2. Enter prompt, pick a style preset or add custom style.
3. (Optional) Upload reference image.
4. Complete Turnstile challenge.
5. Generate poster:
   - If within daily free quota and rate limits: generation proceeds.
   - If quota exceeded: user sees paywall/upgrade prompt.
6. Preview poster.
7. Download PNG and/or PDF (Letter/A4).
8. Optionally publish to gallery.

### Pro user flow
1. User purchases via Lemon Squeezy checkout or enters an existing license key.
2. Server validates license key and sets Pro session via httpOnly cookie.
3. Pro user can generate without free-tier daily limits (still with basic platform rate limit protections).
4. Download and publish behave the same as free.

### Publish to gallery flow
1. After poster generation, user chooses “Publish”.
2. User provides minimal metadata (optional title; style; prompt visibility rules as defined).
3. System stores poster assets (thumbnail + full poster).
4. System creates public gallery entry.
5. Gallery page shows newest first; supports simple search/filter by style.

## Poster generation & composition (deterministic requirement)
- The system must not rely on a one-shot “make me a poster” prompt to place text/panels.
- Instead:
  - Generate or derive 7 step images (e.g., 7 incremental drawings) based on the prompt + style (+ optional reference image).
  - Programmatically compose:
    - Fixed 7-panel grid
    - Consistent gutters and margins
    - Thin borders
    - Only “Step 1” … “Step 7” labels
  - Output must be reproducible given the same inputs (within model stochasticity) because layout is deterministic.

## Data model

### KV keys (examples)
- `quota:free:{day}:{deviceId}:{ipHash}` → `{ count, firstAt }`
  - `day` formatted as `YYYY-MM-DD` in a chosen canonical timezone (e.g., UTC)
  - `count` increments per successful generation
- `ratelimit:gen:{minuteBucket}:{ipHash}` → `{ count }`
- `session:pro:{sessionId}` → `{ isPro, licenseKeyHash, lastValidatedAt }`
- `license:cache:{licenseKeyHash}` → `{ status, plan, expiresAt, lastCheckedAt }` (optional cache)
- `gallery:item:{id}` → gallery metadata payload
- `gallery:index:recent` → list/ordered set of recent IDs (implementation-dependent)
- `gallery:search:style:{styleSlug}` → index to support filtering (implementation-dependent)

### Blob objects (examples)
Store binary assets (images/PDF) in a blob store.
- `posters/{posterId}/full.png`
- `posters/{posterId}/letter.pdf`
- `posters/{posterId}/a4.pdf`
- `posters/{posterId}/thumb.jpg` (or png/webp)
- `steps/{posterId}/step-1.png` … `step-7.png` (optional, depending on architecture)

### Gallery metadata (example fields)
- `id` (public identifier)
- `createdAt`
- `stylePresetId` / `styleName`
- `customStyle` (optional)
- `promptPublic` (boolean) and `prompt` (optional / redacted if false)
- `posterBlobKey` (full poster)
- `thumbBlobKey`
- `sizes` (available formats)
- `tags` (optional; MVP can omit)

## Security & privacy notes
- **No raw IP storage**: if IP is used for quota/rate limiting, store only a salted hash (e.g., HMAC).
- **Minimal retention**: store only what is required for quotas, Pro session state, and gallery entries.
- **Uploads are untrusted**:
  - Validate content type and size.
  - Store in blob storage; do not log or expose raw content in logs.
- **License key security**:
  - Store only a hash of license key in KV/session where possible.
  - Revalidate periodically (at least daily) server-side.
- **Webhook/signature optional**:
  - If using webhooks: verify signature.
  - If not using webhooks: rely on server-side license validation API on unlock and periodic re-check, and document the trade-offs.

## API endpoints (MVP list)
(Names/paths are indicative; actual implementation must keep secrets server-side.)

### Auth/session
- `POST /api/pro/unlock` — validate Lemon Squeezy license key; set httpOnly Pro session cookie
- `POST /api/pro/refresh` — revalidate Pro session (at least daily) and refresh cookie
- `POST /api/logout` — clear session

### Generation
- `POST /api/generate` — generate 7 steps + compose poster; enforces Turnstile (free), quota, and rate limit
- `GET /api/poster/{id}` — fetch poster metadata (public-safe)
- `GET /api/poster/{id}/download?format=png|pdf&size=letter|a4` — signed download or proxy download

### Gallery
- `POST /api/gallery/publish` — publish a poster to public gallery
- `GET /api/gallery/recent` — list recent public items
- `GET /api/gallery/search?query=&style=` — basic search/filter
- `GET /api/gallery/item/{id}` — fetch a specific gallery item

### Anti-abuse / verification
- `POST /api/turnstile/verify` (optional) — verify token server-side; may be folded into `/api/generate`

## Environment variables
All secrets must be server-only.

### AI / generation
- `OPENAI_API_KEY`
- `OPENAI_IMAGE_MODEL`

### Lemon Squeezy
- `LEMONSQUEEZY_API_KEY`
- `LEMONSQUEEZY_CHECKOUT_URL`

### Turnstile (Cloudflare)
- `TURNSTILE_SITE_KEY` (public; safe to expose as a site key)
- `TURNSTILE_SECRET_KEY` (secret; server-only)

### Blob storage
- `BLOB_READ_WRITE_TOKEN`

### Vercel KV
- KV envs as provided by Vercel (e.g., `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`)


