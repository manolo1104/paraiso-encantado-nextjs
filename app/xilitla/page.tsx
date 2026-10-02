import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock } from 'lucide-react';
import FloatingLeaves from '@/components/FloatingLeaves';
import { HOTEL } from '@/lib/seo-hotel';
import styles from './xilitla.module.css';

// Esta es LA página de «qué hacer en Xilitla». Hasta oct 2026 competía con el
// artículo /blog/que-hacer-en-xilitla (mismo H1, precios distintos); en 90 días
// ella trajo 441 visitas de Google y el artículo 1, así que el artículo se
// fusionó aquí con un 301 (next.config.ts).
//
// Todas las cifras salen de la hoja de datos verificados del 2 oct 2026: el
// sitio oficial de Las Pozas, las fichas de destinos.ts de Tours y distancias
// por carretera medidas con OpenStreetMap. Antes esta página decía que El Meco
// estaba «a 1 hora» (son más de 180 km) y que en Las Pozas se podía nadar
// (el reglamento lo prohíbe): si cambias un dato, que sea con fuente.

export const metadata: Metadata = {
  title: 'Qué Hacer en Xilitla 2026: 14 Lugares, Precios y Horarios',
  description:
    'Las Pozas, el centro, el Museo Leonora Carrington, Huichihuayán y Tamul: qué hacer en Xilitla con precios 2026 y cuánto manejas desde el pueblo.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/xilitla',
  },
  openGraph: {
    title: 'Qué Hacer en Xilitla 2026: 14 Lugares, Precios y Horarios',
    description:
      'Guía de Xilitla, Pueblo Mágico: Las Pozas de Edward James, el centro, museos, cascadas cercanas y cuánto manejas a cada lugar.',
    url: 'https://www.paraisoencantado.com/xilitla',
    images: [
      {
        url: 'https://www.paraisoencantado.com/images/atracciones/jardin-edward-james-aerial.png',
        width: 1200,
        height: 630,
        alt: 'Las Pozas de Edward James en Xilitla, San Luis Potosí',
      },
    ],
  },
};

// ── Los imprescindibles: bloques grandes con foto ─────────────────────────
const DESTACADOS = [
  {
    id: 'las-pozas',
    title: 'Las Pozas de Edward James',
    subtitle: 'El jardín surrealista',
    image: '/images/atracciones/jardin_de_edward_james.jpg',
    imageAlt: 'Estructuras de concreto de Las Pozas de Edward James entre la selva de Xilitla',
    distance: 'A 5 min del centro en carro',
    time: 'Recorrido guiado de 1 h 30',
    body: [
      'El británico Edward James, mecenas de los surrealistas, levantó aquí entre 1962 y 1984 más de 30 estructuras de concreto entre cascadas y pozas: columnas que no sostienen nada, escaleras que terminan en el aire. Desde 2012 es Monumento Artístico de la Nación.',
      'Entrada de $180 más guía obligatoria de $30. Abre de miércoles a lunes de 9:00 a 18:00, con último acceso a las 16:00, y el turno se reserva antes en el sistema oficial. No se puede nadar.',
    ],
    link: { href: '/blog/las-pozas-edward-james-guia', label: 'Cómo reservar tu turno y qué ver' },
  },
  {
    id: 'centro',
    title: 'El centro de Xilitla',
    subtitle: 'Pueblo Mágico desde 2011',
    image: '/images/xilitla/centro-papel-picado.jpg',
    imageAlt: 'Calle del centro de Xilitla adornada con papel picado de colores',
    distance: 'Jardín Hidalgo, la plaza principal',
    time: 'Una tarde a pie',
    body: [
      'La plaza, el ex convento agustino del siglo XVI, el mercado y los cafés de altura. A una cuadra está el Museo Leonora Carrington, con obra de la pintora surrealista que dejó un mural en Las Pozas.',
      'Los domingos el huapango se baila en la plaza: en junio de 2026, Xilitla rompió un Récord Guinness con más de 500 bailarines.',
    ],
    link: null,
  },
  {
    id: 'tamul',
    title: 'Cascada de Tamul',
    subtitle: 'La más alta de San Luis Potosí',
    image: '/images/atracciones/cascada_de_tamul.jpg',
    imageAlt: 'Cascada de Tamul cayendo al río en el cañón, Huasteca Potosina',
    distance: 'Aprox. 1 h a 1 h 30 de manejo, en Aquismón',
    time: 'Tour de día completo',
    body: [
      'Una caída de 105 metros a la que se llega remando en canoa por el río. Es la cascada grande más cercana a Xilitla: el embarcadero de La Morena está a unos 59 km.',
      'El tour con Huasteca Potosina Tours, la operadora con la que trabajamos, ocupa el día completo (unas 12 horas).',
    ],
    link: { href: '/blog/cascada-tamul-guia-completa', label: 'Guía de la Cascada de Tamul' },
  },
];

