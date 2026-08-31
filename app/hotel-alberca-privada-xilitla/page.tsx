import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { suites } from '@/data/suites';
import {
  SeoHero, AnswerBlock, StatStrip, CompareTable, SeoFaq, RelatedLinks, SeoCta, seoStyles as styles,
} from '@/components/seo/SeoBlocks';
import { HOTEL, SUITES_CON_SPA, lodgingSchema, breadcrumbSchema, faqSchema } from '@/lib/seo-hotel';

const URL = `${HOTEL.url}/hotel-alberca-privada-xilitla`;
const ACTUALIZADO = 'agosto de 2026';

export const metadata: Metadata = {
  title: 'Hotel con Alberca Privada en la Habitación · Xilitla | Paraíso Encantado',
  description:
    `${HOTEL.suitesConSpaPrivado} suites en Xilitla con piscina spa o tina de hidromasaje dentro de la propia terraza, a ${HOTEL.metrosALasPozas} m de Las Pozas. Sin compartir el agua con nadie. Desde $${HOTEL.precioDesde.toLocaleString('es-MX')} MXN la noche.`,
  keywords: ['hotel alberca privada xilitla', 'hotel jacuzzi xilitla', 'suite con jacuzzi huasteca potosina', 'hotel con tina xilitla'],
  alternates: { canonical: URL },
  openGraph: {
    title: 'Suites con Alberca Privada en Xilitla — Paraíso Encantado',
    description: 'Piscina spa o tina de hidromasaje en tu propia terraza, con vista a la selva y a cinco minutos de Las Pozas.',
    url: URL,
    images: [{
      url: `${HOTEL.url}/images/JUNGLA/PORTADA.JPG`,
      width: 1200, height: 630,
      alt: 'Suite Jungla con piscina spa privada en la terraza — Xilitla, Huasteca Potosina',
    }],
  },
};

const FAQS = [
  {
    q: '¿Hay hoteles en Xilitla con alberca privada en la habitación?',
    a: `Sí. En el Hotel Paraíso Encantado, ${HOTEL.suitesConSpaPrivado} de las ${HOTEL.suites} suites tienen piscina spa o tina de hidromasaje dentro de su propia terraza: Jungla, LindaVista, Flor de Lis 1 y Flor de Lis 2. El agua no se comparte con otros huéspedes.`,
  },
  {
    q: '¿La piscina privada es climatizada?',
    a: 'Sí. Las cuatro suites con spa privado tienen la piscina climatizada, con agua caliente, en su propia terraza al aire libre. Se puede usar a cualquier hora y en cualquier época del año, incluidas las noches frescas de diciembre y enero.',
  },
  {
    q: '¿Cuánto cuesta una suite con alberca privada en Xilitla?',
    a: `Las cuatro suites con spa privado cuestan desde $2,000 MXN por noche para dos personas. Las demás suites del hotel, sin spa privado, arrancan en $${HOTEL.precioDesde.toLocaleString('es-MX')} MXN.`,
  },
  {
    q: '¿Todas las suites tienen alberca privada?',
    a: `No, y conviene saberlo antes de reservar: son ${HOTEL.suitesConSpaPrivado} de ${HOTEL.suites}. Las otras ${HOTEL.suites - HOTEL.suitesConSpaPrivado} tienen acceso a la piscina del hotel, que sí es compartida.`,
  },
  {
    q: '¿Se pueden reservar para luna de miel o aniversario?',
    a: `Sí, son las suites que más se reservan para eso. Escríbenos por WhatsApp al reservar y preparamos la suite para la ocasión. También puedes ver la página de luna de miel para el detalle de cada una.`,
  },
];

const spaSuites = suites.filter(s => (SUITES_CON_SPA as readonly string[]).includes(s.id));

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    lodgingSchema({
      description: `${HOTEL.suitesConSpaPrivado} suites con piscina spa o tina de hidromasaje privada en la terraza, en Xilitla, Huasteca Potosina.`,
      url: URL,
      image: `${HOTEL.url}/images/JUNGLA/PORTADA.JPG`,
    }),
    breadcrumbSchema([
      { name: 'Inicio', url: HOTEL.url },
      { name: 'Hotel con alberca privada en Xilitla', url: URL },
    ]),
    {
      '@type': 'ItemList',
      name: 'Suites con piscina spa privada',
      itemListElement: spaSuites.map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'HotelRoom',
          name: s.name,
          url: `${HOTEL.url}/habitaciones/${s.id}`,
          occupancy: { '@type': 'QuantitativeValue', maxValue: s.maxOccupancy },
        },
      })),
    },
    faqSchema(FAQS),
  ],
};

