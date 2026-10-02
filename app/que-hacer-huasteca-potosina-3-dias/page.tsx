import type { Metadata } from 'next';
import Link from 'next/link';
import {
  SeoHero, AnswerBlock, StatStrip, CompareTable, SeoFaq, RelatedLinks, SeoCta, seoStyles as styles,
} from '@/components/seo/SeoBlocks';
import { HOTEL, lodgingSchema, breadcrumbSchema, faqSchema } from '@/lib/seo-hotel';

const URL = `${HOTEL.url}/que-hacer-huasteca-potosina-3-dias`;
const ACTUALIZADO = 'octubre de 2026';

export const metadata: Metadata = {
  title: 'Qué Hacer en la Huasteca Potosina en 3 Días · Con Horarios',
  description:
    'Itinerario día por día con horarios reales y tiempos de traslado: Las Pozas, cascadas y Tamul, con base en Xilitla. Pide tu cotización sin costo.',
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
    a: 'Con base en Xilitla alcanza para lo esencial si no dispersas la ruta: un día para Las Pozas de Edward James (con turno reservado y guía), la Cascada Los Comales y el pueblo; un día completo para la Expedición Tamul, que dura unas 12 horas; y un tercer día para el Nacimiento de Huichihuayán y el Castillo de la Salud, a media hora, o para el tour a Puente de Dios, que también es de día completo. El Meco no cabe: está en El Naranjo, a 3 horas o más de Xilitla.',
  },
  {
    q: '¿Cuánto cuesta un viaje de 3 días a la Huasteca Potosina?',
    a: `Para dos personas, calcula hospedaje desde $${HOTEL.precioDesde.toLocaleString('es-MX')} MXN por noche, entre $1,400 y $1,700 MXN por persona por cada tour de día completo con guía (ya incluye entradas, traslado desde tu hospedaje y desayuno buffet); si vas por tu cuenta, las entradas se pagan aparte. Las Pozas cuesta $180 MXN por adulto más $30 de guía obligatoria, y se paga en la taquilla. La gasolina y las casetas dependen de tu ciudad de origen.`,
  },
  {
    q: '¿Cuál es la mejor época para visitar la Huasteca Potosina?',
    a: 'De noviembre a mayo, cuando el agua está turquesa y llueve menos. Entre junio y septiembre el río baja turbio y algunos tours acuáticos se suspenden por seguridad.',
  },
  {
    q: '¿Se necesita auto para el itinerario?',
    a: 'No es indispensable: a Las Pozas llegas caminando desde el hotel (el jardín no tiene estacionamiento) y los tours de día completo, que opera Huasteca Potosina Tours, pasan por ti al hotel. Con auto propio ganas flexibilidad para el tercer día, pero la sierra tiene curvas cerradas y tramos sin señal: no conviene manejar de noche.',
  },
  {
    q: '¿Qué llevar a la Huasteca Potosina?',
    a: 'Zapato cerrado con suela antiderrapante, traje de baño puesto desde la mañana los días de río (no el de Las Pozas: ahí no se permite nadar ni entrar en traje de baño), muda de ropa seca, bolsa impermeable para el celular, efectivo (en varias atracciones no hay terminal) y repelente. En Tamul el chaleco lo dan en el tour.',
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

// Plan rehecho el 2 oct 2026: el anterior proponía "El Meco por la tarde (≈ 1 h)",
// imposible (El Meco está en El Naranjo, a 3 h o más), y la IA de los buscadores ya
// lo repetía. Tiempos y datos de Las Pozas: hoja única de cifras.
const DIAS = [
  {
    label: 'Día 1',
    titulo: 'Las Pozas, Los Comales y el pueblo',
    texto: 'Aparta antes tu turno en el sistema oficial de Las Pozas: no hay venta en línea y el boleto se paga en la taquilla ($180 adulto; $120 de 6 a 12 años y mayores de 65), más la guía, que es obligatoria ($30 por persona). El recorrido es guiado y dura 1 h 30 min; llega 10 minutos antes, porque si llegas tarde pierdes el turno. El jardín cierra los martes y el último acceso es a las 16:00. Junto a la entrada está la Cascada Los Comales. Por la tarde, el centro de Xilitla, a 5 minutos en auto: el Jardín Hidalgo, un café de olla y el Museo Leonora Carrington, a una cuadra de la plaza. Cena temprano: en Xilitla la mayoría de las cocinas cierran entre 8 y 9.',
  },
  {
    label: 'Día 2',
    titulo: 'Tamul, el día completo',
    texto: 'La Expedición Tamul la opera Huasteca Potosina Tours y dura unas 12 horas: pasan por ti al hotel temprano, son entre 1 h y 1 h 30 de manejo hasta el embarcadero y de ahí se remonta el río en canoa hasta la cascada, de 105 metros. El día cierra al atardecer en el Sótano de las Huahuas. Lleva efectivo y ropa seca para el regreso. En temporada de lluvias el tour puede suspenderse por el nivel del río — pregunta un día antes.',
  },
  {
    label: 'Día 3',
    titulo: 'A media hora del hotel, o Puente de Dios',
    texto: 'Para un día sin carretera larga: el Nacimiento de Huichihuayán, en Huehuetlán, y el Castillo de la Salud, en Axtla, quedan a unos 30 minutos de Xilitla cada uno y te dejan volver a comer al pueblo. Si prefieres otra cascada, el tour a Puente de Dios, en Tamasopo, también es de día completo (unas 12 horas), porque está a 2 h o 2 h 30 de manejo. Ahí el río tiene corriente fuerte y remolinos: se entra solo con chaleco y siguiendo la cuerda, y no se recomienda para menores de 5 años.',
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
            ruta:</strong> un día para Las Pozas de Edward James, la Cascada Los Comales y el pueblo
            de Xilitla; un día completo para Tamul, que consume la jornada entera entre traslado y
            canoa; y un día para lo que queda a media hora —Huichihuayán y el Castillo de la Salud—
            o para Puente de Dios. Con la base en Xilitla no manejas para ver el jardín surrealista.
          </p>
        </AnswerBlock>

        <StatStrip stats={[
          { num: '3', label: 'días para lo esencial de la región' },
          { num: `${HOTEL.minutosCaminandoALasPozas} min`, label: 'del hotel a Las Pozas, caminando' },
          { num: 'Nov–May', label: 'temporada con el agua más turquesa' },
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
              caption="Tiempos aproximados desde el Hotel Paraíso Encantado, en Xilitla; en la sierra, las curvas pueden alargarlos."
              headers={['Destino', 'Traslado', 'Cuánto dura la visita']}
              rows={[
                { cells: ['Las Pozas · Jardín de Edward James', `${HOTEL.minutosCaminandoALasPozas} min caminando`, '1 h 30 min (recorrido guiado)'], highlight: true },
                { cells: ['Centro de Xilitla', '5 min en auto', 'Una tarde'] },
                { cells: ['Nacimiento de Huichihuayán y Castillo de la Salud', '≈ 30 min en auto cada uno', 'Medio día los dos'] },
                { cells: ['Cascada de Tamul', '≈ 1 h a 1 h 30 en auto, hasta el embarcadero', 'Día completo (el tour dura 12 h)'] },
                { cells: ['Puente de Dios', '≈ 2 h a 2 h 30 en auto', 'Día completo (el tour dura 12 h)'] },
                { cells: ['Cascada El Meco', '3 h o más: está en El Naranjo', 'No cabe en 3 días desde Xilitla; queda mejor desde Ciudad Valles'] },
              ]}
            />
            <p>
              Los tours de día completo los opera Huasteca Potosina Tours: pasan por ti al hotel y
              van con guía. En temporada alta los cupos de Tamul se agotan con días de anticipación:
              conviene apartarlo al reservar el hospedaje, por{' '}
              <a href={HOTEL.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a> o en{' '}
              <Link href="/experiencias">experiencias</Link>. El turno de Las Pozas se aparta aparte,
              hasta 60 días antes, en el{' '}
              <a href="https://boletos.laspozasxilitla.org.mx" target="_blank" rel="noopener noreferrer">sistema oficial de reservas</a>.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <h2>Qué llevar</h2>
            <ul>
              <li><strong>Zapato cerrado antiderrapante.</strong> En Las Pozas los escalones son irregulares y con humedad resbalan. Las sandalias no sirven.</li>
              <li><strong>Traje de baño puesto desde la mañana, los días de río.</strong> En varias cascadas los vestidores son básicos o no hay. El día de Las Pozas, no: ahí está prohibido nadar y entrar en traje de baño.</li>
              <li><strong>Efectivo.</strong> Varias atracciones y comedores no tienen terminal, y la señal para transferir es intermitente.</li>
              <li><strong>Bolsa impermeable.</strong> En el tour de Tamul te vas a mojar, incluido lo que traigas en la mochila.</li>
              <li><strong>Muda de ropa seca.</strong> Del embarcadero de Tamul a Xilitla es más de una hora de curvas, y se regresa mojado.</li>
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
          { href: '/paquetes', label: 'Paquetes de hotel y tours' },
        ]} />

        <SeoCta
          title="Duerme donde"
          titleEm="empieza el itinerario"
          body={`A ${HOTEL.minutosCaminandoALasPozas} minutos caminando de Las Pozas, y los tours pasan por ti al hotel.`}
          note={HOTEL.cancelacion}
        />
      </main>
    </>
  );
}
