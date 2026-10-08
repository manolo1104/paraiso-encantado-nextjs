# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server (localhost:3000) — port 3000 may be occupied; use --port 3005 if needed
npm run build     # Production build
npm run start     # Start prod server
npm run lint      # ESLint check
npx tsc --noEmit  # Type-check only (use this before committing)
```

No test suite — verify changes by running `npx tsc --noEmit` and testing in the browser.

## Architecture

**Stack:** Next.js 15 App Router, React 19, TypeScript, Stripe, Google Sheets (as database), Resend (emails), Anthropic SDK (AI chat). Deployed on Railway. Branch: `main-bueno`.

### Booking engine — single source of truth

`lib/booking.ts` contains ALL pricing logic, room data, and cart types. Nothing pricing-related lives anywhere else.

- `BOOKING_ROOMS` — array of 13 rooms with `priceTiers: Record<number, number>` (price by guest count)
- `getRoomNightPrice(room, guests, dateStr, factores?)` — base price, multiplied by the dynamic-pricing factor for that night when `factores` is passed. Without the 4th argument it behaves exactly as before. (The old -$300 Mon–Thu discount was dead since June 15, 2026 and has been removed; the dynamic pricing layer replaces it.)
- `calcRoomStayTotal` — iterates night-by-night applying per-night prices
- `BookingState` — persisted to `sessionStorage` under key `pe_booking_state`; this is how `/reservar` passes data to `/reservar/checkout`

### Dynamic pricing (`/admin/precios`)

One **factor per night shared by the 13 suites** (a %, never a price per suite): `price = redondear50(basePrice × factor)`. Master switch off ⇒ base price everywhere.

- `lib/precios.ts` — pure logic, no I/O (the client imports it through `lib/booking.ts`). Rule types: `temporada` (absolute inclusive date range — `hasta` is the **last night charged**, not a check-out), `finde` (weekdays, ignores `desde`/`hasta` so it spans the whole horizon), `ocupacion`, `ultimahora`. Within a type only the lowest `prioridad` wins; **across types the factors multiply**, then get clipped to the owner's piso/techo.
- `lib/calendario-mx.ts` — the verified Mexican calendar (LFT art. 74 + SEP school calendar, CTE Fridays included). Single source for both the seeded `temporada` rules (`/api/admin/precios/sembrar`) and the text handed to the model, so the AI never has to recall dates from memory.
- `lib/precios-vigentes.ts` — **the only accessor** of the factors actually charged (60 s cache, invalidated on save). Used by `/api/precios` (public), `create-payment-intent` and `guest-info`, so what the guest sees and what is charged cannot diverge. The server never accepts factors from the client.
- `lib/admin/precios-sheets.ts` — tabs `PreciosReglas`, `PreciosDias`, `PreciosHistorial` + `Config` keys `precios_activo`, `precios_piso_pct`, `precios_techo_pct`, `precios_banda_pct`, `precios_ultima_corrida`. Writes overwrite in place and only clear the tail — never `clear` first.
- `lib/admin/precios-motor.ts` (`aplicarReglas`) and `lib/admin/precios-ia.ts` (`analizarDemanda`) are the **two writers of `PreciosDias`**, and their invariants must stay in sync: the past, `origen:'manual'`, pending `propuesto` rows and non-expired `rechazado` rows survive both. `aplicarReglas` additionally never touches any `origen:'ia'` row (hierarchy: manual > IA > rules); `planificarAjustes` is the one that recomputes `ia+aplicado` daily, which is what makes `UMBRAL_ESTABILIDAD` work.
- Read → compute → write runs inside a single `withPreciosLock`. The Anthropic call stays **outside** it (it would hold the lock for a minute).
- `lib/precios-scheduler.ts` fires `/api/cron/precios?auto=1` at 06:00 MX in-process (the Railway cron died silently once). `?auto=1` honours and writes `precios_ultima_corrida` in the sheet, so a redeploy does not pay for a second analysis the same day; the route also refuses concurrent runs with a 409.
- `lib/admin/demanda.ts` — occupancy per night, 7-day booking pace, intent (`ReservasIncompletas`, last 7 days only) and searches (`lib/busquedas.ts`, tab `Busquedas`). A read failure is logged, never degraded to 0 in silence: `ocupacionFiable()` aborts the AI run rather than analyse a hotel that merely *looks* empty.
- **Measurement**: column **R** of `Reservas` stores how many pesos dynamic pricing moved that booking versus list price (PI metadata `dynamicPriceDelta`). `lib/admin/precios-impacto.ts` sums it for the panel card. Without it there is no way to tell whether the system earns money.
- `lib/email-precios.ts` — **daily digest emailed after the 06:00 run only** (never on a panel "Analizar ahora" click). Recipients default to the owner + `marioarturocovarrubias@hotmail.com`, overridable with `PRECIOS_EMAIL_TO` (comma-separated) without a deploy. The subject carries the signal ("3 noches esperan tu visto bueno" / "sin cambios" / "⚠️ la revisión falló"), and it is sent **awaited** — a fire-and-forget send dies with the request. Resend v4 returns `{data, error}` instead of throwing, so `error` is checked explicitly.
- Scope by owner's decision: **web booking engine only**. Admin quotes and the WhatsApp bot keep the base price.
- **Panel UI** (`app/admin/(dashboard)/precios/`): two tabs (Calendario · Mis reglas); pending AI
  proposals live in a banner **outside both tabs** plus a chip strip, because they scatter across
  months and a cell marker hides them. One mini-calendar per suite, same grid as `/admin/calendario`.
  🔴 `desglose.ts` (the per-night "why does it cost this" receipt) **never computes a price**: the
  total comes from `getRoomNightPrice` and the factor from the same map the grid paints — it only
  labels them with `factorPorReglas().aplicadas`. Re-deriving would drift via `redondear50`, via the
  empty-signals call, and via stale stored factors. A cell's % likewise comes from the **factor**,
  never from dividing the rounded price (rounding lands differently on each suite's base).
- 🔴 The sheet holds **one row per night**, so a night with a `propuesto` row has no `aplicado` row
  and is charged at **list price** while it waits — the owner's own season is not charged. Approving
  *or* rejecting fixes it; leaving it pending is the only losing move. The panel says so out loud.

### Reservation flow (4 pages)

1. `/reservar` (`app/reservar/page.tsx`) — date/guest search → room selection → cart. Supports `?rooms=13:4,7:2` to rebuild a cart (recovery email link).
2. `/reservar/checkout` (`app/reservar/checkout/page.tsx`) — **guest info only** (name/email/phone). On submit, POSTs `/api/guest-info`, which writes the half-finished booking to the `ReservasIncompletas` sheet tab. Saves `pe_guest_info` to sessionStorage.
3. `/reservar/pago` (`app/reservar/pago/page.tsx`) — Stripe payment with `automatic_payment_methods` enabled (Apple Pay, Google Pay auto-surfaced on compatible devices). Renews the temp hold every 5 min while open.
4. `/reservar/confirmacion` — reads `pe_booking_state` + `pe_confirmation_number` from sessionStorage

Payment is deliberately AFTER contact capture: a booking that dies in the payment step is a
named lead, not an anonymous cart, and `/api/cron/recuperacion` can email it back.
Both payment paths (`/api/send-confirmation` and the Stripe webhook) call
`markIncompleteAsBooked` so nobody who already paid gets a recovery email.

The temporary hold (10 min, `BloqueosTemporal`) is shared across all three steps via the session
id in `lib/hold-session.ts` — the availability engine excludes a visitor's own hold, so this id
must stay stable or the guest sees their own suite as taken.

### Abandoned bookings (recovery)

`lib/abandoned.ts` — sheet tab `ReservasIncompletas`, one row per hold session (upsert).
`/api/cron/recuperacion` sends reminder 1 at +60 min and reminder 2 at +24 h, never past 5 days
and never for a checkin already in the past; columns `Recordatorio1/2` are the dedup.
`lib/recovery-scheduler.ts` triggers it every 30 min in-process (same reason as the email scheduler).
Emails: `lib/email-recovery.ts`. No discounts on purpose.

**Writes to Sheets use `USER_ENTERED`**, so any guest text starting with `= + - @` (typically a
phone like `+52…`) is parsed as a formula and lands as `#ERROR!`. Guest fields go through
`asText()` in `lib/sheets.ts`; `lib/abandoned.ts` uses `RAW` instead.

