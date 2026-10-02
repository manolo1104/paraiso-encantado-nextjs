import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getAllSlugs, getAllPosts, getPost } from '@/lib/blog';
import TablaDeslizable from '@/components/TablaDeslizable';
import styles from './article.module.css';

// Sin remark-gfm, MDX no reconoce las tablas de Markdown: hasta oct 2026 las 8
// tablas del blog (precios de Las Pozas, tiempos de carretera…) se publicaban
// como un párrafo con las rayas «|» a la vista. Las tablas son justo lo que
// citan los buscadores con IA, así que perderlas costaba doble.
const MDX_OPTIONS = { mdxOptions: { remarkPlugins: [remarkGfm] } };

function slugify(text: string): string {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

interface Heading { level: number; text: string; id: string; }

// El bloque de preguntas frecuentes siempre se titula así en los .mdx; es el ancla
// que usan tanto el índice como el JSON-LD de FAQPage.
const FAQ_HEADING = /^preguntas frecuentes$/i;

function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const regex = /^(#{2,3})\s+(.+)$/gm;
  let match;
  let enFaq = false;
  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/[*_`]/g, '').trim();
    if (level === 2) enFaq = FAQ_HEADING.test(text);
    // Las preguntas son h3 y ocupan una línea entera cada una: si entraran al índice,
    // taparían la estructura del artículo. El índice lista el bloque, no cada pregunta.
    if (enFaq && level === 3) continue;
    headings.push({ level, text, id: slugify(text) });
  }
  return headings;
}

interface FaqItem { question: string; answer: string; }

function stripMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // de un enlace sólo sobrevive el texto
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Las preguntas se leen del propio MDX en lugar de declararlas aparte en el frontmatter
// porque Google descarta el FAQPage cuando el schema no dice literalmente lo mismo que
// ve el visitante. Con una sola fuente no hay forma de que los dos textos se separen.
function extractFaq(content: string): FaqItem[] {
  const lines = content.split('\n');
  const inicio = lines.findIndex((l) => {
    const m = l.trim().match(/^##\s+(.+)$/);
    return m !== null && FAQ_HEADING.test(m[1].trim());
  });
  if (inicio === -1) return [];

  const faq: FaqItem[] = [];
  let pregunta = '';
  let respuesta: string[] = [];

  const cerrarPregunta = () => {
    const texto = stripMarkdown(respuesta.join(' '));
    if (pregunta && texto) faq.push({ question: pregunta, answer: texto });
    pregunta = '';
    respuesta = [];
  };

  for (let i = inicio + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s/.test(line)) break; // empezó otra sección: el bloque de FAQ terminó
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      cerrarPregunta();
      pregunta = stripMarkdown(h3[1]);
      continue;
    }
    if (pregunta && line.trim()) respuesta.push(line.trim());
  }
  cerrarPregunta();

  return faq;
}

const mdxComponents = {
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 id={slugify(String(children))} {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 id={slugify(String(children))} {...props}>{children}</h3>
  ),
  // El contenedor es para el aviso «Desliza la tabla» del celular (ver article.module.css).
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <TablaDeslizable className={styles.tabla}><table {...props} /></TablaDeslizable>
  ),
};

const AUTHORS: Record<string, { name: string; role: string; bio: string; color: string; initial: string; sameAs: string }> = {
  'Hotel Paraíso Encantado': {
    name: 'Manolo Covarrubias',
    role: 'Fundador · Hotel Paraíso Encantado',
    bio: 'Nació en la Huasteca Potosina y decidió que el turismo debía enriquecer al territorio. Fundó Paraíso Encantado en 2018 y lleva años explorando cada rincón de Xilitla y la sierra potosina.',
    color: '#1a2e1a',
    initial: 'M',
    sameAs: 'https://www.paraisoencantado.com/sobre-nosotros',
  },
};

// HowTo JSON-LD por artículo: solo para guías con pasos de ruta visibles y reales.
// El texto refleja los pasos numerados que aparecen en el cuerpo del artículo.
const HOWTO_SCHEMAS: Record<string, object> = {
  'como-llegar-a-xilitla': {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Cómo Llegar a la Huasteca Potosina y a Xilitla desde Ciudad de México en Carro',
    description: 'Ruta en carro desde CDMX a Xilitla, San Luis Potosí: de 6 a 7 horas aproximadas por Pachuca, Huejutla y Tamazunchale.',
    totalTime: 'PT6H30M',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'MXN', value: '500' },
    tool: [{ '@type': 'HowToTool', name: 'GPS o Google Maps' }],
    step: [
      { '@type': 'HowToStep', position: 1, name: 'Salir por la autopista México-Pachuca (MEX-85D)', text: 'Toma la autopista México-Pachuca hacia el noreste desde CDMX.', url: 'https://www.paraisoencantado.com/blog/como-llegar-a-xilitla#en-carro-la-opcion-mas-flexible' },
      { '@type': 'HowToStep', position: 2, name: 'Pasar Pachuca y seguir a Huejutla y Tamazunchale', text: 'Pachuca en alrededor de 1 hora y Tamazunchale en cerca de 4. Es el tramo largo del viaje.', url: 'https://www.paraisoencantado.com/blog/como-llegar-a-xilitla#desde-ciudad-de-mexico-6-a-7-horas' },
      { '@type': 'HowToStep', position: 3, name: 'Tomar la federal 120 en Huichihuayán', text: 'Poco después de Tamazunchale, en el entronque de Huichihuayán, toma la federal 120. Viniendo del sur no hace falta pasar por Ciudad Valles.', url: 'https://www.paraisoencantado.com/blog/como-llegar-a-xilitla#desde-ciudad-de-mexico-6-a-7-horas' },
      { '@type': 'HowToStep', position: 4, name: 'Subir la sierra hasta Xilitla', text: 'La federal 120 sube la sierra con curvas cerradas y niebla frecuente. Son de 45 minutos a 1 hora más; conviene hacerlo de día.', url: 'https://www.paraisoencantado.com/blog/como-llegar-a-xilitla#ultimos-kilometros-la-carretera-120-y-la-sierra' },
      { '@type': 'HowToStep', position: 5, name: 'Llegar al Hotel Paraíso Encantado en Xilitla', text: 'El hotel está en el barrio de La Conchita, sobre el camino a Las Pozas: a 400 metros de la entrada del jardín y a 5 minutos en carro del centro de Xilitla. Estacionamiento privado incluido.', url: 'https://www.paraisoencantado.com/blog/como-llegar-a-xilitla#al-llegar-donde-esta-el-hotel' },
    ],
  },
  // Oct 2026: se quitaron los HowTo de Puente de Dios y del Sótano de las Golondrinas.
  // Decían «45 a 60 minutos» y «por Ciudad Valles», y el artículo corregido dice 2 a 2.5 h
  // y por Aquismón: un dato estructurado que contradice la página es peor que ninguno.

};

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = getPost(slug);
    return {
      // Sin sufijo de marca a propósito: Google ya muestra el dominio encima
      // del título y repetir «Hotel Paraíso Encantado» gastaba 26 caracteres
      // de los ~60 que caben, cortando justo la parte útil del titular.
      title: post.title,
      description: post.description,
      alternates: {
        canonical: `https://www.paraisoencantado.com/blog/${slug}`,
      },
      openGraph: {
        title: post.title,
        description: post.description,
        url: `https://www.paraisoencantado.com/blog/${slug}`,
        type: 'article',
        publishedTime: post.date,
        modifiedTime: post.dateModified ?? post.date,
        images: [
          {
            url: `https://www.paraisoencantado.com${post.image}`,
            alt: post.imageAlt,
            width: 1200,
            height: 630,
          },
        ],
      },
    };
  } catch {
    return { title: 'Artículo no encontrado' };
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  let post;
  try {
    post = getPost(slug);
  } catch {
    notFound();
  }

  const allPosts = getAllPosts();
  const related = allPosts.filter((p) => p.slug !== slug).slice(0, 3);

  const authorProfile = AUTHORS[post.author] ?? AUTHORS['Hotel Paraíso Encantado'];
  const headings = extractHeadings(post.content);
  const showToc = headings.length >= 4;

  const articleBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.paraisoencantado.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog de Viaje', item: 'https://www.paraisoencantado.com/blog' },
      { '@type': 'ListItem', position: 3, name: post.category, item: 'https://www.paraisoencantado.com/blog' },
      { '@type': 'ListItem', position: 4, name: post.title, item: `https://www.paraisoencantado.com/blog/${slug}` },
    ],
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: {
      '@type': 'ImageObject',
      url: `https://www.paraisoencantado.com${post.image}`,
      description: post.imageAlt,
    },
    datePublished: post.date,
    dateModified: post.dateModified ?? post.date,
    wordCount: post.readTime * 200,
    inLanguage: 'es-MX',
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.article-description', '.article-intro'],
    },
    author: {
      '@type': 'Person',
      name: authorProfile.name,
      jobTitle: authorProfile.role,
      url: authorProfile.sameAs,
      worksFor: {
        '@type': 'Hotel',
        name: 'Hotel Paraíso Encantado',
        url: 'https://www.paraisoencantado.com',
      },
    },
    publisher: {
      '@type': 'Organization',
      name: 'Hotel Paraíso Encantado',
      url: 'https://www.paraisoencantado.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.paraisoencantado.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.paraisoencantado.com/blog/${slug}`,
    },
  };

  const howToSchema = HOWTO_SCHEMAS[slug] ?? null;

  const faqItems = extractFaq(post.content);
  // Con una sola pregunta el FAQPage no aporta nada y Google suele ignorarlo; si el
  // artículo todavía no tiene su bloque de preguntas, no se emite schema vacío.
  const faqSchema =
    faqItems.length >= 2
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          inLanguage: 'es-MX',
          mainEntity: faqItems.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        }
      : null;

  const INTERNAL_LINKS: Record<string, { text: string; links: { href: string; label: string; desc: string }[] }> = {
    'como-llegar-a-xilitla': {
      text: 'Ya sabes cómo llegar — ahora elige dónde quedarte:',
      links: [
        { href: '/hoteles-en-xilitla', label: 'Comparar hoteles en Xilitla', desc: 'Zona, precio y distancia a Las Pozas en una tabla' },
        { href: '/habitaciones', label: 'Ver las 13 suites', desc: 'Desde $1,500 MXN/noche · Estacionamiento incluido' },
        { href: '/reservar', label: 'Reservar ahora', desc: 'Confirmación instantánea · Sin comisiones' },
      ],
    },
    'las-pozas-edward-james-guia': {
      text: '¿Planeas visitar Las Pozas? Estamos a 5 min caminando:',
      links: [
        { href: '/hotel-cerca-de-las-pozas', label: 'Hotel a 400 m de Las Pozas', desc: 'Sobre el mismo camino · 5 min caminando' },
        { href: '/xilitla', label: 'Qué hacer en Xilitla', desc: '14 lugares y cuánto manejas a cada uno' },
        { href: '/reservar', label: 'Reservar suite', desc: 'Llegas a pie a tu turno de la mañana' },
      ],
    },
    // Artículo de temporada (oct 2026): las noches del 30 y 31 de octubre ya
    // estaban llenas al publicarlo, por eso el primer enlace va directo a las
    // fechas que sí tenían cuartos.
    'xantolo-en-xilitla': {
      text: 'Para vivir el Xantolo desde Xilitla:',
      links: [
        { href: '/reservar?checkin=2026-11-01&checkout=2026-11-03&adults=2', label: 'Suites del 1 al 3 de noviembre', desc: 'Disponibilidad real, sin comisiones' },
        { href: '/blog/las-pozas-edward-james-guia', label: 'Las Pozas: reserva tu turno', desc: 'En días de fiesta los turnos se agotan' },
        { href: '/hoteles-en-xilitla', label: 'Otros hoteles en Xilitla', desc: 'Zona, precio y distancia a Las Pozas' },
      ],
    },
    'cascada-tamul-guia-completa': {
      text: '¿Quieres hacer el tour a Tamul desde nuestro hotel?',
      links: [
        { href: '/experiencias', label: 'Tour Expedición Tamul', desc: 'Sótano + Cascada + Cenote · Guía certificado' },
        { href: '/paquetes', label: 'Paquete Aventura Extrema', desc: 'Tamul, rafting y rappel · 4 días / 3 noches' },
        { href: '/reservar', label: 'Reservar tu suite', desc: 'El tour pasa por ti al hotel' },
      ],
    },
    'ruta-maestra-huasteca-potosina': {
      text: 'Empieza tu ruta maestra desde Xilitla:',
      links: [
        { href: '/donde-hospedarse-huasteca-potosina', label: 'Dónde hospedarse en la Huasteca', desc: 'Qué ves desde cada base y cuánto manejas' },
        { href: '/experiencias', label: 'Tours por la Huasteca', desc: 'Tamul, Pozas, Puente de Dios · Guías certificados' },
        { href: '/paquetes', label: 'Paquetes de hotel y tours', desc: 'De 3 a 6 días con tours guiados' },
      ],
    },
    'temporada-lluvias-vs-seca-xilitla': {
      text: 'Ya sabes cuándo ir — ahora asegura tu lugar:',
      links: [
        { href: '/reservar', label: 'Verificar disponibilidad', desc: 'Temporada alta · Reserva con anticipación' },
        { href: '/paquetes', label: 'Paquetes de hotel y tours', desc: 'De 3 a 6 días · Consulta disponibilidad' },
        { href: '/habitaciones', label: 'Ver suites disponibles', desc: '13 opciones · Desde $1,500 MXN/noche' },
      ],
    },
    'mejor-epoca-visitar-xilitla': {
      text: 'Ya tienes el mes — ahora aparta las fechas:',
      links: [
        { href: '/reservar', label: 'Verificar disponibilidad', desc: 'Elige fechas y ve el precio al instante' },
        { href: '/habitaciones', label: 'Ver las 13 suites', desc: '4 con spa privado · Desde $1,500 MXN/noche' },
        { href: '/paquetes', label: 'Paquetes de hotel y tours', desc: 'De 3 a 6 días con tours guiados' },
      ],
    },
    'xilitla-con-ninos': {
      text: 'Viajar con niños se planea distinto — empieza por aquí:',
      links: [
        { href: '/hotel-familias-xilitla', label: 'Hotel para familias en Xilitla', desc: 'Suites de 4 a 8 personas · Piscina' },
        { href: '/habitaciones', label: 'Ver las suites familiares', desc: 'Helechos 1 y 2 · Hasta 8 personas' },
        { href: '/paquetes', label: 'Paquete Familiar', desc: 'Hotel y tours aptos para niños · 3 a 6 días' },
      ],
    },
    'comparativa-cascadas-huasteca': {
      text: 'Ya elegiste cascada — así se hace el tour:',
      links: [
        { href: '/experiencias', label: 'Tours por la Huasteca', desc: 'Tamul, Tamasopo y Micos · Guías certificados' },
        { href: '/paquetes', label: 'Paquete Aventura Extrema', desc: 'Varias cascadas en un solo viaje · 4 días' },
        { href: '/donde-hospedarse-huasteca-potosina', label: 'Dónde hospedarse', desc: 'Qué cascadas quedan cerca de cada base' },
      ],
    },
    'gastronomia-xilitla-huasteca': {
      text: 'La cocina huasteca, sin salir del hotel:',
      links: [
        { href: '/restaurante', label: 'Restaurante El Papán Huasteco', desc: 'Zacahuil, bocoles y café de olla' },
        { href: '/paquetes', label: 'Paquetes con desayuno', desc: 'De 3 a 6 días · Hotel, tours y comida' },
        { href: '/reservar', label: 'Reservar mesa o suite', desc: 'Escríbenos y te apartamos lugar' },
      ],
    },
    'puente-de-dios-xilitla': {
      text: 'El Puente de Dios se visita con tour desde Xilitla:',
      links: [
        { href: '/experiencias', label: 'Tour a Tamasopo y Puente de Dios', desc: 'Transporte desde el hotel · Guía certificado' },
        { href: '/donde-hospedarse-huasteca-potosina', label: 'Dónde hospedarse en la Huasteca', desc: 'Cuánto manejas hasta Tamasopo desde cada base' },
        { href: '/reservar', label: 'Reservar tu suite', desc: 'El tour pasa por ti al hotel' },
      ],
    },
    'sotano-golondrinas-xilitla': {
      text: 'Para ver el amanecer hay que dormir cerca:',
      links: [
        { href: '/experiencias', label: 'Tour al Sótano de las Golondrinas', desc: 'Salida de madrugada · Guía certificado' },
        { href: '/hoteles-en-xilitla', label: 'Comparar hoteles en Xilitla', desc: 'Zona, precio y distancia en una tabla' },
        { href: '/reservar', label: 'Reservar tu suite', desc: 'El tour pasa por ti al hotel' },
      ],
    },
    'que-llevar-a-xilitla': {
      text: 'Lo que empacas depende de los tours que vas a hacer:',
      links: [
        { href: '/experiencias', label: 'Ver los tours disponibles', desc: 'Qué equipo incluye cada uno' },
        { href: '/hoteles-en-xilitla', label: 'Comparar hoteles en Xilitla', desc: 'Zona, precio y distancia a Las Pozas' },
        { href: '/reservar', label: 'Reservar ahora', desc: 'Confirmación instantánea · Sin comisiones' },
      ],
    },
  };

  const internalLinks = INTERNAL_LINKS[slug];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleBreadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {howToSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />}
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <main className={styles.main}>

        {/* HERO */}
        <div className={styles.hero}>
          <div className={styles.heroImg}>
            <Image
              src={post.image}
              alt={post.imageAlt}
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
              <Link href="/blog">Blog</Link>
              <span aria-hidden="true"> › </span>
              <span>{post.category}</span>
            </nav>
          </div>
        </div>

        {/* ARTÍCULO */}
        <div className={styles.layout}>
          <article className={styles.article}>
            <header className={styles.articleHeader}>
              <p className={styles.category}>{post.category}</p>
              <h1>{post.title}</h1>
              <div className={styles.meta}>
                <span className={styles.metaAuthor}>{authorProfile.name}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={post.date}>
                  {new Date(post.date + 'T12:00:00').toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
                <span aria-hidden="true">·</span>
                <span>{post.readTime} min de lectura</span>
              </div>
            </header>

            {/* TABLA DE CONTENIDOS — solo artículos con 4+ secciones */}
            {showToc && (
              <nav className={styles.toc} aria-label="Tabla de contenidos">
                <p className={styles.tocTitle}>En este artículo</p>
                <ul className={styles.tocList}>
                  {headings.map((h) => (
                    <li key={h.id} className={h.level === 3 ? styles.tocSubItem : styles.tocItem}>
                      <a href={`#${h.id}`}>{h.text}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {/* CTA SUPERIOR — visible en móvil donde el sidebar no aparece */}
            <div className={styles.inlineCta}>
              <p className={styles.inlineCtaText}>
                ¿Planeas visitar Xilitla? Estamos a 5 min caminando de Las Pozas.
              </p>
              <a href="/reservar" className={styles.inlineCtaBtn}>Ver disponibilidad →</a>
            </div>

            <div className={styles.prose}>
              <MDXRemote source={post.content} components={mdxComponents} options={MDX_OPTIONS} />
            </div>

            {/* CTA INFERIOR — al terminar de leer */}
            <div className={styles.inlineCtaBottom}>
              <div className={styles.inlineCtaBottomInner}>
                <p className={styles.inlineCtaBottomTitle}>Hotel Paraíso Encantado</p>
                <p className={styles.inlineCtaBottomSub}>
                  13 suites boutique, 4 con spa privado · A 5 minutos de Las Pozas · Desde $1,500 MXN
                </p>
                <div className={styles.inlineCtaBottomActions}>
                  <a href="/reservar" className={styles.inlineCtaBottomPrimary}>Reservar suite</a>
                  <a href="/habitaciones" className={styles.inlineCtaBottomSecondary}>Ver las 13 suites</a>
                </div>
              </div>
            </div>

            {/* INTERNAL LINKS — contextual por artículo */}
            {internalLinks && (
              <div className={styles.internalLinks}>
                <p className={styles.internalLinksTitle}>{internalLinks.text}</p>
                <div className={styles.internalLinksGrid}>
                  {internalLinks.links.map((l) => (
                    <Link key={l.href} href={l.href} className={styles.internalLinkCard}>
                      <span className={styles.internalLinkLabel}>{l.label} →</span>
                      <span className={styles.internalLinkDesc}>{l.desc}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* AUTOR BIO */}
            <div className={styles.authorBio}>
              <div className={styles.authorAvatar} style={{ background: authorProfile.color }} aria-hidden="true">
                {authorProfile.initial}
              </div>
              <div className={styles.authorInfo}>
                <p className={styles.authorLabel}>Escrito por</p>
                <p className={styles.authorName}>{authorProfile.name}</p>
                <p className={styles.authorRole}>{authorProfile.role}</p>
                <p className={styles.authorText}>{authorProfile.bio}</p>
                <Link href={authorProfile.sameAs} className={styles.authorLink}>
                  Conoce al equipo →
                </Link>
              </div>
            </div>
          </article>

          {/* SIDEBAR */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              {/* Sin «el más cercano»: la tabla de /hoteles-en-xilitla pone otro
                  hotel a 300 m, y el sitio no puede contradecirse a sí mismo. */}
              <p className={styles.sidebarEyebrow}>A 400 m de Las Pozas</p>
              <h3>Hotel Paraíso Encantado</h3>
              <p>A 5 minutos caminando de Las Pozas de Edward James. 13 suites boutique, 4 con spa privado.</p>
              <Link href="/reservar" className={styles.sidebarCta}>Reservar Ahora</Link>
              <Link href="/habitaciones" className={styles.sidebarLink}>Ver las 13 Suites →</Link>
            </div>

            <div className={styles.sidebarCard}>
              <p className={styles.sidebarEyebrow}>¿Tienes Dudas?</p>
              <h3>Escríbenos</h3>
              <p>Te respondemos en minutos con información personalizada sobre tu viaje a Xilitla.</p>
              <a
                href="https://wa.me/524891007679"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.sidebarWa}
              >
                WhatsApp Directo
              </a>
            </div>
          </aside>
        </div>

        {/* ARTÍCULOS RELACIONADOS */}
        {related.length > 0 && (
          <section className={styles.related}>
            <div className={styles.relatedInner}>
              <h2>Más Guías de Viaje</h2>
              <div className={styles.relatedGrid}>
                {related.map((p) => (
                  <Link key={p.slug} href={`/blog/${p.slug}`} className={styles.relatedCard}>
                    <div className={styles.relatedImg}>
                      <Image
                        src={p.image}
                        alt={p.imageAlt}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        quality={70}
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div className={styles.relatedContent}>
                      <p className={styles.relatedCategory}>{p.category}</p>
                      <h3>{p.title}</h3>
                      <span className={styles.relatedRead}>{p.readTime} min →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

      </main>
    </>
  );
}
