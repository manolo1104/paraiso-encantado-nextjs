import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllSlugs, getAllPosts, getPost } from '@/lib/blog';
import styles from './article.module.css';

interface Props {
  params: Promise<{ slug: string }>;
}

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

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: `https://www.paraisoencantado.com${post.image}`,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Organization',
      name: post.author,
      url: 'https://www.paraisoencantado.com',
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
                <span>{post.author}</span>
                <span>·</span>
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.readTime} min de lectura</span>
              </div>
            </header>

            <div className={styles.prose}>
              <MDXRemote source={post.content} />
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