### Channel manager / iCal: REMOVED

There is no iCal import or export any more (deleted Aug 2026 — the hotel left Expedia). The
`OTA (…)` values still in the `Disponibilidad` sheet are real past OTA reservations and are now
managed by hand from `/admin/calendario`: "liberar" writes the `ABIERTO` sentinel, "restaurar"
writes `OTA (Expedia)` back. Do not re-add a sync without deciding what happens to those cells.

### Database: Google Sheets via singleton

`lib/sheets.ts` — **all public-facing reads/writes** (availability, bookings, temp blocks). Room names are stored as `"Jungla (2 personas)"` format in the Reservas sheet when created via the web flow — strip `\s*\([^)]*\)` when matching against the ROOMS array.

`lib/admin/sheets-admin.ts` — re-exports `getSheetsClient` from sheets.ts; **all admin dashboard reads/writes**. `AdminBooking` has an `anticipo` field stored in column O, and `deltaPrecioDinamico` in column R (`Reservas` is read as `A:R`).

Both share one Sheets client singleton. The singleton never resets on auth failure — process restart is required if Google auth token expires.

### Admin dashboard (`app/admin/(dashboard)/`)

Protected by JWT cookie set in `/api/admin/login`. Middleware redirects to `/admin/login` if no valid token.

Key admin features:
- **Cotizaciones**: `CotizacionesClient.tsx` — quote forms with per-room price editing, anticipo/restante, notas separadas (client vs internal via `||INTERNO||` separator). PDF uses `printBookingPDF` → `buildBookingHtml` from `lib/booking-html.ts`.
- **Reservas**: `ReservasClient.tsx` — operational states computed from dates (CHECK_IN_HOY, EN_CASA, CHECK_OUT_HOY, etc.), "Hoy" quick view, days-to-arrival column with color coding.
- **Calendario**: Two views — **Disponibilidad** (`AvailabilityCalendar.tsx`) reads from `/api/admin/disponibilidad` (synced with Sheets), and **Timeline** (`GanttView.tsx`) is a Gantt chart. Both normalize room names by stripping `(X personas)`.
- **ReservationModal**: CRM autocomplete on name/email/phone fields (fetches from `/api/admin/clientes`). Success panel after creation with WA/email/PDF/edit actions.

