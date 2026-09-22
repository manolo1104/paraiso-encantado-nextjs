# Campaña «Paraíso Encantado — WhatsApp» · septiembre 2026

> Objetivo: que la gente que busca dónde dormir en Xilitla **te escriba por WhatsApp**.
> Construida con las búsquedas reales de Search Console (últimos 6 meses), no con suposiciones.

---

## ⛔ Antes de encenderla: 3 cosas que la bloquean

| # | Bloqueo | Quién lo resuelve |
|---|---|---|
| 1 | **La cuenta tiene saldo vencido de $2,207.47 MXN.** Google muestra «No se están publicando sus anuncios». Mientras no se pague, ninguna campaña se publica. | **Manolo** (no puedo meter datos de tarjeta) |
| 2 | **Ningún objetivo de conversión funciona.** Google marca «Compra» y «Visita a tienda» como *Configuración incorrecta*, y otros cuatro como *Requiere atención*. | Claude + Manolo en GTM |
| 3 | **El sitio no avisaba de los clics a WhatsApp.** `lib/track.ts` mandaba todo a un `console.log` de Railway. Ya está arreglado: ahora también empuja al `dataLayer`. | ✅ hecho, falta desplegar |

Encender la campaña sin el punto 2 repite exactamente lo que ya pasó: **$11,609 MXN gastados y 1 conversión registrada** en la campaña anterior.

---

## Configuración

| Ajuste | Valor | Por qué |
|---|---|---|
| Tipo | Búsqueda | Lo demás (Display, Pmax) no sirve para intención de reserva con este presupuesto |
| Redes | **Solo Búsqueda de Google** | Apagar «socios de búsqueda» y «Display»: se comen el presupuesto sin intención |
| Presupuesto | **$120 MXN/día** (~$3,650/mes) | Sale de pausar las palabras que llevan 3 meses gastando sin resultado, no de dinero nuevo |
| Puja | **Maximizar clics, tope $12 MXN/clic** las primeras 3 semanas | Google no puede optimizar por conversiones si nunca ha visto una. Cuando haya ~30, se cambia a «Maximizar conversiones» |
| Ubicación | México · CDMX, Monterrey, Querétaro, Guadalajara, San Luis Potosí, Puebla, Tampico | Son las ciudades reales de tus visitantes en Analytics (CDMX 1,940 · MTY 716 · SLP 679 · Qro 558 · GDL 387) |
| Opción de ubicación | **«Presencia: personas en tus ubicaciones»** | La opción por omisión incluye «interés» y paga clics de medio mundo |
| Idioma | Español | |
| Dispositivos | Sin ajuste al inicio | El historial dice «móvil no convierte», pero eso se midió con el rastreo roto: **no es un dato confiable** |

---

## Grupos de anuncios

Cada palabra clave viene de Search Console con sus impresiones reales de los últimos 6 meses.

### G1 · Hoteles en Xilitla — 6,693 impresiones · posición 10.7
La búsqueda que paga la nómina. Hoy estás en página 2.
Página de destino: `/hoteles-en-xilitla`

```
[hoteles en xilitla]              1,078 impr.
[hotel xilitla]                     896
[hoteles xilitla]                   509
[hotel en xilitla]                  501
[xilitla hoteles]                   479
"hoteles en xilitla san luis potosí"  514
"hoteles en xilitla slp"              489
"hoteles en xilitla precios"           59
```

### G2 · Marca — 2,289 impresiones · posición 3.8 · CTR 3.6%
Defensiva y barata: evita que la competencia te compre el nombre.
Página de destino: `/`

```
[hotel paraiso encantado]           650 impr.
[hotel paraiso encantado xilitla]   628
[paraiso encantado xilitla]         178
"hotel campestre paraiso encantado"  69
"precios hotel paraiso encantado"    29
```

### G3 · Cerca de Las Pozas — 241 impresiones · posición 10.5
Página de destino: `/hotel-cerca-de-las-pozas`

```
"hoteles las pozas"                  80 impr.
"hotel edward james xilitla"         46
"las pozas de edward james hoteles"  22
"hotel cerca de las pozas"
```

### G4 · Con alberca — 220 impresiones · posición 14.1
Página de destino: `/hotel-alberca-privada-xilitla`

```
"hotel xilitla con alberca"          68 impr.
"hoteles con alberca en xilitla"     52
"hoteles en xilitla con alberca"     52
"hotel en xilitla con alberca"       48
```

### G5 · Hospedaje Huasteca — 229 impresiones · posición 10.5
Página de destino: `/donde-hospedarse-huasteca-potosina`

```
"hotel en la huasteca potosina"      51 impr.
"donde hospedarse en la huasteca potosina"
"hotel boutique huasteca potosina"
"hoteles en la huasteca potosina"
```

---

## Palabras negativas (nivel campaña)

Nunca se aplicaron en la campaña anterior. Estas son las que estaban quemando dinero:

**Competencia:** `tapasoli` · `tapasoli hotel` · `castillo` · `casa caracol` · `casablanca` · `real de lua` · `posada james` · `tipis`
> «hotel tapasoli» solo gastó ~$2,300 MXN en 3 revisiones **sin una sola conversión**.

**Otro negocio (los tours van al 489 109 0388, no al hotel):** `tour` · `tours` · `excursión` · `excursion` · `recorrido` · `rappel` · `tamul` · `micos`

**Solo quieren leer, no dormir:** `que hacer` · `qué hacer` · `como llegar` · `cómo llegar` · `mapa` · `clima` · `distancia` · `cuantas horas` · `wikipedia` · `historia` · `fotos`
> «que hacer en la huasteca potosina» gastó $400 MXN sin conversión.

