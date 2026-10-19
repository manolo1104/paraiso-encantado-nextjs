import { CheckCircle, Tag } from 'lucide-react';
import EntreSemanaDesde from './EntreSemanaDesde';
import styles from './PromoStrip.module.css';

/**
 * 🔴 INTERRUPTOR (17 oct 2026), APAGADO: el aviso «De lunes a jueves desde $X
 * · Viernes y sábado desde $Y» dentro de esta franja.
 *
 * El componente ya está hecho y probado (lee el precio real del calendario y
 * se esconde solo si entre semana no sale más barato). Está apagado porque el
 * revisor de negocio del 13 oct pidió no poner la tarifa de entre semana en la
 * portada (recibe los anuncios, la ven los clientes de WhatsApp y Booking, y
 * la marca no se vende por precio) y dejarla en el calendario, que ya la
 * enseña, hasta que se sepa cuántos BLOQUEADO de lunes a jueves son ventas.
 * Para encenderlo, `true` y desplegar; nada más cambia.
 *
 * Constante local de un Server Component: no viaja a ningún archivo «use
 * client», así que no hay riesgo de [object Object].
 */
const ENTRE_SEMANA_EN_PORTADA = false;

function InnerContent() {
  return (
    <div className={styles.inner}>
      <span className={styles.badge}>Oferta Especial</span>
      <p className={styles.text}>
        <strong>3ª Noche Gratis</strong>
        <span className={styles.sep}>·</span>
        Reserva 2 noches y la tercera es completamente gratis
        <span className={styles.savings}> — ahorra hasta $2,400 MXN</span>
      </p>
      <div className={styles.checks}>
        <span><CheckCircle size={13} strokeWidth={2} /> Aplica todas las suites</span>
        <span><CheckCircle size={13} strokeWidth={2} /> Reserva directa</span>
        <span className={styles.codeChip}><Tag size={12} strokeWidth={2} /> XILITLA3MX</span>
      </div>
    </div>
  );
}

export default function PromoStrip() {
  return (
    <aside className={styles.strip} aria-label="Oferta especial vigente">
      <InnerContent />
      {/* Precio real de lunes a jueves contra viernes y sábado (16 oct 2026).
          Sale del motor, no está escrito a mano, y si entre semana no sale
          más barato no se pinta. Apagado por ahora: ver el interruptor arriba. */}
      {ENTRE_SEMANA_EN_PORTADA ? <EntreSemanaDesde variante="franja" origen="portada" diferido /> : null}
    </aside>
  );
}