### Email system

`lib/email.ts` — `buildEmailHtml` (table-based confirmation email, original design) + `buildQuoteEmailHtml`.

`lib/booking-html.ts` — `buildBookingHtml` used for the **admin PDF download** and **admin send-email** (`/api/admin/reservas/[id]/send-email`). Both use the same HTML template.

`lib/email-sequences.ts` — HTML builders for the 5 automated sequences.

`/api/cron/email-sequences` — called by Railway cron (`Authorization: Bearer $CRON_SECRET`). Uses range-based date matching (not exact `=== today`) so missed runs recover on the next execution. `sentSet` from Sheets tab `EmailsEnviados` prevents duplicates.

Email sequences timeline:
- `pre_day3`: restaurant upsell, window `[checkin-3, checkin)`
- `pre_checkin`: welcome guide + PDF attachment, window `[checkin, checkin+1]`
- `post_day1`: stay survey, `checkout+1 <= today`
- `post_day7`: Google review request, `checkout+7 <= today`
- `post_day30`: return offer with promo code, `checkout+30 <= today`

### Analytics & tracking

Two parallel systems:
- `lib/analytics.ts` + `trackEvent()` — client-side batching queue, POSTs to `/api/analytics`. Events include `BOOKING_START`, `CART_ABANDON` (fires at **180s**), `BOOKING_SUCCESS`.
- `lib/track.ts` + `track()` — simpler, used only by `TrackingSetup` component.

Both also push to the GTM dataLayer and tag the Clarity recording (`lib/clarity.ts`).

