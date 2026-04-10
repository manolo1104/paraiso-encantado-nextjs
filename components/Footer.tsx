import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer} id="contacto">
      <div className={styles.content}>

        {/* Marca */}
        <div className={`${styles.section} ${styles.brand}`}>
          <h3 className={styles.logo}>
            <em>Paraíso Encantado</em>
          </h3>
          <p className={styles.tagline}>Tu casa en la Huasteca Potosina</p>
          <div className={styles.contact}>
            <p>
              <a href="tel:+524891007679">+52 489-100-7679</a>
            </p>
            <p>
              <a href="tel:+524891007601">+52 489-100-7601</a>
            </p>
            <p>
              <a href="mailto:reservas@paraisoencantado.com">
                reservas@paraisoencantado.com
              </a>
            </p>
          </div>
        </div>

        {/* Navegación */}
        <div className={styles.section}>
          <h4>Navegación</h4>
          <ul role="list">
            <li><a href="/">Inicio</a></li>
            <li><a href="#habitaciones">Habitaciones</a></li>
            <li><a href="#restaurante">Restaurante</a></li>
            <li><a href="#experiencias">Experiencias</a></li>
            <li><a href="#contacto">Contacto</a></li>
          </ul>
        </div>

        {/* Reservas */}
        <div className={styles.section}>
          <h4>Reservas</h4>
          <ul role="list">
            <li>
              <a
                href="https://booking-paraisoencantado.up.railway.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Reservar Ahora
              </a>
            </li>
            <li>
              <a
                href="https://paraisoencantadoxilitla.lat/politica-cancelacion"
                target="_blank"
                rel="noopener noreferrer"
              >
                Política de Cancelación
              </a>
            </li>
            <li>
              <a
                href="https://paraisoencantadoxilitla.lat/politica-privacidad"
                target="_blank"
                rel="noopener noreferrer"
              >
                Política de Privacidad
              </a>
            </li>
            <li>
              <a
                href="https://paraisoencantadoxilitla.lat/terminos-condiciones"
                target="_blank"
                rel="noopener noreferrer"
              >
                Términos y Condiciones
              </a>
            </li>
          </ul>
        </div>

        {/* Ubicación */}
        <div className={styles.section}>
          <h4>Ubicación</h4>
          <p className={styles.address}>
            Xilitla, San Luis Potosí<br />
            Huasteca Potosina, México
          </p>
          <p className={styles.checkin}>
            <span><strong>Check-in:</strong> 15:00 hrs</span>
            <span><strong>Check-out:</strong> 12:00 hrs</span>
          </p>
          <a
            href="https://wa.me/524891007679"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.whatsappLink}
          >
            💬 WhatsApp directo
          </a>
        </div>

      </div>

      {/* Footer bottom */}
      <div className={styles.bottom}>
        <p>© {currentYear} Paraíso Encantado. Todos los derechos reservados.</p>
        <div className={styles.social}>
          <a
            href="https://www.instagram.com/paraisoencantadoxilitla"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
          <a
            href="https://www.facebook.com/paraisoencantadoxilitla"
            target="_blank"
            rel="noopener noreferrer"
          >
            Facebook
          </a>
          <a
            href="https://wa.me/524891007679"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </footer>
  );
}
