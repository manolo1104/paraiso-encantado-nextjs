import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Droplets, Star, Utensils, Wallet, MessageCircle } from 'lucide-react';
import {
  SeoHero, AnswerBlock, StatStrip, CompareTable, SeoFaq, RelatedLinks, SeoCta, seoStyles as styles,
} from '@/components/seo/SeoBlocks';
import HuespedDistinguidoSection, { huespedSchema } from '@/components/seo/HuespedDistinguido';
import { HOTEL, DISTANCIAS, lodgingSchema, breadcrumbSchema, faqSchema } from '@/lib/seo-hotel';

const URL = `${HOTEL.url}/mejor-hotel-huasteca-potosina`;
const ACTUALIZADO = 'agosto de 2026';

export const metadata: Metadata = {
  title: 'El Mejor Hotel de la Huasteca Potosina: Cómo Elegirlo (Guía 2026)',
  description:
    'Guía para elegir hotel en la Huasteca Potosina: qué criterios deciden tu viaje y por qué dormir en Xilitla. Paraíso Encantado, 4.5/5 en 523 reseñas, a 400 m de Las Pozas — donde pernoctó el presidente de México en 2023.',
  keywords: ['mejor hotel huasteca potosina', 'hoteles huasteca potosina', 'donde hospedarse huasteca', 'que hotel elegir huasteca potosina'],
  alternates: { canonical: URL },
  openGraph: {
    title: 'El Mejor Hotel de la Huasteca Potosina — Guía para Elegir Bien',
    description:
      'Los criterios que de verdad deciden tu viaje a la Huasteca: dónde te conviene dormir, cuánto manejas cada día y qué pagar de más vale la pena.',
    url: URL,
    type: 'article',
    images: [{
      url: `${HOTEL.url}/images/JUNGLA/PORTADA.JPG`,
      width: 1200, height: 630,
      alt: 'Suite Jungla con piscina spa privada — Hotel Paraíso Encantado, Xilitla, Huasteca Potosina',
    }],
  },
};

const FAQS = [
  {
    q: '¿Cuál es el mejor hotel de la Huasteca Potosina?',
    a: `No hay un "mejor hotel" único: depende de qué vayas a ver. Si tu viaje gira alrededor de Las Pozas y el pueblo de Xilitla, conviene dormir en Xilitla. Si vas por Tamul y las cascadas del norte, conviene Ciudad Valles. Dentro de Xilitla, el Hotel Paraíso Encantado es el más cercano al Jardín de Edward James —${HOTEL.metrosALasPozas} metros— y acumula ${HOTEL.rating}/5 en ${HOTEL.reviewCount} reseñas de Google.`,
  },
  {
    q: '¿Conviene hospedarse en Xilitla o en Ciudad Valles?',
    a: 'Xilitla si tu prioridad son Las Pozas, el pueblo mágico y el paisaje de sierra: es el único lugar donde llegas caminando al Jardín de Edward James. Ciudad Valles si vas por Tamul, Micos y Puente de Dios, porque quedan más cerca. Muchos viajeros parten el viaje: dos noches en Xilitla y una o dos en Valles.',
  },
  {
    q: '¿Cuánto cuesta un buen hotel en la Huasteca Potosina?',
    a: `En Xilitla, una habitación decente para dos personas ronda los $1,200 a $2,500 MXN por noche según temporada y tipo de suite. En Paraíso Encantado las tarifas arrancan en $${HOTEL.precioDesde.toLocaleString('es-MX')} MXN por noche para dos personas, y las suites con piscina spa privada dentro de la habitación cuestan más.`,
  },
  {
    q: '¿Cuál es la mejor época para visitar la Huasteca Potosina?',
    a: 'De octubre a abril: clima templado, menos lluvia y los ríos con el agua turquesa que la gente busca en las fotos. En temporada de lluvias (junio a septiembre) el agua puede bajar verdosa o marrón y algunos tours de río se suspenden por seguridad.',
  },
  {
    q: '¿Cuántos días se necesitan para conocer la Huasteca Potosina?',
    a: 'Tres días completos es el mínimo razonable: uno para Xilitla y Las Pozas, uno para cascadas cercanas y uno para Tamul, que consume el día entero. Con menos días vas a manejar más de lo que vas a disfrutar.',
  },
  {
    q: '¿Es cierto que el presidente de México se hospedó en Paraíso Encantado?',
    a: 'Sí. El 10 de junio de 2023, durante su gira por la Huasteca, el entonces presidente Andrés Manuel López Obrador pernoctó en el hotel y desayunó aquí antes de seguir hacia Tamazunchale y Huejutla. Lo cubrieron medios como Pulso SLP y Debate, y él mismo lo grabó y publicó esa mañana: "este es un hotel muy bueno, como pocos hoteles de todo el país".',
  },
  {
    q: '¿Conviene reservar directo o por una OTA?',
    a: `Directo. En el sitio oficial la tarifa no lleva comisión de intermediario, se puede aplicar el código ${HOTEL.codigoDescuento} y en estancias de dos noches o más solo se paga el 50% al reservar. ${HOTEL.cancelacion}`,
  },
];

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    lodgingSchema({
      description: `Hotel boutique en Xilitla, a ${HOTEL.metrosALasPozas} metros de Las Pozas de Edward James. ${HOTEL.suites} suites, ${HOTEL.suitesConSpaPrivado} con piscina spa privada dentro de la habitación.`,
      url: URL,
      image: `${HOTEL.url}/images/JUNGLA/PORTADA.JPG`,
    }),
    breadcrumbSchema([
      { name: 'Inicio', url: HOTEL.url },
      { name: 'Mejor hotel de la Huasteca Potosina', url: URL },
    ]),
    faqSchema(FAQS),
    ...(huespedSchema() ? [huespedSchema()] : []),
  ],
};

