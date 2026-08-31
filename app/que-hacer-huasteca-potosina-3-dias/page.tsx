import type { Metadata } from 'next';
import Link from 'next/link';
import {
  SeoHero, AnswerBlock, StatStrip, CompareTable, SeoFaq, RelatedLinks, SeoCta, seoStyles as styles,
} from '@/components/seo/SeoBlocks';
import { HOTEL, lodgingSchema, breadcrumbSchema, faqSchema } from '@/lib/seo-hotel';

const URL = `${HOTEL.url}/que-hacer-huasteca-potosina-3-dias`;
const ACTUALIZADO = 'agosto de 2026';

export const metadata: Metadata = {
  title: 'Qué Hacer en la Huasteca Potosina en 3 Días: Itinerario Real (2026)',
  description:
    'Itinerario de 3 días por la Huasteca Potosina con horarios reales, tiempos de traslado y qué llevar: Las Pozas de Edward James, cascadas cercanas y Tamul. Base en Xilitla, a 400 m del Jardín de Edward James.',
  keywords: ['que hacer en la huasteca potosina', 'huasteca potosina 3 dias', 'itinerario huasteca potosina', 'que ver en xilitla'],
  alternates: { canonical: URL },
  openGraph: {
    title: 'Huasteca Potosina en 3 Días — Itinerario Real',
    description: 'Día por día, con horarios y traslados: Las Pozas, cascadas y Tamul sin pasar el viaje en la carretera.',
    url: URL,
    type: 'article',
    images: [{
      url: `${HOTEL.url}/images/atracciones/cascada_de_tamul.jpg`,
      width: 1200, height: 630,
      alt: 'Cascada de Tamul, Huasteca Potosina, San Luis Potosí',
    }],
  },
};

const FAQS = [
  {
    q: '¿Qué se puede hacer en la Huasteca Potosina en 3 días?',
    a: 'Alcanza para lo esencial si no dispersas la ruta: un día para Las Pozas de Edward James y Xilitla, un día para una cascada cercana como El Meco o Puente de Dios, y un día completo para Tamul, que se lleva la jornada entera entre traslado y canoa.',
  },
  {
    q: '¿Cuánto cuesta un viaje de 3 días a la Huasteca Potosina?',
    a: `Para dos personas, calcula hospedaje desde $${HOTEL.precioDesde.toLocaleString('es-MX')} MXN por noche, entre $400 y $900 MXN por persona por cada tour con guía, y las entradas de cada atracción aparte. La gasolina y las casetas dependen de tu ciudad de origen.`,
  },
  {
    q: '¿Cuál es la mejor época para visitar la Huasteca Potosina?',
    a: 'De octubre a abril, cuando el agua está turquesa y llueve menos. Entre junio y septiembre el río baja turbio y algunos tours acuáticos se suspenden por seguridad.',
  },
  {
    q: '¿Se necesita auto para el itinerario?',
    a: 'No es indispensable si contratas los tours con transporte, que salen desde el hotel. Con auto propio ganas flexibilidad, pero la sierra tiene curvas cerradas y tramos sin señal: no conviene manejar de noche.',
  },
  {
    q: '¿Qué llevar a la Huasteca Potosina?',
    a: 'Zapato cerrado con suela antiderrapante, traje de baño puesto desde la mañana, muda de ropa seca, bolsa impermeable para el celular, efectivo (en varias atracciones no hay terminal) y repelente. En Tamul el chaleco lo dan en el tour.',
  },
];

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    lodgingSchema({
      description: 'Hotel boutique en Xilitla, punto de partida para Las Pozas, cascadas y Tamul.',
      url: URL,
      image: `${HOTEL.url}/images/atracciones/cascada_de_tamul.jpg`,
    }),
    breadcrumbSchema([
      { name: 'Inicio', url: HOTEL.url },
      { name: 'Qué hacer en la Huasteca en 3 días', url: URL },
    ]),
    faqSchema(FAQS),
  ],
};

const DIAS = [
  {
    label: 'Día 1',
    titulo: 'Llegada, Xilitla y el pueblo',
    texto: `Llega con luz: la carretera de sierra no se disfruta de noche. Check-in a partir de las ${HOTEL.checkIn}, y la tarde para el pueblo — la plaza, el mercado y un café de olla. Si tu suite tiene spa privado, es la tarde para estrenarlo. Cena temprano: en Xilitla la mayoría de las cocinas cierran entre 8 y 9.`,
  },
  {
    label: 'Día 2',
    titulo: 'Las Pozas a primera hora, cascada por la tarde',
    texto: 'Entra al Jardín de Edward James en cuanto abra. Es la diferencia entre recorrerlo casi solo o entre grupos: a media mañana llegan los autobuses. Calcula dos o tres horas caminando entre las estructuras. Por la tarde, una cascada cercana como El Meco (≈ 1 h) para nadar sin prisa y volver antes de que oscurezca.',
  },
  {
    label: 'Día 3',
    titulo: 'Tamul, el día completo',
    texto: 'La cascada más alta de San Luis Potosí se visita remontando el río en canoa y ocupa la jornada entera: unas 2 h 30 min de traslado desde Xilitla más el recorrido en lancha. Sal temprano, lleva efectivo y ropa seca para el regreso. En temporada de lluvias el tour puede suspenderse por el nivel del río — pregunta un día antes.',
  },
];

