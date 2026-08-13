import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Car, Moon, Wifi } from 'lucide-react';
import {
  SeoHero, AnswerBlock, StatStrip, CompareTable, SeoFaq, RelatedLinks, SeoCta, seoStyles as styles,
} from '@/components/seo/SeoBlocks';
import { HOTEL, lodgingSchema, breadcrumbSchema, faqSchema } from '@/lib/seo-hotel';

const URL = `${HOTEL.url}/hoteles-en-xilitla`;
const ACTUALIZADO = 'agosto de 2026';

export const metadata: Metadata = {
  title: 'Hoteles en Xilitla: En Qué Zona Conviene Dormir (Guía 2026)',
  description:
    'Xilitla tiene tres zonas para hospedarse y no dan la misma experiencia: centro, La Conchita (camino a Las Pozas) y carretera. Qué esperar de cada una, precios reales y cómo elegir. Hotel Paraíso Encantado, 4.5/5 en 523 reseñas.',
  keywords: ['hoteles en xilitla', 'donde dormir en xilitla', 'hoteles xilitla slp', 'hospedaje xilitla'],
  alternates: { canonical: URL },
  openGraph: {
    title: 'Hoteles en Xilitla — En qué zona conviene dormir',
    description: 'Centro, La Conchita o carretera: qué cambia entre las tres zonas de Xilitla y cuál te conviene según tu plan.',
    url: URL,
    type: 'article',
    images: [{
      url: `${HOTEL.url}/images/Areas comunes/DSC09456-HDR.jpg`,
      width: 1200, height: 630,
      alt: 'Áreas comunes del Hotel Paraíso Encantado en Xilitla, Huasteca Potosina',
    }],
  },
};

const FAQS = [
  {
    q: '¿En qué zona de Xilitla conviene hospedarse?',
    a: `Depende de a qué vayas. La Conchita —el camino que baja a Las Pozas— es la mejor zona si tu plan es el Jardín de Edward James, porque llegas caminando. El centro conviene si quieres salir a cenar y caminar el pueblo de noche. La carretera es la opción más económica, pero necesitas auto para todo.`,
  },
  {
    q: '¿Cuánto cuesta un hotel en Xilitla por noche?',
    a: `Las posadas del centro rondan $600 a $1,000 MXN por noche para dos personas. Los hoteles boutique y cabañas con vista van de $1,500 a $2,800 MXN. En Paraíso Encantado las tarifas empiezan en $${HOTEL.precioDesde.toLocaleString('es-MX')} MXN por noche para dos personas.`,
  },
  {
    q: '¿Qué hotel de Xilitla está más cerca de Las Pozas?',
    a: `El Hotel Paraíso Encantado, a ${HOTEL.metrosALasPozas} metros de la entrada del Jardín de Edward James: unos ${HOTEL.minutosCaminandoALasPozas} minutos caminando, sin necesidad de auto ni taxi.`,
  },
  {
    q: '¿Hace falta auto para quedarse en Xilitla?',
    a: 'Para moverte dentro del pueblo, no: Xilitla es pequeño y se camina. Para las cascadas y Tamul, sí necesitas auto o contratar el tour con transporte, porque están a una y dos horas y medio del pueblo.',
  },
  {
    q: '¿Con cuánta anticipación hay que reservar en Xilitla?',
    a: 'En Semana Santa, puentes largos y diciembre, el pueblo se llena y conviene reservar con un mes o más. Entre semana en temporada baja casi siempre hay lugar, pero las suites con spa privado son pocas y se van primero.',
  },
];

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    lodgingSchema({
      name: `${HOTEL.nombre} — Hotel en Xilitla`,
      description: `Hotel boutique en la zona de La Conchita, Xilitla, a ${HOTEL.metrosALasPozas} metros de Las Pozas de Edward James.`,
      url: URL,
      image: `${HOTEL.url}/images/Areas comunes/DSC09456-HDR.jpg`,
    }),
    breadcrumbSchema([
      { name: 'Inicio', url: HOTEL.url },
      { name: 'Hoteles en Xilitla', url: URL },
    ]),
    faqSchema(FAQS),
  ],
};