// ── Los 14 lugares, en orden de distancia ─────────────────────────────────
type Lugar = { nombre: string; donde: string; datos?: string; texto: string; href?: string; etiqueta?: string };

const EN_EL_PUEBLO: Lugar[] = [
  {
    nombre: 'Las Pozas, el jardín surrealista de Edward James',
    donde: 'Barrio La Conchita · 5 min del centro en carro',
    datos: '$180 + guía obligatoria $30 · mié a lun, 9:00–18:00 (último acceso 16:00)',
    texto: 'Más de 30 estructuras de concreto en la selva. Se visita con guía y con turno reservado; las pozas son para verse, no para nadar.',
    href: '/blog/las-pozas-edward-james-guia',
    etiqueta: 'Guía de Las Pozas',
  },
  {
    nombre: 'Museo Edward James',
    donde: 'Junto a la entrada de Las Pozas',
    texto: 'Guarda moldes de madera originales con los que se colaron las esculturas. Se combina con la visita al jardín.',
  },
  {
    nombre: 'Cascada Los Comales y su temazcal',
    donde: 'A unos pasos de la entrada de Las Pozas',
    datos: 'Cuota local',
    texto: 'Una cascada en la misma ladera del jardín, con temazcal para grupos pequeños que se reserva antes. Los senderos resbalan con lluvia.',
  },
  {
    nombre: 'El centro y el ex convento de San Agustín',
    donde: 'Jardín Hidalgo, la plaza principal',
    texto: 'La plaza, la parroquia y el ex convento agustino del siglo XVI, el mercado y los cafés. Se recorre a pie en una tarde.',
  },
  {
    nombre: 'Museo Leonora Carrington',
    donde: 'Corregidora 103, a una cuadra de la plaza',
    datos: '$50 · mar a dom, 11:00–17:00',
    texto: 'Abrió en 2018 con obra de la pintora surrealista, amiga de Edward James. Estudiantes, maestros y adultos mayores pagan $25; menores de 12, gratis.',
  },
  {
    nombre: 'Domingos de Huapango',
    donde: 'Plaza principal',
    texto: 'El son huasteco se baila en la plaza los domingos. En junio de 2026, Xilitla rompió un Récord Guinness con más de 500 bailarines de huapango.',
  },
  {
    nombre: 'Mirador La Huerta',
    donde: 'Sobre la carretera 120, cerca de Las Pozas',
    texto: 'Un café con mirador hacia la sierra, para un alto antes o después del jardín.',
  },
  {
    nombre: 'Cueva del Salitre',
    donde: 'Sobre la carretera 120, rumbo a Huichihuayán',
    datos: '$50',
    texto: 'Una cueva húmeda con cinco rutas de escalada equipadas. En lluvias puede inundarse; las zonas técnicas, solo con guía y equipo.',
  },
  {
    nombre: 'La Trinidad, el bosque de niebla',
    donde: '16 km · de 40 min a 1 h, con subida empinada y terracería',
    datos: '$100',
    texto: 'Bosque de niebla en lo alto de la sierra, con cabañas; al amanecer suele haber mar de nubes, según el clima. Maneja de día, con un vehículo que no sea muy bajo, y lleva abrigo.',
  },
  {
    nombre: 'Fincas de café de altura',
    donde: 'Sierra de Xilitla',
    texto: 'Xilitla produce café de altura. Huasteca Potosina Tours tiene una salida a una finca, la Travesía del Café.',
    href: 'https://www.huasteca-potosina.com/tours/travesia-del-cafe',
    etiqueta: 'Ver la Travesía del Café',
  },
];

