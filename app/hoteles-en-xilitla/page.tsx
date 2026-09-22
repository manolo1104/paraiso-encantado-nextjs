import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Car, Moon, Wifi, Waves, CreditCard } from 'lucide-react';
import {
  SeoHero, AnswerBlock, StatStrip, CompareTable, SeoFaq, RelatedLinks, SeoCta, seoStyles as styles,
} from '@/components/seo/SeoBlocks';
import { HOTEL, lodgingSchema, breadcrumbSchema, faqSchema } from '@/lib/seo-hotel';
import local from './hoteles-en-xilitla.module.css';

const URL = `${HOTEL.url}/hoteles-en-xilitla`;
const ACTUALIZADO = 'agosto de 2026';

// Título de 55 caracteres y descripción de 152: por encima de ~60 y ~155 Google
// corta el texto en el resultado, y ese corte es la causa medida del CTR de 0.2%
// que traía esta página.
export const metadata: Metadata = {
  title: 'Hoteles en Xilitla: 10 opciones, precios y zonas (2026)',
  description:
    'Los 10 hoteles de Xilitla comparados: zona, precio por noche, distancia a Las Pozas, alberca y estacionamiento. Cuál te conviene según tu plan de viaje.',
  keywords: [
    'hoteles en xilitla', 'hotel xilitla', 'hoteles xilitla slp', 'hospedaje xilitla',
    'hoteles en xilitla con alberca', 'hoteles en xilitla precios',
    'hoteles en xilitla con estacionamiento', 'hoteles en xilitla centro',
    'donde dormir en xilitla',
  ],
  alternates: { canonical: URL },
  openGraph: {
    title: 'Hoteles en Xilitla — 10 opciones comparadas',
    description: 'Zona, precio por noche, distancia a Las Pozas, alberca y estacionamiento de los hoteles de Xilitla, en una sola tabla.',
    url: URL,
    type: 'article',
    images: [{
      url: `${HOTEL.url}/images/Areas comunes/DSC09456-HDR.jpg`,
      width: 1200, height: 630,
      alt: 'Áreas comunes del Hotel Paraíso Encantado en Xilitla, Huasteca Potosina',
    }],
  },
};

/**
 * Las preguntas están redactadas con las palabras EXACTAS con que la gente las
 * escribe en Google —"hoteles en Xilitla con alberca", "hoteles en Xilitla
 * precios", "qué hoteles hay en Xilitla"— y no con las que suenan mejor. Search
 * Console mide esas consultas con impresiones reales y cero clics: si la
 * pregunta no está escrita igual, el buscador no la empareja.
 */
