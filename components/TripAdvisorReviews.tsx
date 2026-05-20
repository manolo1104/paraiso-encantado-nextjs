'use client';

import Script from 'next/script';

/** Widget de reseñas deslizantes de TripAdvisor — se usa en el homepage */
export default function TripAdvisorReviews() {
  return (
    <section
      aria-label="Reseñas TripAdvisor — Hotel Paraíso Encantado"
      style={{ background: '#f5f2ec', padding: '48px 24px', textAlign: 'center' }}
    >
      <p style={{
        fontFamily: 'var(--font-jost, sans-serif)',
        fontSize: 10,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: '#9a8a74',
        marginBottom: 20,
      }}>
        Lo que dicen en TripAdvisor
      </p>

      <div id="TA_cdsscrollingravenarrow238" className="TA_cdsscrollingravenarrow">
        <ul id="qDNdHfjmD2" className="TA_links guNVvzYdu" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          <li id="UBSqPQ" className="rwbvenEAIDv">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.tripadvisor.com.mx/Hotel_Review-g635968-d7715901-Reviews-Hotel_Paraiso_Encantado-Xilitla_Central_Mexico_and_Gulf_Coast.html"
            >
              <img
                src="https://static.tacdn.com/img2/brand_refresh/Tripadvisor_lockup_vertical.svg"
                alt="TripAdvisor — Reseñas Hotel Paraíso Encantado"
                className="widEXCIMG"
                id="CDSWIDEXCLOGO"
                style={{ width: 160, maxWidth: '100%', height: 'auto' }}
              />
            </a>
          </li>
        </ul>
      </div>

      <Script
        src="https://www.jscache.com/wejs?wtype=cdsscrollingravenarrow&uniq=238&locationId=7715901&lang=es_MX&border=true&display_version=2"
        strategy="afterInteractive"
      />
    </section>
  );
}
