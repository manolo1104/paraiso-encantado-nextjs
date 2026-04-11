import SuiteCard, { SuiteCardVariant } from '@/components/SuiteCard';
import { featuredSuites } from '@/data/suites';
import styles from './demo.module.css';

export const metadata = {
  title: 'Demo — Variantes de Suite Cards | Paraíso Encantado',
  description: 'Vista previa de las tres variantes visuales del componente SuiteCard',
};

const variants: { name: string; variant: SuiteCardVariant; description: string }[] = [
  {
    name: 'Default',
    variant: 'default',
    description: 'Borde superior dorado con hover suave. El estilo clásico del hotel.',
  },
  {
    name: 'Elegant',
    variant: 'elegant',
    description: 'Fondo crema con sombras sutiles y badge dorado superior. Sofisticación premium.',
  },
  {
    name: 'Minimal',
    variant: 'minimal',
    description: 'Líneas limpias con filtro grayscale sutil. Diseño contemporáneo minimalista.',
  },
];

export default function DemoCardsPage() {
  // Usamos las primeras 3 suites destacadas para la demo
  const demoSuites = featuredSuites.slice(0, 3);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1>Suite Card Variants</h1>
        <p>
          Tres variantes visuales del componente SuiteCard manteniendo la misma estructura de contenido.
          Cada variante transmite el estilo quiet luxury de Paraíso Encantado de forma diferente.
        </p>
      </header>

      {variants.map(({ name, variant, description }, idx) => (
        <section key={variant} className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.variantNumber}>0{idx + 1}</span>
            <div>
              <h2>{name}</h2>
              <p>{description}</p>
            </div>
          </div>

          <div className={styles.grid}>
            {demoSuites.map((suite, i) => (
              <SuiteCard
                key={suite.id}
                suite={suite}
                variant={variant}
                showBadge={i === 0} // Show badge on first card of each variant
              />
            ))}
          </div>
        </section>
      ))}

      <section className={styles.usage}>
        <h2>Usage</h2>
        <pre>
          <code>{`import SuiteCard from '@/components/SuiteCard';

// Default variant
<SuiteCard suite={suite} />

// Elegant variant
<SuiteCard suite={suite} variant="elegant" />

// Minimal variant  
<SuiteCard suite={suite} variant="minimal" />

// With "Más Popular" badge
<SuiteCard suite={suite} showBadge />`}</code>
        </pre>
      </section>
    </main>
  );
}
