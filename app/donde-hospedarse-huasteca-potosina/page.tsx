import type { Metadata } from 'next';
import Link from 'next/link';
import {
  SeoHero, AnswerBlock, StatStrip, CompareTable, SeoFaq, RelatedLinks, SeoCta, seoStyles as styles,
} from '@/components/seo/SeoBlocks';
import { HOTEL, lodgingSchema, breadcrumbSchema, faqSchema } from '@/lib/seo-hotel';

const URL = `${HOTEL.url}/donde-hospedarse-huasteca-potosina`;
const ACTUALIZADO = 'agosto de 2026';

export const metadata: Metadata = {
  title: 'Dónde Hospedarse en la Huasteca Potosina: Xilitla o Ciudad Valles (2026)',
  description:
    'La Huasteca no se recorre desde un solo punto. Comparativa honesta entre Xilitla, Ciudad Valles, Aquismón y Tamasopo: qué ves desde cada base, cuánto manejas y cómo repartir las noches en un viaje de 3 a 5 días.',
  keywords: ['donde hospedarse huasteca potosina', 'xilitla o ciudad valles', 'donde dormir huasteca potosina', 'base huasteca potosina'],
  alternates: { canonical: URL },
  openGraph: {
    title: 'Dónde Hospedarse en la Huasteca Potosina — Xilitla o Ciudad Valles',
    description: 'Qué ves desde cada base, cuánto manejas y cómo repartir las noches sin pasar el viaje en la carretera.',
    url: URL,
    type: 'article',
    images: [{
      url: `${HOTEL.url}/images/atracciones/jardin-edward-james-aerial.png`,
      width: 1200, height: 630,
      alt: 'Vista aérea del Jardín Surrealista de Edward James en Xilitla, Huasteca Potosina',
    }],
  },
};

const FAQS = [
  {
    q: '¿Dónde conviene hospedarse en la Huasteca Potosina?',
    a: 'Depende del reparto de tu viaje. Xilitla es la base para Las Pozas, el pueblo mágico y la sierra. Ciudad Valles es la base para Tamul, Micos y rafting, y la ciudad con más servicios. En un viaje de tres días o más, lo más cómodo es dormir dos noches en Xilitla y una o dos en Valles, en vez de cruzar la sierra todos los días.',
  },
  {
    q: '¿Xilitla o Ciudad Valles?',
    a: 'Xilitla si tu prioridad es el Jardín de Edward James, el paisaje de sierra y un pueblo con carácter. Ciudad Valles si vas por los ríos del norte y quieres cadenas de restaurantes, hospitales y más opciones de hotel. Entre ambas hay unos 140 km, cerca de 1 hora 45 minutos de carretera con curvas.',
  },
  {
    q: '¿Cuántas noches se necesitan en la Huasteca Potosina?',
    a: 'Tres noches es el mínimo para no vivir en el auto. Con cuatro o cinco se puede sumar Tamul sin sacrificar Las Pozas ni un día de descanso. En dos noches solo alcanza para una de las dos zonas.',
  },
  {
    q: '¿Se puede recorrer la Huasteca Potosina sin auto?',
    a: 'Sí, pero contratando tours con transporte incluido. El transporte público entre pueblos existe pero es lento y no llega a las cascadas. Si no manejas, conviene elegir un hotel que organice los tours y hospedarte donde puedas caminar al menos a una atracción, como Xilitla.',
  },
  {
    q: '¿Cuál es la mejor época para ir?',
    a: 'De octubre a abril. En temporada de lluvias, de junio a septiembre, el agua de los ríos baja turbia y algunos tours de río se cancelan por seguridad; el paisaje está más verde, pero las fotos turquesa que la gente busca son de temporada seca.',
  },
];

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    lodgingSchema({
      name: `${HOTEL.nombre} — Hospedaje en la Huasteca Potosina`,
      description: `Hotel boutique en Xilitla, base para visitar Las Pozas y la sierra de la Huasteca Potosina.`,
      url: URL,
      image: `${HOTEL.url}/images/atracciones/jardin-edward-james-aerial.png`,
    }),
    breadcrumbSchema([
      { name: 'Inicio', url: HOTEL.url },
      { name: 'Dónde hospedarse en la Huasteca Potosina', url: URL },
    ]),
    faqSchema(FAQS),
  ],
};