**Intención equivocada:** `barato` · `económico` · `economico` · `hostal` · `camping` · `casa de campaña` · `airbnb` · `renta` · `rentar` · `venta` · `terreno`

**Buscan trabajo:** `trabajo` · `empleo` · `vacante` · `curriculum`

**Otros pueblos (el hotel está en Xilitla):** `ciudad valles` · `tamasopo` · `aquismón` · `tamazunchale` · `tampico` · `huichihuayán`

---

## Anuncio (RSA) — textos medidos, todos caben

**Titulares** (tope 30 caracteres)

| # | Texto | Car. |
|---|---|---:|
| 1 | Hotel en Xilitla | 16 |
| 2 | A 5 Min de Las Pozas | 20 |
| 3 | Escríbenos por WhatsApp | 23 |
| 4 | Te Contestamos en Minutos | 25 |
| 5 | Reserva Directo Sin Comisión | 28 |
| 6 | 4.5★ con 523 Reseñas | 20 |
| 7 | Suites Desde $1,500 MXN | 23 |
| 8 | Hotel Boutique en Xilitla | 25 |
| 9 | Pregunta Disponibilidad Hoy | 27 |
| 10 | Alberca y Restaurante Propio | 28 |
| 11 | Paraíso Encantado Xilitla | 25 |
| 12 | 13 Suites en la Selva | 21 |
| 13 | Suites con Spa Privado | 22 |
| 14 | Cotiza por WhatsApp Gratis | 26 |
| 15 | Hotel Cerca de Edward James | 27 |

**Descripciones** (tope 90 caracteres)

| # | Texto | Car. |
|---|---|---:|
| 1 | 13 suites boutique a 5 minutos del Jardín de Edward James. Escríbenos y te cotizamos hoy. | 89 |
| 2 | Pregunta precio y disponibilidad por WhatsApp. Te contestamos en minutos, sin compromiso. | 89 |
| 3 | Reserva directo con el hotel: sin comisiones de intermediarios y con mejor precio. | 82 |
| 4 | Alberca, restaurante huasteco y 4 suites con spa privado. 4.5★ con 523 reseñas reales. | 86 |

**Recursos del anuncio**
- *Enlaces de sitio:* Ver suites y precios (`/habitaciones`) · Fotos del hotel (`/galeria`) · Cómo llegar (`/blog/como-llegar-a-xilitla`) · Opiniones (`/reviews`)
- *Textos destacados:* Sin comisiones · Alberca · Restaurante propio · A 5 min de Las Pozas · Estacionamiento gratis · Cancelación flexible
- *Llamada:* +52 489 100 7679
- *Ubicación:* vincular el Perfil de Empresa de Google

---

## La conversión: «Contacto WhatsApp»

**En Google Ads** → Objetivos → Conversiones → Crear acción de conversión → **Sitio web**
- Categoría: **Contacto**
- Nombre: `Contacto WhatsApp`
- Valor: **$340 MXN** (supuesto explícito: si 1 de cada 10 que escriben reserva, y la reserva promedio ronda $3,400 MXN). Ajustar cuando haya datos reales.
- Recuento: **Una** (varios clics de la misma persona = un contacto)
- Ventana: 30 días
- Método: **Google Tag Manager** → anotar el *ID de conversión* (`AW-…`) y la *etiqueta*

**En Google Tag Manager** (contenedor `GTM-N98DFD9V`)
1. **Activador** → nuevo → *Evento personalizado* → nombre exacto: `contacto_whatsapp`
2. **Variables de capa de datos**: crear `DLV - origen` (`origen`) y `DLV - pagina` (`pagina`)
3. **Etiqueta** → *Seguimiento de conversiones de Google Ads* → pegar el ID y la etiqueta del paso anterior → activador: el del punto 1
4. **Vinculador de conversiones** → activador *All Pages* (si no existe ya)
5. **Publicar** el contenedor (botón *Enviar*, arriba a la derecha)
6. Comprobar con **Vista previa**: entrar al sitio, tocar el botón verde de WhatsApp y ver que la etiqueta dispara

> El sitio ya empuja `contacto_whatsapp` al `dataLayer` con `{ origen, pagina }`.
> Se dispara desde el botón flotante y desde la barra fija de móvil.

---

## Qué revisar y cuándo

| Cuándo | Qué mirar | Qué hacer |
|---|---|---|
| Día 1 | Que los anuncios digan «Aprobado», no «Rechazado» | 3 campañas viejas tienen *todos los anuncios rechazados*: revisar el motivo |
| Día 3 | Informe de **términos de búsqueda** | Agregar como negativa todo lo que no sea «quiero dormir en Xilitla» |
| Semana 2 | Clics a WhatsApp en Ads | Si marca 0 con clics > 100, la etiqueta de GTM no está disparando |
| Semana 3-4 | Costo por contacto | Si hay ≥30 conversiones, cambiar a «Maximizar conversiones» |
| Mes 2 | Costo por reserva vs comisión de OTA | Si el costo por reserva es menor al 15-18% que cobra Booking, conviene subir presupuesto |

---

## La regla para decidir

Si conseguir una reserva por Google Ads te cuesta **menos que la comisión que te cobraría Booking** (15-18% del valor de la reserva), conviene meterle más dinero. Si cuesta más, conviene apagarlo y poner ese dinero en recuperar el tráfico gratis de Google.

Hoy no puedes responder esa pregunta porque la medición nunca funcionó. Ese es el verdadero desbloqueo de esta campaña.