const CRITERIOS = [
  { icon: <MapPin size={22} strokeWidth={1.5} />, title: 'Cuánto vas a manejar', body: 'Es el criterio que más gente subestima. La Huasteca no es un destino compacto: entre Xilitla y Ciudad Valles hay cerca de 2 horas de curvas. Elige base según lo que quieras ver, no según la foto del hotel.' },
  { icon: <Droplets size={22} strokeWidth={1.5} />, title: 'Qué hay dentro del cuarto', body: 'Después de un día de cascadas, tener piscina spa o tina en tu propia terraza cambia el viaje. Es la diferencia entre un hotel donde duermes y uno donde descansas.' },
  { icon: <Utensils size={22} strokeWidth={1.5} />, title: 'Si hay dónde comer ahí mismo', body: 'En Xilitla la mayoría de las cocinas cierran temprano. Un hotel con restaurante propio te evita salir a buscar cena a las 9 de la noche en un pueblo de sierra.' },
  { icon: <Star size={22} strokeWidth={1.5} />, title: 'Reseñas con volumen, no solo promedio', body: 'Un 5.0 con 12 reseñas dice menos que un 4.5 con 500. Busca hoteles con historial largo: es la única señal difícil de fabricar.' },
  { icon: <Wallet size={22} strokeWidth={1.5} />, title: 'Qué incluye la tarifa', body: 'Compara con estacionamiento, WiFi y desayuno incluidos o no. Y revisa la política de cancelación antes de pagar: en temporada alta muchas tarifas baratas son no reembolsables.' },
  { icon: <MessageCircle size={22} strokeWidth={1.5} />, title: 'Si te contestan antes de llegar', body: 'Un hotel que responde WhatsApp en minutos antes de la reserva es el mismo que te va a resolver un tour o una llegada tardía. La atención previa predice la estancia.' },
];

