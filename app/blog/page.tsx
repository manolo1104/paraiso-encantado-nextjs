import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import styles from './blog.module.css';

// Pre-render estático en build time — evita fs.readdirSync en producción Railway
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Blog de Viaje · Xilitla y la Huasteca Potosina | Hotel Paraíso Encantado',
  description:
    'Guías de viaje, consejos y todo lo que necesitas saber para visitar Xilitla, la Cascada de Tamul, Las Pozas de Edward James y la Huasteca Potosina.',
  alternates: {
    canonical: 'https://www.paraisoencantado.com/blog',
  },
  openGraph: {
    title: 'Blog · Xilitla y Huasteca Potosina | Hotel Paraíso Encantado',
    description:
      'Guías de viaje para visitar Xilitla, Las Pozas de Edward James, Cascada Tamul y la Huasteca Potosina.',
    url: 'https://www.paraisoencantado.com/blog',
  },
};

export default function BlogPage() {
  const posts = getAllPosts();
  const featured = posts.find((p) => p.featured);
  const rest = posts.filter((p) => !p.featured || p !== featured);

  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog de Viaje — Hotel Paraíso Encantado · Xilitla y Huasteca Potosina',
    description: 'Guías de viaje, consejos y todo lo que necesitas saber para visitar Xilitla, Las Pozas de Edward James y la Huasteca Potosina.',
    url: 'https://www.paraisoencantado.com/blog',
    publisher: {
      '@type': 'Organization',
      name: 'Hotel Paraíso Encantado',
      url: 'https://www.paraisoencantado.com',
      logo: { '@type': 'ImageObject', url: 'https://www.paraisoencantado.com/logo.png' },
    },
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.description,
      url: `https://www.paraisoencantado.com/blog/${p.slug}`,
      datePublished: p.date,
      dateModified: p.date,
      image: {
        '@type': 'ImageObject',
        url: `https://www.paraisoencantado.com${p.image}`,
        description: p.imageAlt,
      },
      author: {
        '@type': 'Person',
        name: 'Manolo Covarrubias',
        jobTitle: 'Fundador · Hotel Paraíso Encantado',
        url: 'https://www.paraisoencantado.com/sobre-nosotros',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Hotel Paraíso Encantado',
        url: 'https://www.paraisoencantado.com',
      },
    })),
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Artículos del Blog de Viaje — Xilitla y Huasteca Potosina',
    url: 'https://www.paraisoencantado.com/blog',
    numberOfItems: posts.length,
    itemListElement: posts.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://www.paraisoencantado.com/blog/${p.slug}`,
      name: p.title,
    })),
  };

  const blogBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.paraisoencantado.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog de Viaje', item: 'https://www.paraisoencantado.com/blog' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogBreadcrumb) }} />
    <main className={styles.main}>
      {/* HEADER */}
      <section className={styles.header}>
        <div className={styles.headerInner}>
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <Link href="/">Inicio</Link>
            <span aria-hidden="true"> › </span>
            <span>Blog</span>
          </nav>
          <p className={styles.eyebrow}>Huasteca Potosina · Xilitla · San Luis Potosí</p>
          <h1>Guías de <em>Viaje</em></h1>
          <p className={styles.headerSub}>
            Todo lo que necesitas saber para planear tu visita a Xilitla y la Huasteca Potosina.
          </p>
        </div>
      </section>

      {/* ARTÍCULO DESTACADO */}
      {featured && (
        <section className={styles.featured}>
          <div className={styles.featuredInner}>
            <Link href={`/blog/${featured.slug}`} className={styles.featuredCard}>
              <div className={styles.featuredImg}>
                <Image
                  src={featured.image}
                  alt={featured.imageAlt}
                  fill
                  priority
                  quality={80}
                  sizes="(max-width: 768px) 100vw, 60vw"
                  style={{ objectFit: 'cover' }}
                />
                <div className={styles.featuredOverlay} />
                <span className={styles.featuredBadge}>Destacado</span>
              </div>
              <div className={styles.featuredContent}>
                <p className={styles.postCategory}>{featured.category}</p>
                <h2>{featured.title}</h2>
                <p className={styles.postDescription}>{featured.description}</p>
                <div className={styles.postMeta}>
                  <span>{featured.date}</span>
                  <span>·</span>
                  <span>{featured.readTime} min de lectura</span>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* GRID DE ARTÍCULOS */}
      <section className={styles.grid}>
        <div className={styles.gridInner}>
          <h2 className={styles.gridTitle}>Todos los Artículos</h2>
          <div className={styles.cards}>
            {rest.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.card}>
                <div className={styles.cardImg}>
                  <Image
                    src={post.image}
                    alt={post.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    quality={75}
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.cardContent}>
                  <p className={styles.postCategory}>{post.category}</p>
                  <h3>{post.title}</h3>
                  <p className={styles.postDescription}>{post.description}</p>
                  <div className={styles.postMeta}>
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readTime} min</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2>¿Listo para Visitar Xilitla?</h2>
          <p>Hotel Paraíso Encantado · A 5 minutos caminando de Las Pozas de Edward James</p>
          <Link href="/reservar" className={styles.ctaBtn}>Reservar Suite</Link>
        </div>
      </section>
    </main>
    </>
  );
}
