# Testing Checklist — Optimizaciones de Conversión

Versión: 2026-04-24

---

## 1. Tracking

- [ ] `PAGE_VIEW` se loggea al cargar cualquier página
- [ ] `BOOKING_START` se loggea al entrar a `/reservar`
- [ ] `DATES_SELECTED` se loggea al seleccionar fechas
- [ ] `GUEST_COUNT_CHANGED` se loggea al cambiar personas
- [ ] `SUITE_SELECTED` se loggea al hacer click en "Reservar →"
- [ ] `CHECKOUT_STEP_1` se loggea junto con `SUITE_SELECTED`
- [ ] `CHECKOUT_STEP_2` se loggea al cargar el form de checkout
- [ ] `FORM_FIELD_COMPLETE` se loggea al salir de cada campo
- [ ] `BOOKING_ATTEMPT` se loggea al hacer click en "Pagar"
- [ ] `BOOKING_SUCCESS` se loggea tras pago exitoso
- [ ] `BOOKING_ERROR` se loggea si falla Stripe
- [ ] `CART_ABANDON` se loggea si pasan 60s en `/reservar` sin click
- [ ] `SUITE_ENTER` se loggea al cargar página de suite
- [ ] `SUITE_EXIT` se loggea al salir de página de suite
- [ ] `STICKY_CTA_SHOWN` se loggea cuando aparece la barra sticky
- [ ] `STICKY_CTA_CLICK` se loggea al hacer click en barra sticky
- [ ] `SCROLL_DEPTH_25/50/75/100` se logean correctamente
- [ ] `EXIT_INTENT_TRIGGER` se loggea al mover mouse fuera (desktop)
- [ ] `EXIT_POPUP_SHOWN` se loggea cuando aparece popup WhatsApp
- [ ] `EXIT_POPUP_CONVERT` se loggea cuando se hace click en WhatsApp del popup
- [ ] Session ID (`sess_XXXXX`) es consistente entre páginas
- [ ] Eventos en localStorage se envían en la próxima sesión si falló el envío anterior

---

## 2. UX — Página `/reservar`

- [ ] `ReservationUrgencyBar` visible en el tope de la página
- [ ] Punto verde parpadeante visible en "X personas viendo ahora"
- [ ] Número de viewers cambia cada 15–30s (rango 2–5)
- [ ] Nombre de última reserva rota cada 60s
- [ ] Timer cuenta regresiva desde 10:00 a 00:00
- [ ] `TIMER_EXPIRED` se loggea al llegar a 00:00
- [ ] `CheckoutProgressBar` muestra paso 1 activo (dorado)
- [ ] `TrustBadgesReservar` muestra 4 badges
- [ ] `RecentBookingsTicker` rota cada 5s con fade

---

## 3. UX — CTA Sticky en suites

- [ ] Barra sticky no visible al cargar (`visible=false`)
- [ ] Barra sticky aparece después de 3 segundos
- [ ] Barra sticky aparece al bajar 300px (lo que ocurra primero)
- [ ] Click en barra sticky navega a `/reservar?suiteId=XXX`
- [ ] En mobile: barra fija en la parte inferior
- [ ] En desktop: barra fija en la parte superior (debajo del navbar)
- [ ] Animación slide-up/down funciona sin flicker
- [ ] No tapa contenido importante

---

## 4. UX — WhatsApp Recovery Popup

- [ ] Popup aparece a los 3 minutos en `/reservar` sin completar
- [ ] Popup aparece si mouse sale por arriba (exit intent, desktop only)
- [ ] Popup NO se muestra más de 1 vez por visita
- [ ] Botón "Chatear por WhatsApp" abre `wa.me/524891007679?text=...`
- [ ] Mensaje de WhatsApp incluye contexto (suite + fechas si están seleccionadas)
- [ ] Botón "No gracias" cierra el popup
- [ ] Popup se cierra solo después de 30s si no hay interacción
- [ ] En mobile: animación slide-up desde abajo
- [ ] En desktop: animación fade-in centrado
- [ ] Overlay oscuro cubre el fondo; click en overlay cierra popup

---

## 5. Checkout `/reservar/checkout`

- [ ] `CheckoutProgressBar` muestra paso 2 activo
- [ ] Tracking de `FORM_FIELD_COMPLETE` funciona en cada campo
- [ ] `BOOKING_ATTEMPT` se loggea al submit
- [ ] `BOOKING_SUCCESS` se loggea tras pago exitoso con número de confirmación
- [ ] `BOOKING_ERROR` se loggea con mensaje de error de Stripe
- [ ] WhatsApp recovery widget activo en checkout (aparece a los 3min)
- [ ] Campos tienen `inputMode` correcto (email, tel)
- [ ] `autoComplete` configurado en todos los campos

---

## 6. Mobile (prioridad — 95% del tráfico)

- [ ] `ReservationUrgencyBar` no causa scroll horizontal
- [ ] `TrustBadgesReservar` muestra 2 columnas en mobile
- [ ] Sticky CTA en bottom fijo, no tapa el input de fechas
- [ ] WhatsApp popup slide-up desde abajo en mobile
- [ ] Todos los botones mínimo 44px de altura
- [ ] Exit intent NO dispara en mobile (mouse no aplica)
- [ ] Los timers siguen funcionando en mobile

---

## 7. Performance

- [ ] `npm run build` sin errores de TypeScript
- [ ] Sin errores en consola del navegador
- [ ] Los eventos de analytics NO bloquean la UI (async)
- [ ] Timers se limpian correctamente en `useEffect` cleanup (no memory leaks)
- [ ] `StickySuiteCTA` no causa layout shift (inicia invisible)
- [ ] `ReservationUrgencyBar` no causa CLS (altura fija)

---

## 8. Proceso end-to-end

- [ ] Flujo completo: Inicio → Suite → `/reservar` → Checkout → Confirmación
- [ ] Todos los eventos se logean correctamente en Railway durante este flujo
- [ ] El sticky CTA en suite navega correctamente con `suiteId` en query
- [ ] El checkout pre-selecciona la suite correcta al llegar desde sticky CTA
- [ ] Email de confirmación llega al ingresar datos válidos

---

## Comandos para verificar

```bash
# TypeScript check
npx tsc --noEmit

# Build
npm run build

# Dev server
npm run dev

# Testear endpoint de analytics localmente
curl -X POST http://localhost:3000/api/analytics \
  -H "Content-Type: application/json" \
  -d '{"events":[{"event":"TEST","data":{"ok":true},"path":"/test"}]}'
# Expected: {"ok":true,"received":1}
```