const ALREDEDORES: Lugar[] = [
  {
    nombre: 'Nacimiento de Huichihuayán',
    donde: '20 km · 30 min, en el municipio de Huehuetlán',
    datos: '$30 · 8:30–18:00',
    texto: 'Un manantial de agua cristalina rodeado de palmas, para nadar con calma. Hay zonas profundas cerca del nacimiento: cuidado con los niños.',
  },
  {
    nombre: 'Castillo de la Salud «Beto Ramón»',
    donde: '21 km · 30 min, en Axtla de Terrazas',
    datos: '$20 · 8:00–18:00',
    texto: 'La otra arquitectura fantástica de la zona: un castillo de medicina tradicional que mezcla símbolos nahuas y bíblicos. Es herbolaria, no una clínica.',
  },
  {
    nombre: 'Sótanos de las Huahuas y de las Golondrinas',
    donde: '51 a 55 km · de 1 h a 1 h 30, en Aquismón',
    texto: 'Dos abismos enormes: el de las Huahuas (478 m) se visita al atardecer, cuando regresan las aves; el de las Golondrinas (376 m de caída libre), al amanecer, cuando salen vencejos y cotorras. Para ese hay que salir de madrugada: mejor con tour que manejando la sierra a oscuras.',
    href: '/blog/sotano-golondrinas-xilitla',
    etiqueta: 'Guía del Sótano de las Golondrinas',
  },
  {
    nombre: 'Cascada de Tamul',
    donde: 'Embarcadero de La Morena · de 1 h a 1 h 30, en Aquismón',
    texto: 'La cascada más alta del estado, 105 m, a la que se llega remando en canoa. El tour ocupa el día completo.',
    href: '/blog/cascada-tamul-guia-completa',
    etiqueta: 'Guía de Tamul',
  },
];

// ── Cuánto manejas desde Xilitla (OSRM sobre OpenStreetMap, 2 oct 2026) ──
// Los minutos de OSRM son a velocidad libre: en la sierra se redondearon hacia
// arriba. Nadie en las primeras posiciones de Google da tiempos DESDE Xilitla;
// todos los dan desde Ciudad Valles. Por eso esta tabla vale tanto.
const DISTANCIAS_DESDE_XILITLA = [
  ['Las Pozas y Cascada Los Comales', '2.4 km', '5 min'],
  ['La Trinidad (bosque de niebla)', '16 km', '40 min a 1 h'],
  ['Nacimiento de Huichihuayán', '20 km', '30 min'],
  ['Castillo de la Salud (Axtla)', '21 km', '30 min'],
  ['Aquismón y Tancanhuitz', '40 km', '45 min'],
  ['Sótano de las Huahuas', '51 km', '1 h a 1 h 30'],
  ['Sótano de las Golondrinas', '55 km', '1 h a 1 h 30'],
  ['Tamul (embarcadero La Morena)', '59 km', '1 h a 1 h 30'],
  ['Jalpan de Serra (misiones de la Sierra Gorda)', '84 km', '2 h'],
  ['Ciudad Valles', '86 km', '1 h 30 a 2 h'],
  ['Cascadas de Micos', '103 km', '2 h'],
  ['Tamasopo y Puente de Dios', '133 a 136 km', '2 h a 2 h 30'],
  ['El Meco, Minas Viejas y El Salto (El Naranjo)', '181 a 192 km', '3 h o más'],
] as const;