export default function TresDiasPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className={styles.main}>

        <SeoHero
          image="/images/atracciones/cascada_de_tamul.jpg"
          imageAlt="Cascada de Tamul vista desde el río, Huasteca Potosina, San Luis Potosí"
          breadcrumb="Qué hacer en la Huasteca en 3 días"
          eyebrow="Itinerario · Huasteca Potosina"
          title="La Huasteca Potosina"
          titleEm="en 3 días"
          titleAfter="sin pasarlos en la carretera"
          sub="Un itinerario real con horarios, traslados y lo que conviene llevar — armado desde Xilitla, que es donde empieza casi todo."
          ctaPrimary={{ href: '/reservar', label: 'Reservar en Xilitla' }}
          ctaSecondary={{ href: '/experiencias', label: 'Ver los tours' }}
          updated={ACTUALIZADO}
        />

        <AnswerBlock label="Respuesta corta">
          <p>
            <strong>Tres días alcanzan para lo esencial de la Huasteca Potosina si no dispersas la
            ruta:</strong> un día para Las Pozas de Edward James y el pueblo de Xilitla, un día para
            una cascada cercana, y un día completo para Tamul, que consume la jornada entera entre
            traslado y canoa. Con la base en Xilitla no manejas para ver el jardín surrealista.
          </p>
        </AnswerBlock>

        <StatStrip stats={[
          { num: '3', label: 'días para lo esencial de la región' },
          { num: `${HOTEL.minutosCaminandoALasPozas} min`, label: 'del hotel a Las Pozas, caminando' },
          { num: 'Oct–Abr', label: 'temporada con el agua más turquesa' },
        ]} />

        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <h2>El itinerario, día por día</h2>
            <div className={styles.steps}>
              {DIAS.map(d => (
                <div key={d.label} className={styles.step}>
                  <p className={styles.stepLabel}>{d.label}</p>
                  <h3>{d.titulo}</h3>
                  <p>{d.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.sectionAlt}>
          <div className={styles.sectionInner}>
            <h2>Cuánto tardas en llegar a cada lugar</h2>
            <CompareTable
              caption="Tiempos desde el Hotel Paraíso Encantado, en Xilitla."
              headers={['Destino', 'Traslado', 'Cuánto dura la visita']}
              rows={[
                { cells: ['Las Pozas · Jardín de Edward James', `${HOTEL.minutosCaminandoALasPozas} min caminando`, '2 a 3 horas'], highlight: true },
                { cells: ['Centro de Xilitla', '10 min caminando', 'Una tarde'] },
                { cells: ['Cascada El Meco', '≈ 1 h en auto', 'Medio día'] },
                { cells: ['Puente de Dios', '≈ 1 h 30 min en auto', 'Medio día'] },
                { cells: ['Cascada de Tamul', '≈ 2 h 30 min en auto', 'Día completo'] },
              ]}
            />
            <p>
              Los tours salen desde el hotel con guía. En temporada alta los cupos de Tamul se
              agotan con días de anticipación: conviene apartarlo al reservar el hospedaje, por{' '}
              <a href={HOTEL.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a> o en{' '}
              <Link href="/experiencias">experiencias</Link>.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <h2>Qué llevar</h2>
            <ul>
              <li><strong>Zapato cerrado antiderrapante.</strong> En Las Pozas los escalones son irregulares y con humedad resbalan. Las sandalias no sirven.</li>
              <li><strong>Traje de baño puesto desde la mañana.</strong> En varias cascadas los vestidores son básicos o no hay.</li>
              <li><strong>Efectivo.</strong> Varias atracciones y comedores no tienen terminal, y la señal para transferir es intermitente.</li>
              <li><strong>Bolsa impermeable.</strong> En el tour de Tamul te vas a mojar, incluido lo que traigas en la mochila.</li>
              <li><strong>Muda de ropa seca en el auto.</strong> El regreso mojado desde Tamul son más de dos horas.</li>
              <li><strong>Repelente y bloqueador biodegradable.</strong> Es zona de selva y varias pozas prohíben bloqueadores comunes para cuidar el agua.</li>
            </ul>
          </div>
        </section>

        <SeoFaq faqs={FAQS} />

        <RelatedLinks links={[
          { href: '/donde-hospedarse-huasteca-potosina', label: 'Dónde hospedarse en la Huasteca' },
          { href: '/mejor-hotel-huasteca-potosina', label: 'Cómo elegir hotel en la Huasteca' },
          { href: '/hoteles-en-xilitla', label: 'Hoteles en Xilitla por zona' },
          { href: '/experiencias', label: 'Tours desde el hotel' },
          { href: '/xilitla', label: 'Guía de Xilitla' },
          { href: '/paquetes', label: 'Paquetes todo incluido' },
        ]} />

        <SeoCta
          title="Duerme donde"
          titleEm="empieza el itinerario"
          body={`A ${HOTEL.minutosCaminandoALasPozas} minutos caminando de Las Pozas, con los tours saliendo desde el hotel.`}
          note={HOTEL.cancelacion}
        />
      </main>
    </>
  );
}
