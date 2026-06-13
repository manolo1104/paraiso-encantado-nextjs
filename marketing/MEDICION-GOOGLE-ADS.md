# Medición de Google Ads — cómo saber qué reservas vienen de los anuncios

> **Estado:** ✅ Lo del **código YA está hecho** (falta desplegarlo). Queda la parte de
> **tu cuenta** (Google Ads + GTM), que necesita tus IDs y se hace en la web — aquí están los pasos.

## ✅ Qué dejé listo en el código
En tu página de gracias (`/reservar/confirmacion`) ahora se dispara automáticamente un
evento **`purchase`** (formato ecommerce de GA4) cada vez que se concreta una reserva,
con: **número de reserva** (`transaction_id`), **monto total** (`value`, en MXN) y las
habitaciones. Ese evento entra a tu **Google Tag Manager** (`GTM-N98DFD9V`, ya instalado).

Eso es la pieza que faltaba. Ahora hay que decirle a GTM/Google Ads "cuando pase ese
evento, cuéntalo como conversión".

---

## 🪜 Pasos en tu cuenta (hazlo tú o quien lleve tus ads)

### 1) En Google Ads — crear la conversión
1. **Herramientas → Conversiones → + Nueva acción de conversión → Sitio web.**
2. Categoría: **Compra**. Nombre: `Reserva web`.
3. Valor: **Usar valores diferentes** (lo manda el código). Moneda: **MXN**.
4. Recuento: **Una** (una reserva = una conversión).
5. Método de configuración: elige **Google Tag Manager**. Te dará un **ID de conversión** (`AW-XXXXXXXXX`) y una **etiqueta de conversión** (un código). Cópialos.

### 2) En Google Tag Manager (`GTM-N98DFD9V`)
1. **Activador (trigger):** nuevo → tipo **Evento personalizado** → nombre del evento: `purchase`.
2. **Variables** (de capa de datos): crea
   - `DLV - value` → `ecommerce.value`
   - `DLV - transaction_id` → `ecommerce.transaction_id`
   - `DLV - currency` → `ecommerce.currency`
3. **Etiqueta (tag) 1 — Conversión de Google Ads:**
   - Tipo: *Seguimiento de conversiones de Google Ads*.
   - ID de conversión + Etiqueta: los del paso 1.
   - Valor de conversión: `{{DLV - value}}` · Moneda: `{{DLV - currency}}` · ID de transacción: `{{DLV - transaction_id}}`.
   - Activador: `purchase`.
4. **Etiqueta 2 — Conversion Linker** (si no existe): tipo *Vinculador de conversiones*, activador **All Pages**. (Necesario para que se atribuya bien.)
5. **Publica** el contenedor (botón *Enviar* arriba a la derecha).

### 3) (Opcional pero recomendado) GA4
Si ya tienes GA4 dentro de GTM, agrega también una etiqueta **GA4 Event** para el evento
`purchase` con los datos de ecommerce. Luego en GA4 márcalo como **evento clave** y
**vincula GA4 con Google Ads** para importar la conversión. Así mides en los dos lados.

---

## 🔍 Cómo verificar (5 min, sin adivinar)
1. En GTM, dale a **Vista previa (Preview)** e ingresa la URL de tu sitio.
2. Haz una **reserva de prueba** (o pídele a quien lleve ads que use el modo prueba de Stripe).
3. Al llegar a la página de confirmación, en el panel de GTM Preview debe aparecer el evento
   **`purchase`** y la etiqueta de conversión **disparada (fired)** con el valor y el número de reserva.
4. En 24-48 h, Google Ads → **Conversiones** empezará a mostrar "Reserva web" con su valor.

---

## 💡 Para qué sirve (la decisión que destraba)
Cuando esté midiendo, vas a ver en Google Ads:
- **Cuántas reservas** y **cuánto ingreso** vienen de los anuncios.
- El **costo por reserva**.

**La regla de oro:** si tu costo por reserva en Google Ads es **menor que la comisión** que te
cobran Booking/Expedia (~15-18% del valor de la reserva), **conviene meterle más a Google Ads**
— y eso justifica reasignar parte del presupuesto de la agencia (ver `REASIGNACION-PRESUPUESTO.md`).

> Nota: Google **deduplica** por `transaction_id` (ya lo mandamos), así que una misma reserva
> no se cuenta dos veces aunque el cliente recargue la página de gracias.