export default function DondeHospedarsePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className={styles.main}>

        <SeoHero
          image="/images/atracciones/jardin-edward-james-aerial.png"
          imageAlt="Vista aérea del Jardín Surrealista de Edward James, Las Pozas, Xilitla"
          breadcrumb="Dónde hospedarse en la Huasteca Potosina"
          eyebrow="Cómo armar el viaje · Huasteca Potosina"
          title="Dónde Hospedarse en la"
          titleEm="Huasteca Potosina"
          sub="La región no se recorre desde un solo punto. Elegir bien la base es lo que decide cuántas horas pasas en el auto y cuántas dentro del agua."
          ctaPrimary={{ href: '/reservar', label: 'Ver disponibilidad en Xilitla' }}
          ctaSecondary={{ href: '/que-hacer-huasteca-potosina-3-dias', label: 'Itinerario de 3 días' }}
          updated={ACTUALIZADO}
        />

        <AnswerBlock label="Respuesta corta">
          <p>
            <strong>La Huasteca Potosina tiene dos bases principales: Xilitla y Ciudad Valles, a
            unos 140 km una de otra.</strong> Xilitla es la base para Las Pozas, el pueblo mágico y
            la sierra; Ciudad Valles, para Tamul, Micos y rafting. En un viaje de tres días o más lo
            más cómodo es dormir en ambas, en lugar de cruzar la sierra todos los días.
          </p>
        </AnswerBlock>

        <StatStrip stats={[
          { num: '140 km', label: 'entre Xilitla y Ciudad Valles (≈ 1 h 45 min)' },
          { num: '3', label: 'noches mínimas para no vivir en el auto' },
          { num: 'Oct–Abr', label: 'temporada con el agua más turquesa' },
        ]} />

        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <h2>Las cuatro bases y qué ves desde cada una</h2>
            <p className={styles.lead}>
              Casi todo el turismo se concentra en Xilitla y Ciudad Valles, pero hay dos bases
              intermedias que tienen sentido según lo que quieras ver.
            </p>

            <CompareTable
              caption="Distancias aproximadas en auto. En la sierra el tiempo real varía con el clima y el estado del camino."
              headers={['Base', 'Lo que tienes cerca', 'Lo que te queda lejos']}
              rows={[
                { cells: ['Xilitla', 'Las Pozas (caminando), el pueblo mágico, cafetales, El Meco y el paisaje de sierra.', 'Tamul y las cascadas del norte: entre 1 h 30 min y 2 h 30 min.'], highlight: true },
                { cells: ['Ciudad Valles', 'Tamul, Cascadas de Micos, rafting y la mayor oferta de restaurantes y servicios.', 'Las Pozas: ≈ 1 h 45 min de curvas. Ir y volver en el día se come la mañana.'] },
                { cells: ['Aquismón', 'Sótano de las Golondrinas y el embarcadero desde donde sale el tour a Tamul.', 'Oferta de hoteles y restaurantes: es un pueblo pequeño.'] },
                { cells: ['Tamasopo', 'Cascadas de Tamasopo y Puente de Dios, a 10 min del pueblo.', 'Está en el extremo opuesto a Xilitla: ≈ 2 h.'] },
              ]}
            />

            <h3>Cómo repartir las noches</h3>
            <ul>
              <li><strong>3 noches:</strong> 2 en Xilitla (Las Pozas + pueblo + una cascada cercana) y 1 en Valles o Aquismón para Tamul.</li>
              <li><strong>4–5 noches:</strong> 3 en Xilitla y 2 en Valles. Suficiente para Tamul, Micos y un día sin manejar.</li>
              <li><strong>2 noches:</strong> elige una sola zona. Intentar las dos convierte el viaje en carretera.</li>
            </ul>
            <p>
              Si empiezas por Xilitla tienes una ventaja: puedes ver Las Pozas a primera hora del día
              siguiente a tu llegada, cuando el jardín está casi vacío, y salir después hacia el norte.
            </p>
          </div>
        </section>

        <section className={styles.sectionAlt}>
          <div className={styles.sectionInner}>
            <h2>Si eliges Xilitla como base</h2>
            <p className={styles.lead}>
              Dentro del pueblo, la zona de La Conchita —el camino que baja a Las Pozas— es la que
              te ahorra traslados. El <Link href="/hotel-cerca-de-las-pozas">Hotel Paraíso
              Encantado</Link> está ahí, a {HOTEL.metrosALasPozas} metros de la entrada del jardín.
            </p>
            <CompareTable
              headers={['Dato', 'Detalle']}
              rows={[
                { cells: ['Calificación', `${HOTEL.rating}/5 con ${HOTEL.reviewCount} reseñas en Google`], highlight: true },
                { cells: ['A Las Pozas', `${HOTEL.metrosALasPozas} m — ${HOTEL.minutosCaminandoALasPozas} min caminando`] },
                { cells: ['Suites', `${HOTEL.suites}, de 2 a ${HOTEL.capacidadMaxima} personas · ${HOTEL.suitesConSpaPrivado} con piscina spa privada`] },
                { cells: ['Tours desde el hotel', 'Tamul, Puente de Dios y El Meco, con guía'] },
                { cells: ['Desde', `$${HOTEL.precioDesde.toLocaleString('es-MX')} MXN/noche (2 personas)`] },
                { cells: ['Cancelación', HOTEL.cancelacion] },
              ]}
            />
          </div>
        </section>

        <SeoFaq faqs={FAQS} />

        <RelatedLinks links={[
          { href: '/mejor-hotel-huasteca-potosina', label: 'Cómo elegir hotel en la Huasteca' },
          { href: '/que-hacer-huasteca-potosina-3-dias', label: 'Qué hacer en 3 días' },
          { href: '/hoteles-en-xilitla', label: 'Hoteles en Xilitla por zona' },
          { href: '/experiencias', label: 'Tours desde el hotel' },
          { href: '/paquetes', label: 'Paquetes todo incluido' },
        ]} />

        <SeoCta
          title="Empieza tu viaje"
          titleEm="por Xilitla"
          body="Duerme a cinco minutos de Las Pozas, entra al jardín antes que los grupos y sal al norte con el día completo por delante."
          note={HOTEL.cancelacion}
        />
      </main>
    </>
  );
}