**Microsoft Clarity** (session recordings + heatmaps), project `yu775klmdt`:
- `components/ClarityScript.tsx` — inline `<script>` in the `<head>` of `app/layout.tsx`, same style as the GTM container. **The project id is hardcoded on purpose**: it is public anyway, and in Tours Huasteca a stray quote in the Railway env var left the tag with a syntax error and recorded *nothing* for two days without any warning.
- Who is **not** recorded (guard inside the snippet): `localhost`/`127.0.0.1`/`*.local`, and `/admin` — which also sets `localStorage.pe_interno = '1'` so the hotel's own browser stops being counted as a guest anywhere on the site. To record from localhost on purpose: `localStorage.pe_clarity_debug = '1'`.
- `lib/clarity.ts` — tags each recording with `paso_embudo` (`1·inicio_reserva` … `7·reservó`, `x·abandono`), `suite`, WhatsApp/phone contact events, and `clarity('upgrade')` on the expensive steps so Clarity never samples them away. Hooked into `track()` and `trackEvent()`; never forwards guest data.
- 🔴 Clarity's "balanced" masking hides **form fields only, not text already rendered on screen**. Anything that paints guest data must carry `data-clarity-mask="true"` by hand — currently `/reservar/pago` (guest recap), `/reservar/confirmacion` (booking number) and the checkout form + notes textarea.

### Internationalization (SEO)

Spanish homepage: `/` — `lang="es"`, JSON-LD in `app/page.tsx`.  
English landing page: `/en` — separate route in `app/en/`, targets keywords like "hotel near Edward James surrealist garden". `hreflang` set via `alternates.languages` in both layouts.  
JSON-LD schema (`LodgingBusiness`) lives **only** in `app/page.tsx` (not duplicated in layout).

### Public homepage section order

`Hero → PromoStrip → SocialProofBar → WhyUs → SuitesGrid → AmenitiesGrid → DestinoSection → ToursSection → VIPQuote → Testimonials → NewsletterSection → LocationSection → FAQ → FinalCTA`

`HeroLiveSignals` shows 15–45 viewers, drifts ±5 every 20–40 seconds.

`ToursSection` — "Paquetes hotel + tours": shows the 5 current packages of Tours Huasteca Potosina (Luna de Miel, Familiar, Aventura Extrema, Tu Huasteca, Odisea Huasteca), mirrored in `/paquetes`, with name, duration and subtitle only — **no prices** (owner's decision, Sep 2026). Each card links to `https://www.huasteca-potosina.com/paquetes/<slug>`; the CTA goes to `/paquetes` on that site and to the tours WhatsApp (+52 489 109 0388). Canonical source for tours and packages: repo `INTINERARIO HUASTECA`, branch `main` (`src/lib/tours.ts`, `src/lib/paquetes.ts`); `/experiencias` and the admin `TOURS_CATALOG` copy prices from there.

`NewsletterSection` — captures email via `/api/capture-lead` (saves to Sheets). Positioned after Testimonials.

### Apple Pay

`/api/create-payment-intent` uses `automatic_payment_methods: { enabled: true }`. Apple Pay appears automatically in Safari/iOS when the user has it configured.  
Domain verification file: `app/.well-known/apple-developer-merchantid-domain-association/route.ts` — serves content of `APPLE_PAY_DOMAIN_ASSOC` env var. Must be configured in Stripe Dashboard → Settings → Payment methods → Apple Pay → Add domain.

### Exit intent

`WhatsAppRecoveryWidget` — rendered on `/reservar` and `/reservar/checkout`. Disabled in checkout via `pathname.includes('/checkout')`.  
`ExitIntentPopup` inside `checkout/page.tsx` — also disabled by the same guard.

## Key environment variables

`GOOGLE_SHEETS_CREDENTIALS` (JSON), `GOOGLE_SHEET_ID`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `ADMIN_JWT_SECRET` (JWT del admin — NO `JWT_SECRET`), `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH` (login admin), `AGENT_API_TOKEN` (bot WhatsApp), `CRON_SECRET`, `ANTHROPIC_API_KEY`, `APPLE_PAY_DOMAIN_ASSOC` (optional, for Apple Pay domain verification), `PRECIOS_EMAIL_TO` (opcional, destinatarios del resumen diario de precios separados por coma), `RESEND_FROM` (opcional, remitente), `BOT_NOTIFY_URL` (URL pública del bot WhatsApp, ej. `https://wpp-agent-production-5329.up.railway.app` — usada por `lib/notify-bot.ts` para avisar al grupo Control Hotel de reservas del motor web; si falta, el aviso es no-op silencioso).
