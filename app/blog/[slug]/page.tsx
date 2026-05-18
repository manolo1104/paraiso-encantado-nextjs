import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllSlugs, getAllPosts, getPost } from '@/lib/blog';
import styles from './article.module.css';

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
        images: [
          {
            url: `https://www.paraisoencantado.com${post.image}`,
            alt: post.imageAlt,
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
    dateModified: post.date,
    wordCount: post.readTime * 200,
    inLanguage: 'es-MX',
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
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

            {/* CTA SUPERIOR — visible en móvil donde el sidebar no aparece */}
            <div className={styles.inlineCta}>
              <p className={styles.inlineCtaText}>
                ¿Planeas visitar Xilitla? Estamos a 5 min caminando de Las Pozas.
              </p>
              <a href="/reservar" className={styles.inlineCtaBtn}>Ver disponibilidad →</a>
            </div>

            <div className={styles.prose}>
              <MDXRemote source={post.content} />
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
