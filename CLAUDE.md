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
- `getRoomNightPrice(room, guests, dateStr)` — applies weekday discount (-$300 MXN Mon–Thu). **From June 15, 2026 onwards: no discount, same price all week.**
- `calcRoomStayTotal` — iterates night-by-night applying per-night prices
- `BookingState` — persisted to `sessionStorage` under key `pe_booking_state`; this is how `/reservar` passes data to `/reservar/checkout`

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

`lib/admin/sheets-admin.ts` — re-exports `getSheetsClient` from sheets.ts; **all admin dashboard reads/writes**. `AdminBooking` has an `anticipo` field stored in column O.

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

### Internationalization (SEO)

Spanish homepage: `/` — `lang="es"`, JSON-LD in `app/page.tsx`.  
English landing page: `/en` — separate route in `app/en/`, targets keywords like "hotel near Edward James surrealist garden". `hreflang` set via `alternates.languages` in both layouts.  
JSON-LD schema (`LodgingBusiness`) lives **only** in `app/page.tsx` (not duplicated in layout).

### Public homepage section order

`Hero → PromoStrip → SocialProofBar → WhyUs → SuitesGrid → AmenitiesGrid → DestinoSection → ToursSection → VIPQuote → Testimonials → NewsletterSection → LocationSection → FAQ → FinalCTA`

`HeroLiveSignals` shows 15–45 viewers, drifts ±5 every 20–40 seconds.

`ToursSection` — "Paquetes hotel + tours": shows the 5 current packages of Tours Huasteca Potosina (Luna de Miel, Familiar, Aventura Extrema, Tu Huasteca, Odisea Huasteca), mirrored in `/paquetes`, with name, duration and subtitle only — **no prices** (owner's decision, Sep 2026). Each card links to `https://www.huasteca-potosina.com/paquetes/<slug>`; the CTA goes to `/paquetes` on that site and to the tours WhatsApp (+52 489 125 1458). Canonical source for tours and packages: repo `INTINERARIO HUASTECA`, branch `main` (`src/lib/tours.ts`, `src/lib/paquetes.ts`); `/experiencias` and the admin `TOURS_CATALOG` copy prices from there.

`NewsletterSection` — captures email via `/api/capture-lead` (saves to Sheets). Positioned after Testimonials.

### Apple Pay

`/api/create-payment-intent` uses `automatic_payment_methods: { enabled: true }`. Apple Pay appears automatically in Safari/iOS when the user has it configured.  
Domain verification file: `app/.well-known/apple-developer-merchantid-domain-association/route.ts` — serves content of `APPLE_PAY_DOMAIN_ASSOC` env var. Must be configured in Stripe Dashboard → Settings → Payment methods → Apple Pay → Add domain.

### Exit intent

`WhatsAppRecoveryWidget` — rendered on `/reservar` and `/reservar/checkout`. Disabled in checkout via `pathname.includes('/checkout')`.  
`ExitIntentPopup` inside `checkout/page.tsx` — also disabled by the same guard.

## Key environment variables

`GOOGLE_SHEETS_CREDENTIALS` (JSON), `GOOGLE_SHEET_ID`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `ADMIN_JWT_SECRET` (JWT del admin — NO `JWT_SECRET`), `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH` (login admin), `AGENT_API_TOKEN` (bot WhatsApp), `CRON_SECRET`, `ANTHROPIC_API_KEY`, `APPLE_PAY_DOMAIN_ASSOC` (optional, for Apple Pay domain verification), `BOT_NOTIFY_URL` (URL pública del bot WhatsApp, ej. `https://wpp-agent-production-5329.up.railway.app` — usada por `lib/notify-bot.ts` para avisar al grupo Control Hotel de reservas del motor web; si falta, el aviso es no-op silencioso).
