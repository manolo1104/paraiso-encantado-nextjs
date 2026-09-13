/**
 * scripts/sim-fake-model.js
 * "Modelo" con guion para sim-conversations.js (--model fake): contesta como lo pide el
 * prompt (herramientas y textos cortos) SIN llamar a Anthropic. Sirve para probar todo
 * el código alrededor del modelo (ráfaga, herramientas, apartados, reemplazos,
 * comprobantes, atajos fijos) cuando la API no está disponible o para no gastar.
 *
 * NO prueba el criterio del modelo real (seguir la plantilla, elegir herramientas):
 * eso solo lo prueba --model real.
 *
 * Reglas simples sobre el ÚLTIMO mensaje del cliente y el último resultado de herramienta.
 * El estado (última consulta, opción elegida, suite cotizada) se guarda por nombre de
 * WhatsApp, que viene en el bloque dinámico del system ("El huésped se llama *Ana*").
 */

const MONTHS = { octubre: 10, noviembre: 11, diciembre: 12 };

const money = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-MX')}`;
const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function textResp(text) {
  return { id: `fake_${Date.now()}`, type: 'message', role: 'assistant', model: 'fake', stop_reason: 'end_turn', content: [{ type: 'text', text }], usage: { input_tokens: 0, output_tokens: 0 } };
}
let toolSeq = 0;
function toolResp(name, input, lead = '') {
  const content = [];
  if (lead) content.push({ type: 'text', text: lead });
  content.push({ type: 'tool_use', id: `toolu_fake_${++toolSeq}`, name, input });
  return { id: `fake_${Date.now()}`, type: 'message', role: 'assistant', model: 'fake', stop_reason: 'tool_use', content, usage: { input_tokens: 0, output_tokens: 0 } };
}

function lastUserText(messages) {
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'user') return '';
  if (typeof last.content === 'string') return last.content;
  return (last.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
}