const CONSEJOS = [
  { icon: <MapPin size={22} strokeWidth={1.5} />, title: 'Mide la distancia a Las Pozas, no al centro', body: 'Muchos hoteles se anuncian como "cerca de Las Pozas" estando a 15 minutos en auto por camino de terracería. Pregunta metros, no adjetivos.' },
  { icon: <Car size={22} strokeWidth={1.5} />, title: 'Pregunta por el estacionamiento', body: 'El centro de Xilitla tiene calles estrechas y en pendiente. Si llegas en auto, confirma que el hotel tenga estacionamiento propio: en temporada alta no hay dónde dejarlo.' },
  { icon: <Moon size={22} strokeWidth={1.5} />, title: 'Revisa a qué hora cierra la cocina', body: 'En Xilitla la mayoría de los restaurantes cierran entre 8 y 9 de la noche. Si llegas tarde, un hotel con restaurante propio te salva la primera cena.' },
  { icon: <Wifi size={22} strokeWidth={1.5} />, title: 'No des por hecho la señal', body: 'La cobertura celular en la sierra es irregular. Si necesitas trabajar o mandar fotos, confirma que haya WiFi de verdad y no solo en recepción.' },
];

export default function HotelesEnXilitlaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className={styles.main}>

        <SeoHero
          image="/images/Areas comunes/DSC09456-HDR.jpg"
          imageAlt="Áreas comunes y jardines del Hotel Paraíso Encantado en Xilitla, Huasteca Potosina"
          breadcrumb="Hoteles en Xilitla"
          eyebrow="Guía práctica · Xilitla, SLP"
          title="Hoteles en Xilitla:"
          titleEm="dónde dormir"
          titleAfter="según lo que vayas a hacer"
          sub="El pueblo tiene tres zonas de hospedaje y la diferencia entre ellas no es el precio: es cuánto vas a caminar, manejar y a qué hora vas a cenar."
          ctaPrimary={{ href: '/reservar', label: 'Ver disponibilidad' }}
          ctaSecondary={{ href: '/habitaciones', label: 'Ver las 13 suites' }}
          updated={ACTUALIZADO}
        />

        <AnswerBlock label="Respuesta corta">
          <p>
            <strong>En Xilitla hay tres zonas para hospedarse: el centro, La Conchita y la
            carretera.</strong> Si vas por Las Pozas, La Conchita es la mejor: es el camino que baja
            al Jardín de Edward James y desde ahí se llega caminando. El centro conviene para cenar
            y recorrer el pueblo de noche. La carretera es más barata pero exige auto para todo.
          </p>
        </AnswerBlock>

        <StatStrip stats={[
          { num: '3', label: 'zonas de hospedaje en el pueblo' },
          { num: `${HOTEL.metrosALasPozas} m`, label: 'del hotel a Las Pozas, caminando' },
          { num: `${HOTEL.rating}/5`, label: `${HOTEL.reviewCount} reseñas verificadas en Google` },
        ]} />

        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <h2>Las tres zonas de Xilitla, sin adornos</h2>
            <p className={styles.lead}>
              Xilitla está construido sobre una ladera. Eso, que en las fotos se ve precioso,
              significa que la distancia en metros no dice nada: lo que cuenta es si vas cuesta
              arriba o cuesta abajo, y a qué hora.
            </p>

            <CompareTable
              headers={['Zona', 'Qué esperar', 'Te conviene si…']}
              rows={[
                { cells: ['Centro / plaza', 'Posadas y hoteles sencillos alrededor de la plaza y la iglesia. Todo a pie: mercado, cafés, restaurantes. Más ruido en fines de semana y calles estrechas para estacionarse.', 'Vas sin auto, te gusta salir a cenar y quieres el ambiente del pueblo mágico.'] },
                { cells: ['La Conchita (camino a Las Pozas)', 'Hoteles boutique y cabañas con vista a la selva, más silencio y jardines. A minutos caminando del Jardín de Edward James.', 'Las Pozas son el motivo del viaje y quieres entrar temprano, antes de los grupos.'], highlight: true },
                { cells: ['Carretera y afueras', 'Cabañas y hospedajes económicos sobre la carretera federal. Tarifas más bajas y estacionamiento fácil.', 'Buscas el precio más bajo, viajas en auto y solo vas a dormir ahí.'] },
              ]}
            />

            <h3>Por qué La Conchita cambia el viaje</h3>
            <p>
              Las Pozas abren temprano y se llenan a media mañana, cuando llegan los autobuses de
              excursión. Dormir en La Conchita te permite estar en la entrada al abrir y recorrer el
              jardín con el sitio casi vacío. Desde el centro tendrías que bajar en auto o taxi; desde
              la carretera, manejar. Es la diferencia entre ver Las Pozas y hacer fila en Las Pozas.
            </p>
            <p>
              El <Link href="/hotel-cerca-de-las-pozas">Hotel Paraíso Encantado</Link> está en esa
              zona, a {HOTEL.metrosALasPozas} metros de la entrada — el más cercano del pueblo.
            </p>
          </div>
        </section>

        <section className={styles.sectionAlt}>
          <div className={styles.sectionInner}>
            <h2>Cuatro cosas que conviene preguntar antes de reservar</h2>
            <div className={styles.cards}>
              {CONSEJOS.map(c => (
                <div key={c.title} className={styles.card}>
                  <span className={styles.cardIcon}>{c.icon}</span>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <h2>Qué encuentras en Paraíso Encantado</h2>
            <CompareTable
              headers={['Dato', 'Detalle']}
              rows={[
                { cells: ['Zona', 'La Conchita, camino a Las Pozas'], highlight: true },
                { cells: ['A Las Pozas', `${HOTEL.metrosALasPozas} metros — ${HOTEL.minutosCaminandoALasPozas} min caminando`] },
                { cells: ['Al centro de Xilitla', '10 min caminando'] },
                { cells: ['Suites', `${HOTEL.suites}, de 2 a ${HOTEL.capacidadMaxima} personas`] },
                { cells: ['Con piscina spa privada en la suite', `${HOTEL.suitesConSpaPrivado} de ${HOTEL.suites}`] },
                { cells: ['Restaurante', `${HOTEL.restaurante}, en el hotel`] },
                { cells: ['Estacionamiento', 'Gratuito, en el hotel'] },
                { cells: ['Desde', `$${HOTEL.precioDesde.toLocaleString('es-MX')} MXN/noche (2 personas)`] },
                { cells: ['Cancelación', HOTEL.cancelacion] },
              ]}
            />
          </div>
        </section>

        <SeoFaq faqs={FAQS} />

        <RelatedLinks links={[
          { href: '/mejor-hotel-huasteca-potosina', label: 'Cómo elegir hotel en la Huasteca Potosina' },
          { href: '/hotel-cerca-de-las-pozas', label: 'El hotel más cercano a Las Pozas' },
          { href: '/hotel-alberca-privada-xilitla', label: 'Hoteles con alberca privada en la habitación' },
          { href: '/hotel-familias-xilitla', label: 'Hotel para familias en Xilitla' },
          { href: '/hotel-luna-de-miel-xilitla', label: 'Luna de miel en Xilitla' },
          { href: '/xilitla', label: 'Qué ver en Xilitla' },
        ]} />

        <SeoCta
          title="La zona que te acerca"
          titleEm="a Las Pozas"
          body={`${HOTEL.suites} suites en La Conchita, a ${HOTEL.minutosCaminandoALasPozas} minutos caminando del Jardín de Edward James.`}
          note={`${HOTEL.cancelacion}`}
        />
      </main>
    </>
  );
}
