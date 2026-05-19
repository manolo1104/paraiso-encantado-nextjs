import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllSlugs, getAllPosts, getPost } from '@/lib/blog';
import styles from './article.module.css';

function slugify(text: string): string {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

interface Heading { level: number; text: string; id: string; }

function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const regex = /^(#{2,3})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const text = match[2].replace(/[*_`]/g, '').trim();
    headings.push({ level: match[1].length, text, id: slugify(text) });
  }
  return headings;
}

const mdxComponents = {
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 id={slugify(String(children))} {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 id={slugify(String(children))} {...props}>{children}</h3>
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
      title: `${post.title} | Hotel Paraíso Encantado`,
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

  const howToSchema = slug === 'como-llegar-a-xilitla' ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Cómo Llegar a Xilitla desde Ciudad de México en Carro',
    description: 'Ruta en carro desde CDMX a Xilitla, San Luis Potosí — 5.5 horas por autopista de cuota.',
    totalTime: 'PT5H30M',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'MXN', value: '500' },
    tool: [{ '@type': 'HowToTool', name: 'GPS o Google Maps' }],
    step: [
      { '@type': 'HowToStep', position: 1, name: 'Salir por la autopista México-Tampico (MEX-85D)', text: 'Toma la autopista México-Tampico hacia el noreste desde CDMX.', url: 'https://www.paraisoencantado.com/blog/como-llegar-a-xilitla#en-carro-la-opcion-mas-flexible' },
      { '@type': 'HowToStep', position: 2, name: 'Pasar por Pachuca y Tamazunchale', text: 'Pachuca en ~1 hora, Tamazunchale en ~3.5 horas. En este tramo la carretera sube la sierra con curvas — ve despacio.', url: 'https://www.paraisoencantado.com/blog/como-llegar-a-xilitla#desde-ciudad-de-mexico-55-horas' },
      { '@type': 'HowToStep', position: 3, name: 'Llegar a Ciudad Valles (4 horas)', text: 'Ciudad Valles es el punto de conexión principal. Puedes parar a cargar gasolina y comer.', url: 'https://www.paraisoencantado.com/blog/como-llegar-a-xilitla#desde-ciudad-de-mexico-55-horas' },
      { '@type': 'HowToStep', position: 4, name: 'Tomar la carretera federal 120 hacia Xilitla', text: 'Desde Ciudad Valles toma la carretera 120. Son ~1.5 horas más con curvas de sierra.', url: 'https://www.paraisoencantado.com/blog/como-llegar-a-xilitla#ultimos-kilometros-ciudad-valles-xilitla' },
      { '@type': 'HowToStep', position: 5, name: 'Llegar al Hotel Paraíso Encantado en Xilitla', text: 'El hotel está en el centro de Xilitla, a 400 metros de Las Pozas de Edward James. Estacionamiento privado incluido.', url: 'https://www.paraisoencantado.com/blog/como-llegar-a-xilitla#al-llegar-donde-esta-el-hotel' },
    ],
  } : null;

  const INTERNAL_LINKS: Record<string, { text: string; links: { href: string; label: string; desc: string }[] }> = {
    'como-llegar-a-xilitla': {
      text: 'Ya sabes cómo llegar — ahora elige dónde quedarte:',
      links: [
        { href: '/habitaciones', label: 'Ver las 13 suites', desc: 'Desde $1,500 MXN/noche · Spa privado' },
        { href: '/paquetes', label: 'Paquetes todo incluido', desc: 'Suite + desayuno + tours desde $5,200 MXN' },
        { href: '/reservar', label: 'Reservar ahora', desc: 'Confirmación instantánea · Sin comisiones' },
      ],
    },
    'las-pozas-edward-james-guia': {
      text: '¿Planeas visitar Las Pozas? Estamos a 5 min caminando:',
      links: [
        { href: '/habitaciones/jungla', label: 'Suite Jungla', desc: 'Spa privado · La más cercana a Las Pozas' },
        { href: '/paquetes', label: 'Paquete Ruta de las Pozas', desc: '3 noches + tour coordinado + desayunos' },
        { href: '/reservar', label: 'Reservar suite', desc: 'Check-in a 5 min de Las Pozas' },
      ],
    },
    'que-hacer-en-xilitla': {
      text: 'Haz de Xilitla tu base de operaciones:',
      links: [
        { href: '/experiencias', label: 'Tours desde el hotel', desc: 'Tamul, Micos, Pozas con guía certificado' },
        { href: '/paquetes', label: 'Paquetes de aventura', desc: 'Ruta de las Pozas · 3 noches todo incluido' },
        { href: '/habitaciones', label: 'Ver habitaciones', desc: '13 suites · Spa privado · WiFi' },
      ],
    },
    'cascada-tamul-guia-completa': {
      text: '¿Quieres hacer el tour a Tamul desde nuestro hotel?',
      links: [
        { href: '/experiencias', label: 'Tour Expedición Tamul', desc: 'Sótano + Cascada + Cenote · Guía certificado' },
        { href: '/paquetes', label: 'Paquete Ruta de las Pozas', desc: 'Tour Tamul incluido + 3 noches' },
        { href: '/reservar', label: 'Reservar y coordinar tour', desc: 'Salidas diarias desde el hotel' },
      ],
    },
    'ruta-maestra-huasteca-potosina': {
      text: 'Empieza tu ruta maestra desde Xilitla:',
      links: [
        { href: '/experiencias', label: 'Todos los tours disponibles', desc: '5 rutas · Guías locales certificados' },
        { href: '/paquetes', label: 'Paquetes todo incluido', desc: 'Varios días con tours y desayunos' },
        { href: '/habitaciones', label: 'Suites en Xilitla', desc: 'Tu base en la Huasteca desde $1,500 MXN' },
      ],
    },
    'temporada-lluvias-vs-seca-xilitla': {
      text: 'Ya sabes cuándo ir — ahora asegura tu lugar:',
      links: [
        { href: '/reservar', label: 'Verificar disponibilidad', desc: 'Temporada alta · Reserva con anticipación' },
        { href: '/paquetes', label: 'Paquete Selva en Silencio', desc: 'Temporada baja · Precio especial' },
        { href: '/habitaciones', label: 'Ver suites disponibles', desc: '13 opciones · Desde $1,500 MXN/noche' },
      ],
    },
  };

  const internalLinks = INTERNAL_LINKS[slug];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleBreadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {howToSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />}
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
              <MDXRemote source={post.content} components={mdxComponents} />
            </div>

            {/* CTA INFERIOR — al terminar de leer */}
            <div className={styles.inlineCtaBottom}>
              <div className={styles.inlineCtaBottomInner}>
                <p className={styles.inlineCtaBottomTitle}>Hotel Paraíso Encantado</p>
                <p className={styles.inlineCtaBottomSub}>
                  13 suites con spa privado · A 5 minutos de Las Pozas · Desde $1,200 MXN
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
              <p className={styles.sidebarEyebrow}>El Hotel Más Cercano</p>
              <h3>Hotel Paraíso Encantado</h3>
              <p>A 5 minutos caminando de Las Pozas de Edward James. 13 suites boutique con spa privado.</p>
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