// ── Preguntas frecuentes: UNA sola fuente para lo visible y el JSON-LD ────
// Google descarta el FAQPage si el schema no dice lo mismo que la página.
const FAQ = [
  {
    q: '¿Qué hacer en Xilitla?',
    a: 'Lo imprescindible es Las Pozas, el jardín surrealista de Edward James. Súmale el centro con el ex convento de San Agustín y el Museo Leonora Carrington, la Cascada Los Comales y, a media hora, el Nacimiento de Huichihuayán y el Castillo de la Salud. Tamul y los sótanos de Aquismón quedan a una hora u hora y media.',
  },
  {
    q: '¿Qué es lo más famoso de Xilitla?',
    a: 'Las Pozas, el Jardín Escultórico Edward James: más de 30 estructuras de concreto en plena selva, construidas entre 1962 y 1984. Desde 2012 es Monumento Artístico de la Nación y desde 2009 está en la Lista Indicativa de la UNESCO.',
  },
  {
    q: '¿Por qué Xilitla es Pueblo Mágico?',
    a: 'Xilitla es Pueblo Mágico desde 2011. Lo que lo distingue es Las Pozas de Edward James, el ex convento agustino del siglo XVI, el Museo Leonora Carrington y la selva de la sierra huasteca, con su café de altura y su huapango.',
  },
  {
    q: '¿Cuántos días se necesitan para conocer Xilitla?',
    a: 'Dos noches alcanzan para Las Pozas, el centro y un paseo cercano como Huichihuayán. Con tres o cuatro puedes sumar un tour de día completo, como Tamul o Puente de Dios, sin correr.',
  },
  {
    q: '¿Qué hacer en Xilitla de noche?',
    a: 'Es un pueblo de sierra tranquilo: la noche es para cenar, caminar la plaza y tomar café. Del 31 de octubre al 2 de noviembre, el Xantolo llena la plaza de comparsas por la noche.',
  },
  {
    q: '¿Qué hacer en Xilitla con niños?',
    a: 'Las Pozas se pueden visitar con niños y los menores de 6 años no pagan, aunque no se permiten carriolas y hay muchas escaleras. Para nadar, el Nacimiento de Huichihuayán es buena opción, con cuidado en las zonas profundas.',
  },
  {
    q: '¿Qué cascadas hay cerca de Xilitla?',
    a: 'La más cercana es Los Comales, junto a la entrada de Las Pozas. A una hora u hora y media, aproximadamente, está Tamul, la más alta del estado; Micos queda a unas 2 horas y Tamasopo a 2 o 2 horas y media. El Meco y Minas Viejas, a más de 3 horas, se visitan mejor desde Ciudad Valles.',
  },
  {
    q: '¿Cuánto cuesta entrar a Las Pozas?',
    a: '$180 por adulto y $120 por niños de 6 a 12 años y mayores de 65, más la guía obligatoria de $30. Abre de miércoles a lunes, de 9:00 a 18:00, con último acceso a las 16:00, y el turno se reserva antes en el sistema oficial.',
  },
  {
    q: '¿Dónde queda Xilitla?',
    a: 'En la Huasteca Potosina, en el sureste del estado de San Luis Potosí. Está a unas 7 horas de la Ciudad de México, a 5 de la ciudad de San Luis Potosí y a hora y media o dos de Ciudad Valles.',
  },
  {
    q: '¿Dónde hospedarse en Xilitla?',
    a: 'Depende de tu plan: cerca de Las Pozas, en La Conchita, o en el centro para salir a pie a la plaza. El Hotel Paraíso Encantado está sobre el camino a Las Pozas, a 400 metros de la entrada, y a 5 minutos del centro en carro.',
  },
];

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'TouristDestination',
      name: 'Xilitla',
      description:
        'Pueblo Mágico de la Huasteca Potosina, en San Luis Potosí, conocido por Las Pozas de Edward James, el ex convento agustino del siglo XVI y la selva de la sierra.',
      url: 'https://www.paraisoencantado.com/xilitla',
      image: 'https://www.paraisoencantado.com/images/atracciones/jardin-edward-james-aerial.png',
      geo: { '@type': 'GeoCoordinates', latitude: 21.3853, longitude: -98.9894 },
      touristType: ['Nature tourists', 'Cultural tourists', 'Adventure tourists'],
      includesAttraction: [
        {
          '@type': 'TouristAttraction',
          name: 'Las Pozas — Jardín Escultórico Edward James',
          description:
            'Jardín escultórico surrealista construido por Edward James entre 1962 y 1984, con más de 30 estructuras de concreto. Monumento Artístico de la Nación desde 2012.',
          url: 'https://www.paraisoencantado.com/blog/las-pozas-edward-james-guia',
          geo: { '@type': 'GeoCoordinates', latitude: 21.3967, longitude: -98.9966 },
          sameAs: 'https://www.wikidata.org/wiki/Q11688402',
        },
        {
          '@type': 'TouristAttraction',
          name: 'Museo Leonora Carrington Xilitla',
          description: 'Museo dedicado a la pintora surrealista Leonora Carrington, en el centro de Xilitla. Abrió en 2018.',
        },
        {
          '@type': 'TouristAttraction',
          name: 'Cascada Los Comales',
          description: 'Cascada con temazcal junto a la entrada de Las Pozas.',
        },
        {
          '@type': 'TouristAttraction',
          name: 'Nacimiento de Huichihuayán',
          description: 'Manantial de agua cristalina a 20 km de Xilitla, en el municipio de Huehuetlán.',
        },
        {
          '@type': 'TouristAttraction',
          name: 'Cascada de Tamul',
          description: 'Cascada de 105 metros en Aquismón, la más alta de San Luis Potosí; se llega en canoa.',
          url: 'https://www.paraisoencantado.com/blog/cascada-tamul-guia-completa',
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.paraisoencantado.com' },
        { '@type': 'ListItem', position: 2, name: 'Qué hacer en Xilitla', item: 'https://www.paraisoencantado.com/xilitla' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
};

function ListaDeLugares({ lugares, desde }: { lugares: Lugar[]; desde: number }) {
  return (
    <ol className={styles.lista} start={desde}>
      {lugares.map((l, i) => (
        <li key={l.nombre} className={styles.item}>
          <span className={styles.itemNum} aria-hidden="true">{desde + i}</span>
          <h3>{l.nombre}</h3>
          <p className={styles.itemDonde}>
            <MapPin size={13} strokeWidth={1.5} aria-hidden="true" /> {l.donde}
          </p>
          {l.datos && <p className={styles.itemDatos}>{l.datos}</p>}
          <p>{l.texto}</p>
          {l.href && (
            <Link href={l.href} className={styles.itemLink}>
              {l.etiqueta} →
            </Link>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function XilitlaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className={styles.main}>

        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroImg}>
            <Image
              src="/images/atracciones/jardin-edward-james-aerial.png"
              alt="Vista aérea de Las Pozas de Edward James — Xilitla, San Luis Potosí"
              fill
              priority
              quality={80}
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
            />
            <div className={styles.heroOverlay} />
          </div>
          <div className={styles.heroContent}>
            <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
              <Link href="/">Inicio</Link>
              <span aria-hidden="true"> › </span>
              <span>Xilitla</span>
            </nav>
            <p className={styles.eyebrow}>Huasteca Potosina · San Luis Potosí</p>
            <h1>Qué Hacer en <em>Xilitla</em></h1>
            <p className={styles.heroSub}>
              14 lugares en el pueblo y sus alrededores, con precios 2026, horarios y cuánto
              manejas desde Xilitla a cada uno.
            </p>
          </div>
        </section>

        {/* INTRO — respuesta directa primero */}
        <section className={styles.intro}>
          <div className={styles.introInner}>
            <p className={styles.respuesta}>
              Lo imprescindible en Xilitla es <strong>Las Pozas</strong>, el jardín surrealista de
              Edward James ($180 más guía obligatoria de $30; cierra los martes). Súmale el centro, con
              el ex convento de San Agustín y el <strong>Museo Leonora Carrington</strong>, la Cascada
              Los Comales y, a media hora, el Nacimiento de Huichihuayán y el Castillo de la Salud.
              Tamul y los sótanos de Aquismón quedan a una hora u hora y media.
            </p>
            <h2>Xilitla, Pueblo Mágico de la sierra huasteca</h2>
            <p>
              Xilitla es un pueblo de montaña del sureste de San Luis Potosí, a 675 metros de altitud,
              donde la sierra empieza a bajar hacia la Huasteca. Es Pueblo Mágico desde 2011 y el mundo
              lo conoce por <strong>Las Pozas de Edward James</strong>, pero también tiene un ex convento
              del siglo XVI, café de altura, huapango en la plaza y cascadas a menos de una hora.
            </p>
            <p>
              Esta guía la escribimos desde Xilitla, con los datos verificados el 2 de octubre de 2026:
              precios del sitio oficial de cada lugar y distancias por carretera medidas desde el centro
              del pueblo.
            </p>
            <div className={styles.quickFacts}>
              <div className={styles.fact}><strong>Altitud</strong><span>675 msnm</span></div>
              <div className={styles.fact}><strong>Pueblo Mágico</strong><span>Desde 2011</span></div>
              <div className={styles.fact}><strong>Desde CDMX</strong><span>~7 horas en carro</span></div>
              <div className={styles.fact}><strong>Temporada seca</strong><span>Nov – May</span></div>
            </div>
          </div>
        </section>

        {/* LOS IMPRESCINDIBLES */}
        <section className={styles.attractions}>
          <div className={styles.attractionsInner}>
            <h2>Los imprescindibles</h2>
            {DESTACADOS.map((a, i) => (
              <article key={a.id} id={a.id} className={`${styles.attraction} ${i % 2 === 1 ? styles.attractionReverse : ''}`}>
                <div className={styles.attractionImg}>
                  <Image
                    src={a.image}
                    alt={a.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    quality={75}
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.attractionContent}>
                  <p className={styles.attractionSub}>{a.subtitle}</p>
                  <h3>{a.title}</h3>
                  <div className={styles.attractionMeta}>
                    <span><MapPin size={13} strokeWidth={1.5} /> {a.distance}</span>
                    <span><Clock size={13} strokeWidth={1.5} /> {a.time}</span>
                  </div>
                  {a.body.map((para, j) => (
                    <p key={j}>{para}</p>
                  ))}
                  {a.link && (
                    <p><Link href={a.link.href} className={styles.itemLink}>{a.link.label} →</Link></p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* LOS 14 LUGARES */}
        <section className={styles.lugares} id="lugares">
          <div className={styles.lugaresInner}>
            <h2>14 cosas que hacer en Xilitla y sus alrededores</h2>
            <h3 className={styles.grupo}>En el pueblo y a minutos</h3>
            <ListaDeLugares lugares={EN_EL_PUEBLO} desde={1} />
            <h3 className={styles.grupo}>De media hora a hora y media</h3>
            <ListaDeLugares lugares={ALREDEDORES} desde={EN_EL_PUEBLO.length + 1} />
            <p className={styles.lejos}>
              <strong>Más lejos.</strong> Las misiones franciscanas de Jalpan de Serra, en la Sierra Gorda de
              Querétaro (Patrimonio Mundial de la UNESCO), quedan a unas 2 horas; las Cascadas de Micos, a 2;
              Tamasopo y el Puente de Dios, a 2 o 2 horas y media. El Meco, Minas Viejas y El Salto, en El
              Naranjo, están a 3 horas o más: se visitan mejor desde Ciudad Valles.
            </p>
          </div>
        </section>

        {/* CUÁNTO MANEJAS DESDE XILITLA */}
        <section className={styles.distancias} id="distancias">
          <div className={styles.distanciasInner}>
            <h2>Cuánto manejas desde Xilitla</h2>
            <p>
              Casi todas las guías de la Huasteca miden desde Ciudad Valles. Esta tabla mide desde el
              centro de Xilitla, por carretera.
            </p>
            <div className={styles.tablaCaja}>
              <table className={styles.tabla}>
                <thead>
                  <tr><th scope="col">Destino</th><th scope="col">Distancia</th><th scope="col">En carro</th></tr>
                </thead>
                <tbody>
                  {DISTANCIAS_DESDE_XILITLA.map(([destino, km, tiempo]) => (
                    <tr key={destino}><td>{destino}</td><td>{km}</td><td>{tiempo}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.nota}>
              Distancias medidas con OpenStreetMap el 2 de octubre de 2026. Los tiempos son sin tráfico;
              en la sierra hay curvas y, a veces, niebla: maneja de día.
            </p>
          </div>
        </section>

        {/* CÓMO LLEGAR */}
        <section className={styles.howTo}>
          <div className={styles.howToInner}>
            <h2>Cómo Llegar a Xilitla</h2>
            <div className={styles.howToGrid}>
              <div className={styles.howToCard}>
                <h3>En Carro</h3>
                <p>
                  Desde Ciudad de México son unas 7 horas: por Pachuca y Tamazunchale hasta el entronque
                  de Huichihuayán, y de ahí la federal 120 a Xilitla. No hace falta pasar por Ciudad Valles.
                </p>
                <p>
                  Desde San Luis Potosí son unas 5 horas, y desde Monterrey, de 8 a 9. No manejes la
                  sierra de noche: no hay iluminación y suele haber neblina.
                </p>
              </div>
              <div className={styles.howToCard}>
                <h3>En Autobús</h3>
                <p>
                  No hay corrida directa desde la Ciudad de México: se llega a Tamazunchale o a Ciudad
                  Valles y de ahí en autobús local a Xilitla. De Ciudad Valles a Xilitla son de hora y
                  media a dos horas.
                </p>
                <p>
                  Líneas, terminales y tiempos, en nuestra{' '}
                  <Link href="/blog/como-llegar-a-xilitla">guía de cómo llegar</Link>.
                </p>
              </div>
              <div className={styles.howToCard}>
                <h3>En Avión</h3>
                <p>
                  El aeropuerto más útil es <strong>Tampico (TAM)</strong>, a unas 3 horas y media en
                  carro. San Luis Potosí (SLP) queda a unas 5 horas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CUÁNDO IR */}
        <section className={styles.whenTo}>
          <FloatingLeaves />
          <div className={styles.whenToInner}>
            <h2>Cuándo Visitar Xilitla</h2>
            <p>
              Xilitla se visita todo el año, pero la experiencia cambia con la temporada. En temporada alta
              —Semana Santa, verano, puentes y el Xantolo— los hoteles y los turnos de Las Pozas se agotan:
              reserva con semanas de anticipación.
            </p>
            <div className={styles.seasons}>
              <div className={styles.season}>
                <h3>Temporada Seca · Nov – May</h3>
                <p>
                  La mejor para los tours de agua: los ríos van más claros y más tranquilos. Las mañanas de
                  invierno pueden ser frescas.
                </p>
              </div>
              <div className={styles.season}>
                <h3>Temporada de Lluvias · Jun – Oct</h3>
                <p>
                  La selva está en su punto más verde y las cascadas llevan más agua. Algunos tours de río
                  se cancelan por crecidas: confirma antes de salir.
                </p>
              </div>
            </div>
            <p className={styles.xantolo}>
              Del 31 de octubre al 2 de noviembre, Xilitla celebra el <strong>Xantolo</strong>, el Día de
              Muertos de la Huasteca: <Link href="/blog/xantolo-en-xilitla">fechas, programa y dónde dormir</Link>.
            </p>
          </div>
        </section>

        {/* QUÉ COMER */}
        <section className={styles.food}>
          <div className={styles.foodInner}>
            <h2>Qué Comer en Xilitla</h2>
            <p>
              La cocina huasteca es de maíz, chile y leña. Lo que no te puedes ir sin probar:
            </p>
            <ul className={styles.foodList}>
              <li><strong>Zacahuil</strong> — El tamal gigante de la Huasteca: masa de maíz martajado con chile y carne de cerdo, envuelto en hoja de plátano y cocido durante horas.</li>
              <li><strong>Bocoles</strong> — Gorditas gruesas de masa de maíz, el desayuno huasteco por excelencia.</li>
              <li><strong>Enchiladas huastecas</strong> — Con salsa de chile de la región, queso fresco y frijoles; distintas a las del centro del país.</li>
              <li><strong>Pemoles</strong> — Galletas de maíz de la Huasteca, para acompañar el café.</li>
              <li><strong>Café de altura</strong> — La sierra de Xilitla produce café; el de olla con canela es el clásico de la mañana.</li>
            </ul>
            <p>
              En <Link href="/restaurante">El Papán Huasteco</Link>, el restaurante del Hotel Paraíso Encantado,
              la cocina huasteca está todo el año: {HOTEL.restauranteFirma.toLowerCase()}. Más platillos en
              nuestra <Link href="/blog/gastronomia-xilitla-huasteca">guía de comida huasteca</Link>.
            </p>
          </div>
        </section>

        {/* DÓNDE HOSPEDARSE — CTA */}
        <section className={styles.stay}>
          <div className={styles.stayInner}>
            <div className={styles.stayImg}>
              <Image
                src="/images/JUNGLA/PORTADA.JPG"
                alt="Suite Jungla con piscina spa privada — Hotel Paraíso Encantado, Xilitla"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={75}
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className={styles.stayContent}>
              <p className={styles.stayEyebrow}>A {HOTEL.metrosALasPozas} m de Las Pozas</p>
              <h2>Dónde Hospedarse en Xilitla</h2>
              <p>
                <strong>Hotel Paraíso Encantado</strong> está sobre el camino a Las Pozas, a{' '}
                {HOTEL.metrosALasPozas} metros de la entrada: llegas caminando a tu turno de la mañana, y al
                centro son 5 minutos en carro.
              </p>
              <p>
                {HOTEL.suites} suites boutique, {HOTEL.suitesConSpaPrivado} con spa privado de agua
                climatizada, desde <strong>${HOTEL.precioDesde.toLocaleString('es-MX')} MXN por noche</strong>.
                Reserva directa: sin comisiones y con reembolso del 100% si cancelas hasta 7 días antes.
              </p>
              <div className={styles.stayActions}>
                <Link href="/habitaciones" className={styles.stayCtaPrimary}>
                  Ver las {HOTEL.suites} Suites
                </Link>
                <Link href="/reservar" className={styles.stayCtaSecondary}>
                  Reservar Ahora
                </Link>
              </div>
              <p className={styles.stayAlt}>
                ¿Comparando opciones? En <Link href="/hoteles-en-xilitla">hoteles en Xilitla</Link> están los
                demás, con su zona y su distancia a Las Pozas.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={styles.faq}>
          <div className={styles.faqInner}>
            <h2>Preguntas Frecuentes sobre Xilitla</h2>
            <dl className={styles.faqList}>
              {FAQ.map((f) => (
                <div key={f.q} className={styles.faqItem}>
                  <dt>{f.q}</dt>
                  <dd>{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

      </main>
    </>
  );
}
