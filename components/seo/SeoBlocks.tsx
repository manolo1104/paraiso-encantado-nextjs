/**
 * Piezas compartidas por las landings SEO.
 *
 * Son server components (sin 'use client'): estas páginas deben renderizar su
 * contenido en el HTML sin JavaScript. Un buscador con IA o un agente que lee el
 * DOM no puede citar lo que solo existe después de hidratar.
 */
import Image from 'next/image';
import Link from 'next/link';
import styles from './seo-landing.module.css';

export { styles as seoStyles };

// ── HERO ──────────────────────────────────────────────────
export function SeoHero({
  image, imageAlt, eyebrow, title, titleEm, titleAfter, sub, breadcrumb, ctaPrimary, ctaSecondary, updated,
}: {
  image: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  titleEm?: string;
  titleAfter?: string;
  sub: string;
  breadcrumb: string;
  ctaPrimary?: { href: string; label: string };
  ctaSecondary?: { href: string; label: string };
  updated?: string;
}) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroImg}>
        <Image src={image} alt={imageAlt} fill priority quality={80} sizes="100vw" style={{ objectFit: 'cover' }} />
        <div className={styles.heroOverlay} />
      </div>
      <div className={styles.heroContent}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/">Inicio</Link><span aria-hidden="true"> › </span><span>{breadcrumb}</span>
        </nav>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1>
          {title}
          {titleEm && <> <em>{titleEm}</em></>}
          {titleAfter && <><br />{titleAfter}</>}
        </h1>
        <p className={styles.heroSub}>{sub}</p>
        <div className={styles.heroCtas}>
          {ctaPrimary && <Link href={ctaPrimary.href} className={styles.heroCtaPrimary}>{ctaPrimary.label}</Link>}
          {ctaSecondary && <Link href={ctaSecondary.href} className={styles.heroCtaSecondary}>{ctaSecondary.label}</Link>}
        </div>
        {updated && <p className={styles.updated}>Actualizado: {updated}</p>}
      </div>
    </section>
  );
}

// ── RESPUESTA DIRECTA ─────────────────────────────────────
/**
 * El párrafo que responde la búsqueda de golpe, sin rodeos, en 40-60 palabras.
 * Es el bloque que los buscadores con IA extraen y citan; por eso va arriba y
 * se sostiene solo, sin depender del resto de la página.
 */
export function AnswerBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className={styles.answer}>
      <div className={styles.answerInner}>
        <p className={styles.answerLabel}>{label}</p>
        {children}
      </div>
    </section>
  );
}

// ── FRANJA DE DATOS ───────────────────────────────────────
export function StatStrip({ stats }: { stats: { num: string; label: string }[] }) {
  return (
    <section className={styles.stats}>
      <div className={styles.statsInner}>
        {stats.map((s, i) => (
          <div key={s.label} style={{ display: 'contents' }}>
            {i > 0 && <div className={styles.statDivider} />}
            <div className={styles.stat}>
              <span className={styles.statNum}>{s.num}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── TABLA COMPARATIVA ─────────────────────────────────────
export function CompareTable({
  caption, headers, rows,
}: {
  caption?: string;
  headers: string[];
  rows: { cells: string[]; highlight?: boolean }[];
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>{headers.map(h => <th key={h} scope="col">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={r.highlight ? styles.highlight : undefined}>
              {r.cells.map((c, j) => (
                j === 0 ? <th key={j} scope="row" style={{ background: 'transparent', color: 'inherit', fontWeight: 600 }}>{c}</th> : <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── FAQ ───────────────────────────────────────────────────
export function SeoFaq({ faqs, title = 'Preguntas frecuentes' }: { faqs: { q: string; a: string }[]; title?: string }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionInner} style={{ maxWidth: 760 }}>
        <h2>{title}</h2>
        <div className={styles.faqList}>
          {faqs.map(f => (
            <div key={f.q} className={styles.faqItem}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── ENLACES RELACIONADOS ──────────────────────────────────
export function RelatedLinks({ links, title = 'Sigue leyendo' }: { links: { href: string; label: string }[]; title?: string }) {
  return (
    <section className={styles.sectionAlt}>
      <div className={styles.sectionInner}>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)' }}>{title}</h2>
        <div className={styles.related}>
          {links.map(l => (
            <Link key={l.href} href={l.href} className={styles.relatedLink}>{l.label}</Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA FINAL ─────────────────────────────────────────────
export function SeoCta({
  title, titleEm, body, note,
}: { title: string; titleEm?: string; body: string; note?: string }) {
  return (
    <section className={styles.cta}>
      <div className={styles.ctaInner}>
        <h2>{title}{titleEm && <> <em>{titleEm}</em></>}</h2>
        <p>{body}</p>
        <div className={styles.ctaBtns}>
          <Link href="/reservar" className={styles.ctaPrimary}>Ver disponibilidad</Link>
          <Link href="/habitaciones" className={styles.ctaSecondary}>Ver las 13 suites</Link>
        </div>
        {note && <p className={styles.ctaNote}>{note}</p>}
      </div>
    </section>
  );
}
