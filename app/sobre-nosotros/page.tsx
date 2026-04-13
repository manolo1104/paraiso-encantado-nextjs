import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Leaf, Target, Eye, Heart, TreePine, Users } from 'lucide-react';
import styles from './sobre-nosotros.module.css';

export const metadata: Metadata = {
  title: 'Sobre Nosotros | Hotel Paraíso Encantado · Xilitla, SLP',
  description:
    'Conoce la historia, misión y valores del Hotel Paraíso Encantado en Xilitla. Hotel boutique comprometido con la naturaleza y la comunidad de la Huasteca Potosina.',
};

const BOOKING_URL = 'https://booking-paraisoencantado.up.railway.app';

export default function SobreNosotrosPage() {
  return (
    <main className={styles.main}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Inicio</Link>
        <span aria-hidden="true"> / </span>
        <span>Sobre Nosotros</span>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Xilitla, Huasteca Potosina</p>
          <h1 className={styles.heroTitle}>
            El hotel que <em>nació de la selva</em>
          </h1>
          <p className={styles.heroDesc}>
            Paraíso Encantado es un hotel boutique ubicado en el corazón de Xilitla, San Luis Potosí,
            a sólo 5 minutos caminando del Jardín Surrealista de Edward James. Nacimos con la convicción
            de que el turismo puede ser una fuerza positiva para la comunidad y para la naturaleza.
          </p>
        </div>
        <div className={styles.heroImageWrap}>
          <Image
            src="/images/JUNGLA/PORTADA.JPG"
            alt="Hotel Paraíso Encantado — Vista desde la selva de Xilitla"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className={styles.heroImg}
          />
          <div className={styles.heroImgOverlay} />
        </div>
      </section>

      {/* Stats */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          {[
            { num: '13', label: 'Suites únicas' },
            { num: '4.6', label: 'Estrellas en Google' },
            { num: '519', label: 'Reseñas verificadas' },
            { num: '5 min', label: 'De las Pozas de Edward James' },
          ].map((s) => (
            <div key={s.label} className={styles.statItem}>
              <span className={styles.statNum}>{s.num}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Historia */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.textBlock}>
            <div className={styles.sectionIcon}><Heart size={28} strokeWidth={1.5} /></div>
            <h2>Nuestra <em>Historia</em></h2>
            <p>
              Paraíso Encantado nació del amor por la Huasteca Potosina y de la creencia de que Xilitla
              merece un hotel que esté a la altura de su naturaleza extraordinaria. Cada una de nuestras
              13 suites fue diseñada con un nombre propio, una identidad y un carácter único — porque
              creemos que hospedarse en un lugar memorable empieza desde el momento en que cruzas la puerta.
            </p>
            <p>
              Hoy somos el hotel boutique más cercano al Jardín Surrealista de Edward James (Las Pozas),
              a solo 5 minutos caminando desde la entrada. Nuestros huéspedes llegan antes que los tours
              organizados y disfrutan la magia de Las Pozas casi en soledad, antes de que lleguen las
              multitudes.
            </p>
          </div>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className={styles.mvSection}>
        <div className={styles.mvGrid}>

          <div className={styles.mvCard}>
            <div className={styles.mvIcon}><Target size={32} strokeWidth={1.5} /></div>
            <h3>Misión</h3>
            <p>
              En Paraíso Encantado, nuestro objetivo es superar expectativas y crear un ambiente acogedor
              y confortable para una estancia inolvidable, mientras apoyamos el desarrollo de la comunidad
              local y fomentamos la conservación de la naturaleza.
            </p>
          </div>

          <div className={styles.mvCard}>
            <div className={styles.mvIcon}><Eye size={32} strokeWidth={1.5} /></div>
            <h3>Visión</h3>
            <p>
              En Paraíso Encantado queremos convertirnos en el mejor hotel boutique de la Huasteca Potosina,
              reconocidos por la calidad de nuestros servicios y ser el destino preferido de los viajeros
              que buscan una experiencia auténtica y memorable en nuestras 12 habitaciones enfocadas en el
              confort. Además, aspiramos a ser un actor clave en el desarrollo sostenible de la comunidad
              local, fomentando la economía y la preservación del patrimonio natural y cultural de la región.
            </p>
          </div>

        </div>
      </section>

      {/* Responsabilidad Ambiental */}
      <section className={styles.ecoSection}>
        <div className={styles.ecoInner}>
          <div className={styles.ecoText}>
            <div className={styles.ecoIcon}><Leaf size={36} strokeWidth={1.3} /></div>
            <h2>Responsabilidad <em>Ambiental Empresarial</em></h2>
            <p>
              Como empresa comprometida con el medio ambiente, nos aseguramos de distribuir nuestras
              habitaciones de manera que causen el menor impacto posible en la flora de la extensa
              naturaleza de Xilitla. De esta forma, conservamos la mayoría de los árboles y plantas
              que ya existían en la zona.
            </p>
            <div className={styles.ecoPillars}>
              <div className={styles.ecoPillar}>
                <TreePine size={20} strokeWidth={1.5} />
                <span>Conservación de flora nativa</span>
              </div>
              <div className={styles.ecoPillar}>
                <Users size={20} strokeWidth={1.5} />
                <span>Apoyo a productores locales</span>
              </div>
              <div className={styles.ecoPillar}>
                <Leaf size={20} strokeWidth={1.5} />
                <span>Turismo de bajo impacto</span>
              </div>
            </div>
          </div>
          <div className={styles.ecoImageWrap}>
            <Image
              src="/images/atracciones/jardin_de_edward_james.jpg"
              alt="Naturaleza de Xilitla — Compromiso ambiental de Paraíso Encantado"
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className={styles.ecoImage}
            />
          </div>
        </div>
      </section>

      {/* Comunidad */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.textBlock}>
            <div className={styles.sectionIcon}><Users size={28} strokeWidth={1.5} /></div>
            <h2>Compromiso con la <em>Comunidad</em></h2>
            <p>
              Trabajamos de la mano con los productores de Xilitla y la sierra potosina. Nuestro
              restaurante El Papán Huasteco utiliza maíz criollo, frijol negro, chile serrano y hierbas
              del huerto propio. Cada platillo en nuestra mesa representa el trabajo de las familias de
              la región.
            </p>
            <p>
              Nuestros tours son operados por guías certificados locales, generando empleo directo en la
              comunidad. Creemos que el turismo responsable es la mejor forma de preservar la Huasteca
              para las generaciones que vienen.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <p className={styles.eyebrow}>Únete a Nuestra Historia</p>
        <h2 className={styles.ctaTitle}>
          Ven a conocer <em>Paraíso Encantado</em>
        </h2>
        <p className={styles.ctaDesc}>
          Una experiencia auténtica en la Huasteca Potosina te espera.
        </p>
        <div className={styles.ctaButtons}>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaBtn}
          >
            Reservar Suite
          </a>
          <Link href="/contacto" className={styles.ctaBtnOutline}>
            Contáctanos
          </Link>
        </div>
      </section>

    </main>
  );
}