const FAQS = [
  {
    q: '¿Qué hoteles hay en Xilitla, San Luis Potosí?',
    a: `Los que más se reservan son Paraíso Encantado, Casa Caracol y Posada James sobre el camino a Las Pozas; Posada El Castillo, Hotel Casablanca, Hotel Sierra Linda y Roof Top Hotel en el centro del pueblo; y Hotel Real de Lua, Monte Ixk'al y Tapasoli en las afueras. Xilitla es un pueblo pequeño: no hay cadenas hoteleras y casi todo el hospedaje es de dueños locales.`,
  },
  {
    q: '¿Hay hoteles en Xilitla con alberca?',
    a: `Sí, y son la mayoría de los hoteles del pueblo. Con alberca están Paraíso Encantado, Casa Caracol, Posada James, Posada El Castillo, Hotel Casablanca, Hotel Sierra Linda, Roof Top Hotel —la suya está en la azotea—, Hotel Real de Lua, Monte Ixk'al y Tapasoli. Lo que casi ninguno tiene es alberca climatizada: en diciembre y enero el agua está fría. En Paraíso Encantado, ${HOTEL.suitesConSpaPrivado} de las ${HOTEL.suites} suites tienen además piscina spa privada con agua caliente en su propia terraza.`,
  },
  {
    q: '¿Cuáles son los precios de los hoteles en Xilitla?',
    a: `En la tabla de arriba van de unos $550 a $1,900 MXN por noche para dos personas. Los más económicos son hoteles sencillos del centro; los del camino a Las Pozas y las cabañas de las afueras suelen estar arriba de $1,500. En Paraíso Encantado las tarifas empiezan en $${HOTEL.precioDesde.toLocaleString('es-MX')} MXN por noche para dos personas. En Semana Santa, puentes y diciembre estas cifras suben, así que conviene confirmar el precio con cada hotel para tus fechas.`,
  },
  {
    q: '¿Hay hoteles en Xilitla con estacionamiento?',
    a: 'Casi todos ofrecen estacionamiento y en la mayoría es gratuito, pero conviene preguntar dónde está: varios hoteles del centro estacionan a una o dos cuadras, en un lote que no es del hotel. Las calles del centro son estrechas y en pendiente, y en temporada alta no hay lugar en la vía pública. Los hoteles del camino a Las Pozas y de las afueras estacionan dentro de la propiedad.',
  },
  {
    q: '¿Conviene un hotel en el centro de Xilitla?',
    a: 'Conviene si vas sin auto, si quieres salir a cenar y caminar la plaza de noche, o si buscas la tarifa más baja: los hospedajes más económicos del pueblo están ahí, aunque el centro también tiene opciones caras. Lo que no da el centro es cercanía real a Las Pozas — desde la plaza son unos 2 kilómetros cuesta abajo, que se bajan caminando en media hora pero se suben en taxi.',
  },
  {
    q: '¿En qué zona de Xilitla conviene hospedarse?',
    a: `Depende de a qué vayas. La Conchita —el camino que baja a Las Pozas— es la mejor zona si tu plan es el Jardín de Edward James, porque llegas caminando. El centro conviene si quieres salir a cenar y caminar el pueblo de noche. La carretera es la opción más económica, pero necesitas auto para todo.`,
  },
  {
    q: '¿Qué hace que suba el precio de un hotel en Xilitla?',
    a: `Tres cosas, en este orden. La fecha: en Semana Santa, diciembre y puentes las tarifas suben y varios hoteles piden estancia mínima de dos o tres noches. El número de personas: casi todos cobran por persona adicional a partir de la tercera, no por habitación. Y la ubicación: estar a distancia caminable de Las Pozas es lo que más encarece una habitación en este pueblo. En Paraíso Encantado las tarifas empiezan en $${HOTEL.precioDesde.toLocaleString('es-MX')} MXN por noche para dos personas y ${HOTEL.anticipo.charAt(0).toLowerCase() + HOTEL.anticipo.slice(1)}`,
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
  {
    q: '¿Hay hostales o moteles baratos en Xilitla?',
    a: 'Hostales como tal hay muy pocos: lo más parecido son los tipis y las camas compartidas de Casa Caracol, sobre el camino a Las Pozas. Moteles de paso, en el sentido de carretera, prácticamente no existen en Xilitla; lo económico del pueblo son posadas familiares del centro, que en la tabla de arriba arrancan alrededor de $560 MXN la noche. Xilitla es un pueblo pequeño y casi todo el hospedaje es de familias locales.',
  },
  {
    q: '¿Hay hoteles de 3 o 4 estrellas en Xilitla?',
    a: 'Varios se clasifican como 3 estrellas en los buscadores de hospedaje, pero la categoría dice poco aquí: no hay cadenas ni hoteles grandes en Xilitla. El pueblo se hospeda en hoteles boutique, posadas y cabañas chicas, casi todos de dueño local. Vale más mirar la calificación en Google y lo que incluye la tarifa que el número de estrellas.',
  },
  {
    q: '¿Hay hoteles todo incluido en Xilitla?',
    a: 'No en el sentido de la playa: ningún hotel de Xilitla vende pulsera con bebidas y comidas libres. Lo que sí existe son paquetes de hotel más tours —Las Pozas, cascadas, Tamul— con transporte y guía, que se contratan aparte y salen mejor que armarlo suelto. Algunos hoteles, como Paraíso Encantado, tienen restaurante propio, pero el desayuno se cobra por separado salvo que la tarifa lo diga.',
  },
  {
    q: '¿Qué hotel de Xilitla conviene si voy con niños?',
    a: 'Los del camino a Las Pozas y los de las afueras, por dos razones: tienen jardín y alberca donde los niños se mueven sin salir a la calle, y evitan el tramo de banqueta estrecha del centro. Si el plan incluye Las Pozas, además ahorra la caminata de regreso cuesta arriba con niños cansados, que es la queja más repetida de quien se hospeda en el centro.',
  },
];

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    lodgingSchema({
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

/**
 * Los hoteles del pueblo, con Paraíso Encantado dentro de la misma tabla y no
 * aparte.
 *
 * Dos reglas que no se rompen aquí:
 *
 * 1. **Ningún dato inventado.** Tarifas y distancias salen de lo que cada hotel
 *    o los buscadores de hospedaje publicaban en septiembre de 2026. Donde no
 *    hubo fuente fiable va "Consultar", no una cifra aproximada: este es el
 *    sitio de un negocio real y publicar un precio falso de un competidor es un
 *    problema serio, no un detalle de SEO.
 * 2. **Sin enlaces a la competencia.** Se les nombra, igual que hacen las guías
 *    de viaje, porque una página que solo nombra un hotel no puede ser la
 *    respuesta a una búsqueda en plural. Pero los enlaces salientes hacia
 *    reservas de otros hoteles se regalarían sin recibir nada.
 */
const HOTELES: { cells: string[]; highlight?: boolean }[] = [
  { cells: ['Hotel Paraíso Encantado', 'La Conchita, camino a Las Pozas', `$${HOTEL.precioDesde.toLocaleString('es-MX')}`, `${HOTEL.metrosALasPozas} m · ${HOTEL.minutosCaminandoALasPozas} min a pie`, `Sí — y ${HOTEL.suitesConSpaPrivado} suites con spa privado`, 'Sí, gratuito'], highlight: true },
  { cells: ['Casa Caracol', 'Camino a Las Pozas', 'Consultar', '300 m · a pie', 'Sí', 'Consultar'] },
  { cells: ['Posada James', 'Camino a Las Pozas', '≈ $1,550', '8 min a pie', 'Sí', 'Sí, gratuito'] },
  { cells: ['Posada El Castillo', 'Centro, junto a la plaza', '≈ $1,900', 'Unos 2 km', 'Sí', 'Sí'] },
  { cells: ['Hotel Casablanca', 'Centro, a pie de la plaza', '≈ $1,300', 'Unos 2 km', 'Sí', 'Sí, gratuito'] },
  { cells: ['Hotel Sierra Linda', 'Centro, 5 min a pie de la plaza', '≈ $650', 'Unos 2 km', 'Sí', 'Sí, a una cuadra'] },
  { cells: ['Roof Top Hotel Xilitla', 'Centro, tras la plaza', '≈ $560', 'Unos 3 km', 'Sí, en la azotea', 'Sí'] },
  { cells: ['Hotel Real de Lua', 'Afueras, camino a Apetzco', '≈ $1,600', 'Unos 3 km', 'Sí', 'Sí, gratuito'] },
  { cells: ["Hotel Monte Ixk'al", 'Afueras, camino a San Antonio', '≈ $860', 'Unos 5 km', 'Sí', 'Sí, gratuito'] },
  { cells: ['Hotel Tapasoli', 'Apetzco, afueras', 'Desde $1,200', '15 min en auto', 'Sí', 'Sí, gratuito'] },
];

const CONSEJOS = [
  { icon: <MapPin size={22} strokeWidth={1.5} />, title: 'Mide la distancia a Las Pozas, no al centro', body: 'Muchos hoteles se anuncian como "cerca de Las Pozas" estando a 15 minutos en auto por camino de terracería. Pregunta metros, no adjetivos.' },
  { icon: <Car size={22} strokeWidth={1.5} />, title: 'Pregunta dónde está el estacionamiento', body: 'No basta con que el hotel diga que tiene. Varios del centro estacionan en un lote a una o dos cuadras, que no es suyo y cierra de noche. Pregunta si el auto queda dentro de la propiedad.' },
  { icon: <Moon size={22} strokeWidth={1.5} />, title: 'Revisa a qué hora cierra la cocina', body: 'En Xilitla la mayoría de los restaurantes cierran entre 8 y 9 de la noche. Si llegas tarde, un hotel con restaurante propio te salva la primera cena.' },
  { icon: <Wifi size={22} strokeWidth={1.5} />, title: 'No des por hecho la señal', body: 'La cobertura celular en la sierra es irregular. Si necesitas trabajar o mandar fotos, confirma que haya WiFi de verdad y no solo en recepción.' },
  { icon: <Waves size={22} strokeWidth={1.5} />, title: 'Pregunta si la alberca es climatizada', body: 'Casi todos los hoteles del pueblo tienen alberca, pero muy pocos la calientan. De noviembre a febrero eso decide si el agua se usa o solo se ve.' },
  { icon: <CreditCard size={22} strokeWidth={1.5} />, title: 'Confirma cómo se paga y qué pasa si cancelas', body: 'Varios hospedajes de Xilitla solo aceptan efectivo o transferencia y no devuelven el anticipo. Pide por escrito el monto, la forma de pago y la política de cancelación antes de apartar.' },
];

/** Lo que la tarifa suele cubrir en Xilitla y lo que casi nunca cubre. */
const INCLUYE = [
  'Habitación con baño privado y agua caliente.',
  'WiFi en áreas comunes; en el cuarto no siempre llega igual.',
  'Alberca de uso común, sin climatizar salvo excepciones.',
  'Estacionamiento, gratuito en la mayoría.',
  'Ventilador o aire acondicionado — pregúntalo, en verano importa.',
];

const NO_INCLUYE = [
  'La entrada a Las Pozas, que se paga aparte y en taquilla.',
  'El desayuno, salvo que la tarifa lo diga expresamente.',
  'Los tours a cascadas, Tamul o Puente de Dios, que se contratan por fuera.',
  'Traslado desde la central de autobuses o desde Ciudad Valles.',
  'Servicio a la habitación de noche: casi ninguna cocina del pueblo abre después de las 9.',
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
          titleEm="los 10 del pueblo,"
          titleAfter="comparados sin adornos"
          sub="Zona, precio por noche, distancia real a Las Pozas, alberca y estacionamiento de cada hotel. Y qué conviene según lo que vayas a hacer."
          ctaPrimary={{ href: '/reservar', label: 'Ver disponibilidad' }}
          ctaSecondary={{ href: '/habitaciones', label: 'Ver las 13 suites' }}
          updated={ACTUALIZADO}
        />

        <AnswerBlock label="Respuesta corta">
          <p>
            <strong>Los hoteles de Xilitla se reparten en tres zonas y cuestan entre $550 y $1,900
            MXN la noche en temporada baja.</strong> Sobre el camino a Las Pozas están Paraíso Encantado, Casa Caracol
            y Posada James: son los únicos desde los que se llega caminando al Jardín de Edward
            James. En el centro están Posada El Castillo, Casablanca, Sierra Linda y Roof Top, más
            baratos y a un paso de los restaurantes. En las afueras, Real de Lua, Monte Ixk&apos;al y
            Tapasoli, con más espacio y tarifas medias, pero exigen auto para todo.
          </p>
          <p>
            Si el viaje es por Las Pozas, duerme en el camino a Las Pozas. Si es por el pueblo,
            duerme en el centro. Esa es toda la decisión.
          </p>
        </AnswerBlock>

        <StatStrip stats={[
          { num: '10', label: 'hoteles del pueblo comparados aquí' },
          { num: `${HOTEL.metrosALasPozas} m`, label: 'de Paraíso Encantado a Las Pozas, caminando' },
          { num: `${HOTEL.rating}/5`, label: `${HOTEL.reviewCount} reseñas verificadas en Google` },
        ]} />

        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <h2>Los 10 hoteles de Xilitla, comparados</h2>
            <p className={styles.lead}>
              Xilitla es un pueblo pequeño y su hospedaje no se parece nada al de una ciudad: no
              hay cadenas ni hoteles grandes. Son hoteles boutique,
              posadas familiares y cabañas chicas, casi todos de dueños del
              lugar. Estos son los que más se reservan, con lo único que de verdad cambia la
              estancia: dónde están, cuánto cuestan y qué tan lejos queda Las Pozas.
            </p>

            <p className={local.swipeHint}>Desliza la tabla para ver todas las columnas.</p>
            <div className={local.hotelesTable}>
              <CompareTable
                headers={['Hotel', 'Zona', 'Desde (MXN/noche)', 'A Las Pozas', 'Alberca', 'Estacionamiento']}
                rows={HOTELES}
              />
            </div>
            {/* La nota va fuera de la tabla y no en su <caption>: dentro, hereda el
                ancho mínimo de 760 px y en móvil se corta a media frase detrás del
                scroll horizontal, justo la parte que explica de dónde salen las
                cifras. */}
            <p className={local.tablaNota}>
              Tarifa más baja publicada por cada hotel o en buscadores de hospedaje en septiembre de
              2026, para dos personas. Cambian con la temporada. Las distancias son por carretera y
              aproximadas. Donde dice &laquo;Consultar&raquo; no encontramos un dato confiable y
              preferimos no inventarlo.
            </p>

            <p>
              Tres cosas saltan de la tabla. La primera: entre el hotel más
              barato y el más caro hay más del triple de diferencia, y no siempre corresponde a la
              calidad, sino a si el hotel tiene jardín propio o está encajado entre dos casas del
              centro. La segunda: casi todos tienen alberca, así que la alberca no es criterio para
              elegir — lo que casi ninguno tiene es{' '}
              <Link href="/hotel-alberca-privada-xilitla">alberca climatizada</Link>. Y la tercera, la que más
              pesa: solo tres hoteles del pueblo están a distancia caminable de Las Pozas. Los
              demás, incluidos los del centro, son un trayecto en auto o taxi.
            </p>
            <p>
              Los nombres de arriba se mencionan sin enlace y sin acuerdo comercial de por medio. La
              tabla está para que la comparación se pueda hacer en un solo lugar, no para empujar a
              ninguno.
            </p>
          </div>
        </section>

        <section className={styles.sectionAlt}>
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

            <h3>Cómo elegir zona según el plan del viaje</h3>
            <p>
              La pregunta útil no es cuál es el mejor hotel de Xilitla, sino qué vas a hacer los dos
              días que vas a estar aquí. Casi todos los viajes a Xilitla caen en uno de estos cinco
              planes, y cada uno tiene una zona que lo hace fácil y otra que lo complica.
            </p>
            <p>
              <strong>Vas sobre todo por Las Pozas.</strong> Duerme en el camino a Las Pozas. El
              jardín abre a las nueve y para las once ya llegaron los autobuses de excursión.
              Dormir a pocos metros es lo único que te deja entrar al abrir, salir a desayunar y
              volver por la tarde sin pagar taxi dos veces.
            </p>
            <p>
              <strong>Vas por el pueblo: el mercado, el café, las artesanías.</strong> Duerme en el
              centro. Es la zona más barata, se cena a las nueve sin pensar en el regreso y el
              ambiente del pueblo mágico se vive desde la puerta del hotel. Asume que a Las Pozas
              vas a bajar en auto o taxi.
            </p>
            <p>
              <strong>Vas con niños.</strong> Camino a Las Pozas o afueras. Lo que cansa a los niños
              en Xilitla no es el calor: son las pendientes y las banquetas angostas del centro. Un
              hotel con jardín y alberca les da dónde estar sin salir a la calle.{' '}
              <Link href="/hotel-familias-xilitla">Aquí está el detalle de hospedarse en familia</Link>.
            </p>
            <p>
              <strong>Vas en pareja o de luna de miel.</strong> Camino a Las Pozas. Es la zona con
              hoteles boutique, silencio de noche y vista a la selva; el centro tiene música hasta
              tarde los fines de semana.{' '}
              <Link href="/hotel-luna-de-miel-xilitla">Cómo es Xilitla en pareja</Link>.
            </p>
            <p>
              <strong>Xilitla es solo una parada de una ruta más grande.</strong> Afueras o
              carretera. Si llegas de noche desde Ciudad Valles y sales temprano rumbo a las
              cascadas, la tarifa baja y el estacionamiento fácil valen más que la ubicación.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <h2>Seis cosas que conviene preguntar antes de reservar</h2>
            <p className={styles.lead}>
              En Xilitla casi todo el hospedaje es de dueño local y se administra por WhatsApp, no
              por un sistema de reservas. Eso tiene una ventaja —se puede preguntar todo y contestan
              rápido— y una desventaja: lo que no preguntas, no viene escrito en ningún lado.
            </p>
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

        <section className={styles.sectionAlt}>
          <div className={styles.sectionInner}>
            <h2>Qué incluye normalmente un hotel en Xilitla y qué no</h2>
            <p className={styles.lead}>
              La tarifa que ves publicada cubre más o menos lo mismo en todo el pueblo. Conviene
              saberlo antes para no llevarte la sorpresa en el mostrador ni presupuestar de menos el
              viaje completo.
            </p>

            <div className={local.dosColumnas}>
              <div className={local.columna}>
                <h3>Lo que casi siempre entra en la tarifa</h3>
                <ul>
                  {INCLUYE.map(i => <li key={i}>{i}</li>)}
                </ul>
              </div>
              <div className={local.columna}>
                <h3>Lo que casi nunca entra</h3>
                <ul>
                  {NO_INCLUYE.map(i => <li key={i}>{i}</li>)}
                </ul>
              </div>
            </div>

            <p>
              Hay dos gastos que la gente olvida al hacer cuentas. El primero es la entrada a Las
              Pozas, que se paga en taquilla el día de la visita y no la vende ningún hotel. El
              segundo es el transporte a las cascadas: Puente de Dios, Tamul o El Meco están a una y
              dos horas y media de Xilitla, y sin auto propio hay que contratar tour. Si vas a
              hacerlo, comparar el paquete de hotel más tours contra armarlo por separado suele dar
              una diferencia de varios cientos de pesos por persona.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <h2>Temporada alta, temporada baja y qué pasa con los precios</h2>
            <p className={styles.lead}>
              Xilitla no tiene temporada alta de meses, tiene temporada alta de fechas. El pueblo
              pasa de tener lugar de sobra a no tener una sola habitación disponible en cuestión de
              días, y las tarifas se mueven con eso.
            </p>

            <h3>Las fechas en las que el pueblo se llena</h3>
            <p>
              Semana Santa es la más cargada del año, seguida de diciembre entre Navidad y Año
              Nuevo, los puentes largos —febrero, marzo, mayo, noviembre— y las vacaciones de
              verano de julio y agosto, que además coinciden con la temporada de lluvias, cuando
              las cascadas llevan más agua. En esas fechas los hoteles del camino a Las Pozas se
              agotan primero, porque son los menos y los más buscados.
            </p>

            <h3>Cuánto suben las tarifas</h3>
            <p>
              En Xilitla la tarifa de temporada alta está bastante por encima de la de un martes de
              septiembre, y en Semana Santa varios hoteles piden
              estancia mínima de dos o tres noches. Las cifras de la tabla de arriba son de
              temporada baja: úsalas para comparar hoteles entre sí, no como el precio que vas a
              pagar en un puente.
            </p>

            <h3>Cuándo conviene venir si el precio importa</h3>
            <p>
              De martes a jueves, fuera de puente, en septiembre, octubre o los primeros días de
              noviembre. Es cuando hay tarifa baja, Las Pozas está casi vacío y el verde de la
              sierra está en su mejor momento después de las lluvias. La contra es que en esos meses
              puede llover por la tarde, aunque rara vez el día entero.
            </p>

            <h3>Con cuánta anticipación reservar</h3>
            <p>
              Para Semana Santa, diciembre y puentes: un mes o más, y para el camino a Las Pozas
              conviene todavía antes. Para un fin de semana normal: dos o tres semanas. Entre semana
              en temporada baja casi siempre hay lugar el mismo día, con una excepción — las
              habitaciones con alberca o spa privado son pocas en todo el pueblo y se van primero
              siempre.
            </p>
          </div>
        </section>

        <section className={styles.sectionAlt}>
          <div className={styles.sectionInner}>
            <h2>Qué encuentras en Paraíso Encantado</h2>
            <p className={styles.lead}>
              Lo que sigue son los datos del hotel desde el que está hecha esta guía, con las mismas
              columnas que le pedimos a los demás.
            </p>
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
          { href: '/mejor-hotel-xilitla', label: 'Por qué Paraíso Encantado es el mejor hotel de Xilitla' },
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
