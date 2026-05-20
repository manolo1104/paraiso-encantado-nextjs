'use client';

import Script from 'next/script';

/** Insignias estáticas de TripAdvisor — se usan en el footer */
export default function TripAdvisorBadges() {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>

      {/* Widget 1: Excellent */}
      <div id="TA_excellent319" className="TA_excellent">
        <ul id="c3kdqTj" className="TA_links N36Yza" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          <li id="9XzPxCxm" className="IzouF5Aw6zfd">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.tripadvisor.com.mx/Hotel_Review-g635968-d7715901-Reviews-Hotel_Paraiso_Encantado-Xilitla_Central_Mexico_and_Gulf_Coast.html"
            >
              <img
                src="https://static.tacdn.com/img2/brand_refresh/Tripadvisor_lockup_horizontal_secondary_registered.svg"
                alt="TripAdvisor — Hotel Paraíso Encantado"
                className="widEXCIMG"
                id="CDSWIDEXCLOGO"
                style={{ width: 140, maxWidth: '100%', height: 'auto' }}
              />
            </a>
          </li>
        </ul>
      </div>
      <Script
        src="https://www.jscache.com/wejs?wtype=excellent&uniq=319&locationId=7715901&lang=es_MX&display_version=2"
        strategy="afterInteractive"
      />

      {/* Widget 2: Rated */}
      <div id="TA_rated243" className="TA_rated">
        <ul id="sAJCj1PB" className="TA_links 8eK4Ek" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          <li id="Qbxc3AXL" className="RAe6A4nmw">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.tripadvisor.com.mx/Hotel_Review-g635968-d7715901-Reviews-Hotel_Paraiso_Encantado-Xilitla_Central_Mexico_and_Gulf_Coast.html"
            >
              <img
                src="https://www.tripadvisor.com.mx/img/cdsi/img2/badges/ollie-11424-2.gif"
                alt="TripAdvisor — Valoración del Hotel Paraíso Encantado"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </a>
          </li>
        </ul>
      </div>
      <Script
        src="https://www.jscache.com/wejs?wtype=rated&uniq=243&locationId=7715901&lang=es_MX&display_version=2"
        strategy="afterInteractive"
      />

    </div>
  );
}