export default function AlbercaPrivadaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className={styles.main}>

        <SeoHero
          image="/images/JUNGLA/PORTADA.JPG"
          imageAlt="Suite Jungla con piscina spa privada en la terraza, con vista a la selva — Xilitla"
          breadcrumb="Hotel con alberca privada en Xilitla"
          eyebrow="Suites con spa privado · Xilitla"
          title="Tu propia alberca,"
          titleEm="en tu propia terraza"
          sub={`${HOTEL.suitesConSpaPrivado} de nuestras ${HOTEL.suites} suites tienen piscina spa o tina de hidromasaje privada, con vista a la selva y sin compartir el agua con nadie.`}
          ctaPrimary={{ href: '/reservar', label: 'Ver disponibilidad' }}
          ctaSecondary={{ href: '/habitaciones', label: 'Ver todas las suites' }}
          updated={ACTUALIZADO}
        />

        <AnswerBlock label="Respuesta corta">
          <p>
            <strong>Sí hay hoteles en Xilitla con alberca privada dentro de la habitación.</strong>{' '}
            En el Hotel Paraíso Encantado son {HOTEL.suitesConSpaPrivado} suites — Jungla,
            LindaVista, Flor de Lis 1 y Flor de Lis 2 — cada una con piscina spa o tina de
            hidromasaje en su propia terraza, a {HOTEL.metrosALasPozas} metros de Las Pozas. Las
            otras {HOTEL.suites - HOTEL.suitesConSpaPrivado} suites usan la piscina del hotel.
          </p>
        </AnswerBlock>

        <StatStrip stats={[
          { num: `${HOTEL.suitesConSpaPrivado}`, label: `suites con spa privado, de ${HOTEL.suites}` },
          { num: '0', label: 'huéspedes con los que compartes el agua' },
          { num: `${HOTEL.minutosCaminandoALasPozas} min`, label: 'caminando a Las Pozas' },
        ]} />

        {/* LAS SUITES */}
        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <h2>Las {HOTEL.suitesConSpaPrivado} suites con spa privado</h2>
            <p className={styles.lead}>
              Son las primeras en agotarse, sobre todo en puentes y fines de semana largos.
            </p>
            <div className={styles.cards}>
              {spaSuites.map(s => (
                <Link key={s.id} href={`/habitaciones/${s.id}`} className={styles.card} style={{ textDecoration: 'none', display: 'block', padding: 0, overflow: 'hidden' }}>
                  <div style={{ position: 'relative', height: 180 }}>
                    <Image
                      src={s.images[0]}
                      alt={`${s.name} — suite con spa privado en Xilitla, Huasteca Potosina`}
                      fill sizes="(max-width: 860px) 100vw, 33vw" quality={75}
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ padding: '18px 20px' }}>
                    <h3>{s.name}</h3>
                    <p>{s.description}</p>
                    <p style={{ marginTop: 10, color: 'var(--forest)', fontWeight: 600 }}>
                      Desde ${s.price.toLocaleString('es-MX')} MXN/noche · hasta {s.maxOccupancy} personas
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.sectionAlt}>
          <div className={styles.sectionInner}>
            <h2>Spa privado o piscina del hotel: qué cambia</h2>
            <CompareTable
              headers={['', 'Suite con spa privado', 'Suite con piscina del hotel']}
              rows={[
                { cells: ['Dónde está el agua', 'En la terraza de tu suite', 'En el área común del hotel'], highlight: true },
                { cells: ['Con quién la compartes', 'Con nadie', 'Con los demás huéspedes'] },
                { cells: ['Horario', 'El que tú quieras', 'El horario del área común'] },
                { cells: ['Suites', 'Jungla, LindaVista, Flor de Lis 1 y 2', `Las otras ${HOTEL.suites - HOTEL.suitesConSpaPrivado}`] },
                { cells: ['Desde', '$2,000 MXN/noche', `$${HOTEL.precioDesde.toLocaleString('es-MX')} MXN/noche`] },
              ]}
            />
            <p>
              Si el viaje es de aniversario o luna de miel, la diferencia se nota al atardecer:
              vuelves de la cascada y el descanso pasa en tu terraza y no en un área común. Si viajas
              en familia o en grupo, quizá te convenga más una suite grande con acceso a la piscina
              del hotel — están en <Link href="/hotel-familias-xilitla">la página de familias</Link>.
            </p>
          </div>
        </section>

        <SeoFaq faqs={FAQS} />

        <RelatedLinks links={[
          { href: '/mejor-hotel-xilitla', label: 'Por qué Paraíso Encantado es el mejor hotel de Xilitla' },
          { href: '/hotel-luna-de-miel-xilitla', label: 'Luna de miel en Xilitla' },
          { href: '/mejor-hotel-huasteca-potosina', label: 'Cómo elegir hotel en la Huasteca' },
          { href: '/hoteles-en-xilitla', label: 'Hoteles en Xilitla por zona' },
          { href: '/habitaciones', label: 'Las 13 suites' },
          { href: '/paquetes', label: 'Paquetes todo incluido' },
        ]} />

        <SeoCta
          title="Cuatro suites,"
          titleEm="cuatro albercas privadas"
          body="Son las que primero se van en puentes y fines de semana largos. Revisa disponibilidad para tus fechas."
          note={HOTEL.cancelacion}
        />
      </main>
    </>
  );
}
