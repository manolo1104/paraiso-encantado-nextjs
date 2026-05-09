# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server (localhost:3000)
npm run build     # Production build
npm run start     # Start prod server
npm run lint      # ESLint check
npx tsc --noEmit  # Type-check only
```

No test suite — verify changes by running `npx tsc --noEmit` and testing in the browser.

## Architecture

**Stack:** Next.js 15 App Router, React 19, TypeScript, Stripe, Google Sheets (as database), Resend (emails), Anthropic SDK (AI chat). Deployed on Railway.

### Booking engine — single source of truth

`lib/booking.ts` contains ALL pricing logic, room data, and cart types. Nothing pricing-related lives anywhere else.

- `BOOKING_ROOMS` — array of 13 rooms with `priceTiers: Record<number, number>` (price by guest count)
- `getRoomNightPrice(room, guests, dateStr)` — applies weekday discount (-$300 MXN Mon–Thu). **From June 15, 2026 onwards: no discount, same price all week.**
- `calcRoomStayTotal` — iterates night-by-night applying per-night prices
- `BookingState` — persisted to `sessionStorage` under key `pe_booking_state`; this is how `/reservar` passes data to `/reservar/checkout`

### Reservation flow (3 pages)

1. `/reservar` (`app/reservar/page.tsx`) — date/guest search → room selection → cart → proceed to checkout
2. `/reservar/checkout` (`app/reservar/checkout/page.tsx`) — Stripe payment, guest info form, exit-intent popup disabled by `pathname.includes('/checkout')`
3. `/reservar/confirmacion` — reads `pe_booking_state` + `pe_confirmation_number` from sessionStorage

### Database: Google Sheets via singleton

`lib/sheets.ts` — **all public-facing reads/writes** (availability, bookings, temp blocks).  
`lib/admin/sheets-admin.ts` — re-exports `getSheetsClient` from sheets.ts; **all admin dashboard reads/writes**.

Both share one Sheets client singleton (`let sheetsClient`). The singleton never resets on auth failure — if the Google auth token expires the singleton stays stale until process restart.

No timeout is set on any Sheets API call. If Google Sheets is slow, requests hang indefinitely and can cause Railway restarts.

### Analytics & tracking

Two parallel systems:
- `lib/analytics.ts` + `trackEvent()` — client-side batching queue, POSTs to `/api/analytics`. Events: `BOOKING_START`, `CART_ABANDON` (fires at **180s** in both `/reservar` and `/reservar/checkout`), `CHECKOUT_STEP_*`, `BOOKING_SUCCESS`, etc.
- `lib/track.ts` + `track()` — simpler, used only by `TrackingSetup` component (fires `ver_pagina`, `ver_seccion`, `salir_pagina`).

### Admin dashboard

`app/admin/(dashboard)/` — protected by JWT cookie set in `/api/admin/login`. Middleware at `middleware.ts` redirects to `/admin/login` if no valid token.

AI chat at `/api/admin/ai-chat` fetches all bookings + metrics from Sheets then calls Anthropic SDK. No timeout — hangs if Sheets is slow.

### Exit intent

`WhatsAppRecoveryWidget` — rendered on both `/reservar` and `/reservar/checkout`. Uses `pathname.includes('/checkout')` to disable itself in checkout.  
`ExitIntentPopup` inside `checkout/page.tsx` — also disabled by `pathname.includes('/checkout')` guard.

### Email sequences

`/api/cron/email-sequences` — called by Railway cron, requires `Authorization: Bearer $CRON_SECRET`. Sends welcome guides, post-stay surveys, review requests, and return-offer emails based on booking dates.

## Key environment variables

`GOOGLE_SHEETS_CREDENTIALS` (JSON), `GOOGLE_SHEET_ID`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `JWT_SECRET`, `CRON_SECRET`, `ANTHROPIC_API_KEY`.