export function createFakeAnthropic() {
  const state = new Map();
  const stateFor = (params) => {
    const dyn = (params.system || []).map(b => b.text || '').join('\n');
    const who = (dyn.match(/El huésped se llama \*([^*]+)\*/) || [])[1] || 'anon';
    if (!state.has(who)) state.set(who, {});
    return state.get(who);
  };

  function afterTool(name, input, result, st) {
    if (name === 'check_availability') {
      st.lastCheck = { input, result };
      if (result?.error === 'faltan_personas') return textResp('¿Cuántas personas serían? 🌿 (adultos y niños de 6 años o más) 📅');
      if (result?.verification_failed) return textResp('Déjame confirmarte la disponibilidad con el equipo y te aviso en unos minutos 🌿');
      if (!result?.available) return textResp('En esas fechas ya no tenemos suites libres 😔 ¿Te busco otras fechas cercanas? 📅');
      const rangeText = `del ${Number(input.checkin.slice(8))} al ${Number(input.checkout.slice(8))}`;
      const availableIds = new Set((result.available_rooms || []).map(r => r.id));
      // Cambio de fechas con cotización: el resultado dice si SUS habitaciones siguen libres.
      const cv = result.cotizacion_vigente;
      if (cv) {
        return textResp(cv.mismas_habitaciones_disponibles
          ? `¡Sí hay! 🌿 La *${cv.habitaciones}* está libre ${rangeText}. ¿Te la cambio a esas fechas? 📅`
          : `La *${cv.habitaciones}* no está disponible ${rangeText} 😔 Tu cotización actual sigue vigente. ¿Te busco otras fechas? 📅`);
      }
      if (st.quotedRoom) {
        if (availableIds.has(st.quotedRoom.id)) {
          return textResp(`¡Sí hay! 🌿 La *${st.quotedRoom.name}* está libre ${rangeText}. ¿Te la cambio a esas fechas? 📅`);
        }
        return textResp(`La *${st.quotedRoom.name}* no está disponible ${rangeText} 😔 Tu cotización actual sigue vigente. ¿Te busco otras fechas? 📅`);
      }
      if (Array.isArray(result.room_options) && result.room_options.length) {
        const lines = result.room_options.map(o => `${o.option}️⃣ ${o.rooms.map(r => `${r.name} (${r.guests})`).join(' + ')} — ${money(o.total_per_night)}/noche → *${money(o.total_stay)} total*`);
        return textResp(`Para *${input.guests} personas* ${rangeText} tengo estas opciones 🌿\n${lines.join('\n')}\n¿Cuál te late? Dime a nombre de quién y te preparo tu cotización 🧾`);
      }
      const fits = (result.available_rooms || []).filter(r => r.fits_alone !== false).slice(0, 2);
      st.recommended = fits[0] || null;
      const lines = fits.map(r => `*${r.name}* — *${money(Number(input.guests) <= 2 ? r.price_2 : r.price_3_4)}/noche* 🔗 ${r.url}`);
      return textResp(`Para ${input.guests} personas ${rangeText} te recomiendo 🌿\n${lines.join('\n')}\n¿Cuál te late? Dime a nombre de quién y te preparo tu cotización 🧾`);
    }
    if (name === 'create_reservation_quote') {
      if (result?.quote_created) {
        const room = input.rooms?.[0];
        st.quotedRoom = { id: room?.room_id, name: (st.lastCheck?.result?.available_rooms || []).find(r => r.id === room?.room_id)?.name || room?.room_id };
        st.name = input.guest_name;
        return textResp(`¡Listo, ${String(input.guest_name).split(' ')[0]}! 🌿 ¿Te quedó alguna duda para hacer tu pago? 💳`);
      }
      if (result?.error === 'falta_nombre') return textResp('¿A nombre de quién hago tu cotización? Dime tu nombre completo 🧾');
      if (result?.error === 'no_disponible') return textResp('Esas habitaciones ya no están disponibles en esas fechas 😔 Tu cotización anterior sigue vigente. ¿Te busco otras opciones? 📅');
      if (result?.requires_human) return textResp('Te comunico con nuestro equipo, en breve te contactan. 🤝');
      return textResp('Déjame confirmarlo con el equipo y te escribo en unos minutos 🌿');
    }
    return textResp('¿En qué más te ayudo? 🌿');
  }

  function roomsForQuote(st, text) {
    const res = st.lastCheck?.result;
    const guests = Number(st.lastCheck?.input?.guests) || 2;
    if (Array.isArray(res?.room_options) && res.room_options.length) {
      const n = Number((norm(text).match(/opcion (\d)/) || [])[1]) || st.chosenOption || 1;
      const option = res.room_options.find(o => o.option === n) || res.room_options[0];
      return option.rooms.map(r => ({ room_id: r.id, guests: r.guests }));
    }
    if (st.quotedRoom) return [{ room_id: st.quotedRoom.id, guests }];
    const room = st.recommended || (res?.available_rooms || [])[0];
    return room ? [{ room_id: room.id, guests }] : [];
  }

  async function create(params) {
    const st = stateFor(params);
    const messages = params.messages || [];
    const last = messages[messages.length - 1];

    // Resultado de herramienta → texto
    if (last?.role === 'user' && Array.isArray(last.content) && last.content.some(b => b.type === 'tool_result')) {
      const tr = last.content.find(b => b.type === 'tool_result');
      const prev = messages[messages.length - 2];
      const tu = (prev?.content || []).find(b => b.type === 'tool_use' && b.id === tr.tool_use_id);
      let result;
      try { result = JSON.parse(tr.content); } catch { result = tr.content; }
      return afterTool(tu?.name, tu?.input || {}, result, st);
    }

    const text = lastUserText(messages);
    // Solo lo que escribió el cliente (sin notas internas del sistema).
    const clientText = text.split('\n').filter(l => !/^\[NOTA INTERNA/.test(l.trim())).join('\n');
    const t = norm(clientText);

    const dates = t.match(/del (\d{1,2}) al (\d{1,2}) de (octubre|noviembre|diciembre)/);
    const people = t.match(/(\d+) personas/);
    if (dates) {
      const month = String(MONTHS[dates[3]]).padStart(2, '0');
      const guests = people ? Number(people[1]) : (st.lastCheck?.input?.guests || null);
      const input = { checkin: `2026-${month}-${dates[1].padStart(2, '0')}`, checkout: `2026-${month}-${dates[2].padStart(2, '0')}` };
      if (guests) input.guests = guests;
      return toolResp('check_availability', input);
    }

    if (/\btour\b|tamul/.test(t)) {
      // A propósito SIN el número de tours: la garantía es ensureToursContact (código).
      return textResp('¡La Expedición Tamul es increíble! 🌊 Los tours no se agregan a la cotización del hotel: los organiza nuestro equipo de tours. ¿Te ayudo con algo más de tu estancia? 🌿');
    }

    const nameMatch = clientText.match(/a nombre de ([A-ZÁÉÍÓÚÑ][^\n,.]+)/);
    const nameOnly = /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3}$/.test(clientText.trim()) ? clientText.trim() : null;
    const confirms = /\bs[i],? (cambiala|adelante)|^si\b/.test(t);
    const optionPick = t.match(/opcion (\d)|la primera/);
    if (optionPick && !nameMatch) {
      st.chosenOption = Number(optionPick[1]) || 1;
      return textResp('¡Buena elección! 🌿 ¿A nombre de quién hago tu cotización? Dime tu nombre completo 🧾');
    }
    const guestName = nameMatch?.[1]?.trim() || nameOnly || (confirms ? st.name : null);
    if (guestName && st.lastCheck) {
      return toolResp('create_reservation_quote', {
        guest_name: guestName,
        checkin: st.lastCheck.input.checkin,
        checkout: st.lastCheck.input.checkout,
        rooms: roomsForQuote(st, clientText),
      });
    }
    if (confirms && !guestName) return textResp('¿A nombre de quién hago tu cotización? Dime tu nombre completo 🧾');
    return textResp('¡Hola! 🌿 ¿Cuántas personas serían y qué fechas de llegada y salida? 📅');
  }

  return { messages: { create } };
}
