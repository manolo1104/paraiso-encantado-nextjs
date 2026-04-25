# Tracking Test Guide — Paraíso Encantado

## Cómo verificar eventos

Todos los eventos llegan al log de Railway con el formato:
```
[inf] 🎯 EVENT_NAME data={...} path=/ruta ip=X.X.X.X sid=sess_XXXX
```

Para testear localmente, abre **DevTools → Network** y filtra por `analytics`.
Cada request POST a `/api/analytics` debe tener un array `events`.

---

## Checklist de eventos por página

### Página de inicio `/`
| Evento | Cómo disparar | Expected log |
|--------|--------------|--------------|
| `PAGE_VIEW` | Cargar la página | `🎯 PAGE_VIEW data={"path":"/"}` |

### Páginas de suite `/habitaciones/[id]`
| Evento | Cómo disparar | Expected log |
|--------|--------------|--------------|
| `PAGE_VIEW` | Cargar página de suite | `🎯 PAGE_VIEW data={"path":"/habitaciones/jungla"}` |
| `SUITE_ENTER` | Al montar `StickySuiteCTA` | `🎯 SUITE_ENTER data={"suite":"jungla"}` |
| `STICKY_CTA_SHOWN` | Esperar 3s o bajar 300px | `🎯 STICKY_CTA_SHOWN data={"suite":"jungla"}` |
| `STICKY_CTA_CLICK` | Click en "Reservar →" sticky | `🎯 STICKY_CTA_CLICK data={"suite":"jungla","price":1900}` |
| `SUITE_EXIT` | Navegar a otra página | `🎯 SUITE_EXIT data={"suite":"jungla"}` |
| `SCROLL_DEPTH_25` | Bajar 25% de la página | `🎯 SCROLL_DEPTH_25 data={"depth":25}` |
| `SCROLL_DEPTH_50` | Bajar 50% de la página | `🎯 SCROLL_DEPTH_50 data={"depth":50}` |
| `SCROLL_DEPTH_75` | Bajar 75% de la página | `🎯 SCROLL_DEPTH_75 data={"depth":75}` |
| `SCROLL_DEPTH_100` | Bajar al fondo | `🎯 SCROLL_DEPTH_100 data={"depth":100}` |
| `EXIT_INTENT_TRIGGER` | Mover mouse fuera de la ventana (arriba) | `🎯 EXIT_INTENT_TRIGGER` |
| `TIME_ON_PAGE_30s` | Quedarse 30s sin navegar | `🎯 TIME_ON_PAGE_30s` |
| `TIME_ON_PAGE_60s` | Quedarse 60s | `🎯 TIME_ON_PAGE_60s` |
| `TIME_ON_PAGE_180s` | Quedarse 3min | `🎯 TIME_ON_PAGE_180s` |

### Página de reservas `/reservar`
| Evento | Cómo disparar | Expected log |
|--------|--------------|--------------|
| `PAGE_VIEW` | Cargar `/reservar` | `🎯 PAGE_VIEW data={"path":"/reservar"}` |
| `BOOKING_START` | Cargar `/reservar` | `🎯 BOOKING_START` |
| `URGENCY_BAR_VIEW` | Al montar `ReservationUrgencyBar` | `🎯 URGENCY_BAR_VIEW` |
| `TIMER_STARTED` | Al montar `ReservationUrgencyBar` | `🎯 TIMER_STARTED` |
| `TIMER_EXPIRED` | Esperar 10 minutos | `🎯 TIMER_EXPIRED` |
| `DATES_SELECTED` | Seleccionar check-in y check-out | `🎯 DATES_SELECTED data={"checkin":"...","checkout":"..."}` |
| `GUEST_COUNT_CHANGED` | Cambiar el selector de personas | `🎯 GUEST_COUNT_CHANGED data={"guests":3}` |
| `SUITE_SELECTED` | Click en "Reservar →" de cualquier suite | `🎯 SUITE_SELECTED data={"suite":"jungla"}` |
| `CHECKOUT_STEP_1` | Click en "Reservar →" | `🎯 CHECKOUT_STEP_1 data={"suite":"jungla","checkin":"..."}` |
| `CART_ABANDON` | Estar 60s en `/reservar` sin click | `🎯 CART_ABANDON data={"timeOnPage":60}` |
| `EXIT_POPUP_SHOWN` | Mover mouse fuera (3min en página) | `🎯 EXIT_POPUP_SHOWN data={"reason":"exit_intent"}` |
| `WHATSAPP_RECOVERY_CLICK` | Click "Chatear por WhatsApp" en popup | `🎯 WHATSAPP_RECOVERY_CLICK data={"reason":"..."}` |
| `EXIT_POPUP_CONVERT` | Click en WhatsApp del popup | `🎯 EXIT_POPUP_CONVERT` |

### Página de checkout `/reservar/checkout`
| Evento | Cómo disparar | Expected log |
|--------|--------------|--------------|
| `PAGE_VIEW` | Cargar checkout | `🎯 PAGE_VIEW data={"path":"/reservar/checkout"}` |
| `CHECKOUT_STEP_2` | Al montar `PayForm` | `🎯 CHECKOUT_STEP_2 data={"suite":"...","totalMxn":...}` |
| `FORM_FIELD_COMPLETE` | Completar y salir de cada campo | `🎯 FORM_FIELD_COMPLETE data={"field":"nombre"}` |
| `BOOKING_ATTEMPT` | Click en "Pagar" | `🎯 BOOKING_ATTEMPT data={"suite":"...","totalMxn":...}` |
| `CHECKOUT_STEP_3` | Click en "Pagar" | `🎯 CHECKOUT_STEP_3` |
| `PAYMENT_METHOD_SELECTED` | Pago exitoso con Stripe | `🎯 PAYMENT_METHOD_SELECTED data={"method":"stripe"}` |
| `BOOKING_SUCCESS` | Pago completado | `🎯 BOOKING_SUCCESS data={"confirmationNumber":"PE..."}` |
| `BOOKING_ERROR` | Error de tarjeta | `🎯 BOOKING_ERROR data={"error":"..."}` |

---

## Testear desde consola del navegador

```javascript
// Disparar evento manualmente (DevTools console)
fetch('/api/analytics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    events: [{
      event: 'TEST_EVENT',
      data: { test: true },
      sid: 'sess_test',
      path: '/test',
      timestamp: Date.now()
    }]
  })
}).then(r => r.json()).then(console.log);
```

---

## Troubleshooting común

**No aparecen eventos en logs:**
1. Verifica que el build haya compilado sin errores: `npm run build`
2. Confirma que `/api/analytics` responde: `curl -X POST http://localhost:3000/api/analytics -H 'Content-Type: application/json' -d '{"events":[]}'`
3. Revisa la pestaña Network en DevTools — ¿hay requests a `/api/analytics`?

**Events se envían pero no llegan a Railway:**
- En desarrollo (`npm run dev`) los logs aparecen en la terminal local
- En producción, verlos en Railway → Deployments → Logs

**STICKY_CTA no aparece:**
- Verifica que el componente `StickySuiteCTA` esté importado en la suite page
- Revisa la consola por errores de `lib/analytics`

**WhatsApp popup aparece demasiado pronto:**
- Los timers son 3min (booking_abandoned) y 5min (stuck_in_step)
- Exit intent funciona moviendo el mouse hacia arriba, fuera de la ventana
- En mobile no hay exit intent; solo timers

**localStorage lleno:**
- El sistema limita la cola a 50 eventos máximo
- Limpiar: `localStorage.removeItem('pe_analytics_queue')`