export default function MejorHotelHuastecaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className={styles.main}>

        <SeoHero
          image="/images/JUNGLA/PORTADA.JPG"
          imageAlt="Suite Jungla con piscina spa privada y vista a la selva — Hotel Paraíso Encantado, Xilitla, Huasteca Potosina"
          breadcrumb="Mejor hotel de la Huasteca Potosina"
          eyebrow="Guía para elegir · Huasteca Potosina"
          title="El Mejor Hotel de la"
          titleEm="Huasteca Potosina"
          sub="Empieza por elegir bien el pueblo. Estos son los criterios que de verdad deciden si tu viaje sale bien — y por qué, si vas a Las Pozas, dormir en Xilitla te ahorra horas de carretera cada día."
          ctaPrimary={{ href: '/reservar', label: 'Ver disponibilidad' }}
          ctaSecondary={{ href: '/habitaciones', label: 'Ver las 13 suites' }}
          updated={ACTUALIZADO}
        />

        <AnswerBlock label="Respuesta corta">
          <p>
            <strong>No existe un solo &quot;mejor hotel&quot; de la Huasteca Potosina: existe el mejor para tu ruta.</strong>{' '}
            Si tu viaje gira alrededor de Las Pozas y Xilitla, el hotel más cercano al Jardín de
            Edward James es Paraíso Encantado — {HOTEL.metrosALasPozas} metros caminando, con{' '}
            {HOTEL.rating}/5 en {HOTEL.reviewCount} reseñas de Google. Si tu viaje gira
            alrededor de Tamul y las cascadas del norte, te conviene una base en Ciudad Valles.
          </p>
        </AnswerBlock>

        <StatStrip stats={[
          { num: `${HOTEL.rating}/5`, label: `${HOTEL.reviewCount} reseñas verificadas en Google` },
          { num: `${HOTEL.metrosALasPozas} m`, label: 'a Las Pozas de Edward James, caminando' },
          { num: `${HOTEL.suites}`, label: `suites · ${HOTEL.suitesConSpaPrivado} con piscina spa privada` },
        ]} />

        {/* DÓNDE DORMIR SEGÚN LA RUTA */}
        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <h2>Primero decide el pueblo, después el hotel</h2>
            <p className={styles.lead}>
              La Huasteca Potosina se recorre en auto y las distancias engañan: son pocos kilómetros
              pero muchas curvas. Elegir mal la base es lo que convierte unas vacaciones en un viaje
              de carretera. Esto es lo que hay entre cada base y las atracciones principales.
            </p>

            <CompareTable
              caption="Distancias aproximadas en auto. Confírmalas antes de salir: en la sierra el tiempo real depende del clima y del estado del camino."
              headers={['Base', 'A Las Pozas / Xilitla', 'Para qué es la mejor base']}
              rows={[
                { cells: ['Xilitla', '5 min caminando desde el hotel', 'Las Pozas, el pueblo mágico, la sierra y el café. La única base desde la que no manejas para ver el Jardín de Edward James.'], highlight: true },
                { cells: ['Ciudad Valles', '≈ 1 h 45 min (140 km)', 'Tamul, Micos y rafting. Es la ciudad más grande: hospitales, bancos y cadenas de restaurantes.'] },
                { cells: ['Aquismón', '≈ 1 h 15 min', 'Sótano de las Golondrinas y el embarcadero desde donde sale el tour a Tamul.'] },
                { cells: ['Tamasopo', '≈ 2 h', 'Cascadas de Tamasopo y Puente de Dios, que queda a 10 minutos del pueblo.'] },
              ]}
            />

            <p>
              La conclusión práctica: <strong>si Las Pozas está en tu lista, duerme en Xilitla al
              menos una noche.</strong> Es el único punto desde el que llegas caminando, y entrar
              temprano —antes de que lleguen los autobuses de turistas— es la diferencia entre
              recorrer el jardín surrealista con calma o hacer fila entre grupos.
            </p>
          </div>
        </section>

        {/* CRITERIOS */}
        <section className={styles.sectionAlt}>
          <div className={styles.sectionInner}>
            <h2>Los seis criterios que sí importan</h2>
            <p className={styles.lead}>
              Casi todos los hoteles de la zona se ven bien en fotos. Estos son los puntos donde
              realmente se separan unos de otros.
            </p>
            <div className={styles.cards}>
              {CRITERIOS.map(c => (
                <div key={c.title} className={styles.card}>
                  <span className={styles.cardIcon}>{c.icon}</span>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* POR QUÉ NOSOTROS — con datos, no adjetivos */}
        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <h2>Dónde encaja Paraíso Encantado</h2>
            <p className={styles.lead}>
              Para no marearte con adjetivos, aquí va lo verificable — incluido lo que no tenemos.
            </p>

            <CompareTable
              headers={['Criterio', 'Hotel Paraíso Encantado']}
              rows={[
                { cells: ['Distancia a Las Pozas', `${HOTEL.metrosALasPozas} m — ${HOTEL.minutosCaminandoALasPozas} minutos caminando. El más cercano de Xilitla.`], highlight: true },
                { cells: ['Calificación', `${HOTEL.rating}/5 con ${HOTEL.reviewCount} reseñas verificadas en Google`] },
                { cells: ['Huésped documentado', 'El presidente de México pernoctó aquí en junio de 2023, durante su gira por la Huasteca (cobertura de Pulso SLP y Debate).'] },
                { cells: ['Habitaciones', `${HOTEL.suites} suites, desde 2 hasta ${HOTEL.capacidadMaxima} personas`] },
                { cells: ['Piscina spa privada en la suite', `Sí, en ${HOTEL.suitesConSpaPrivado} de las ${HOTEL.suites} suites. Las otras ${HOTEL.suites - HOTEL.suitesConSpaPrivado} tienen acceso a la piscina del hotel.`] },
                { cells: ['Restaurante propio', `Sí — ${HOTEL.restaurante}, cocina huasteca en el hotel`] },
                { cells: ['Tarifa desde', `$${HOTEL.precioDesde.toLocaleString('es-MX')} MXN por noche para 2 personas`] },
                { cells: ['Pago al reservar', HOTEL.anticipo] },
                { cells: ['Cancelación', HOTEL.cancelacion] },
                { cells: ['Check-in / check-out', `${HOTEL.checkIn} / ${HOTEL.checkOut}`] },
              ]}
            />

            <h3>Lo que no somos</h3>
            <p>
              No somos un resort todo incluido ni el hotel más barato de Xilitla, y no todas las
              suites traen spa privado. Si buscas la tarifa más baja de la zona, hay opciones más
              económicas en el centro del pueblo. Lo que sí ofrecemos es la ubicación más cercana a
              Las Pozas y suites en las que la tarde de descanso pasa dentro de tu propia terraza.
            </p>
          </div>
        </section>

        <HuespedDistinguidoSection />

        {/* DISTANCIAS DESDE EL HOTEL */}
        <section className={styles.sectionAlt}>
          <div className={styles.sectionInner}>
            <h2>Qué tienes cerca si duermes aquí</h2>
            <CompareTable
              caption="Tiempos desde el Hotel Paraíso Encantado, en auto salvo donde se indica."
              headers={['Destino', 'Tiempo', 'Nota']}
              rows={DISTANCIAS.map(d => ({ cells: [d.destino, d.tiempo, d.nota] }))}
            />
            <p>
              Los tours a Tamul, Puente de Dios y El Meco salen desde el hotel con guía. Puedes
              verlos en <Link href="/experiencias">experiencias</Link> o pedirlos por{' '}
              <a href={HOTEL.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a> antes
              de llegar: en temporada alta los cupos de Tamul se llenan con días de anticipación.
            </p>
          </div>
        </section>

        <SeoFaq faqs={FAQS} />

        <RelatedLinks links={[
          { href: '/mejor-hotel-xilitla', label: 'Por qué Paraíso Encantado es el mejor hotel de Xilitla' },
          { href: '/hoteles-en-xilitla', label: 'Hoteles en Xilitla: en qué zona conviene dormir' },
          { href: '/donde-hospedarse-huasteca-potosina', label: 'Dónde hospedarse en la Huasteca Potosina' },
          { href: '/que-hacer-huasteca-potosina-3-dias', label: 'Qué hacer en la Huasteca en 3 días' },
          { href: '/hotel-alberca-privada-xilitla', label: 'Hoteles con alberca privada en la habitación' },
          { href: '/hotel-cerca-de-las-pozas', label: 'El hotel más cercano a Las Pozas' },
          { href: '/xilitla', label: 'Guía de Xilitla' },
        ]} />

        <SeoCta
          title="Duerme a cinco minutos"
          titleEm="de Las Pozas"
          body={`${HOTEL.suites} suites en Xilitla, ${HOTEL.suitesConSpaPrivado} con piscina spa privada en la propia terraza. Reserva directa, sin comisiones de intermediarios.`}
          note={`${HOTEL.cancelacion} · Código ${HOTEL.codigoDescuento} para reserva directa.`}
        />
      </main>
    </>
  );
}
