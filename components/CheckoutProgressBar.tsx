'use client';

const STEPS = [
  { label: 'Fechas & Suite', short: 'Fechas' },
  { label: 'Tus Datos', short: 'Datos' },
  { label: 'Pago', short: 'Pago' },
];

interface Props {
  currentStep: 1 | 2 | 3;
}

export default function CheckoutProgressBar({ currentStep }: Props) {
  return (
    <>
      <style>{`
        .progress-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 14px 0 20px;
        }
        .progress-step {
          display: flex;
          align-items: center;
        }
        .progress-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 600;
          flex-shrink: 0;
          transition: all 0.25s;
          border: 2px solid #ccc;
          background: transparent;
          color: #bbb;
        }
        .progress-circle.done {
          background: #1e3012;
          border-color: #1e3012;
          color: #faf8f5;
        }
        .progress-circle.active {
          background: #c9a97a;
          border-color: #c9a97a;
          color: #1e3012;
          box-shadow: 0 0 0 3px rgba(201,169,122,0.25);
        }
        .progress-label {
          font-size: 0.72rem;
          margin-left: 6px;
          color: #bbb;
          transition: color 0.25s;
          font-weight: 400;
        }
        .progress-label.done   { color: #1e3012; }
        .progress-label.active { color: #c9a97a; font-weight: 600; }
        .progress-line {
          width: 32px;
          height: 2px;
          background: #e0e0e0;
          margin: 0 10px;
          transition: background 0.25s;
          flex-shrink: 0;
        }
        .progress-line.done { background: #1e3012; }
        @media (max-width: 400px) {
          .progress-label { display: none; }
          .progress-line  { width: 20px; margin: 0 6px; }
        }
      `}</style>
      <nav className="progress-bar" aria-label="Progreso de reserva">
        {STEPS.map((step, i) => {
          const num = i + 1;
          const done = num < currentStep;
          const active = num === currentStep;
          const circleClass = `progress-circle${done ? ' done' : active ? ' active' : ''}`;
          const labelClass = `progress-label${done ? ' done' : active ? ' active' : ''}`;
          const lineClass = `progress-line${done ? ' done' : ''}`;
          return (
            <div key={step.label} className="progress-step" aria-current={active ? 'step' : undefined}>
              <div className={circleClass} aria-hidden="true">
                {done ? '✓' : num}
              </div>
              <span className={labelClass}>{step.label}</span>
              {i < STEPS.length - 1 && <div className={lineClass} aria-hidden="true" />}
            </div>
          );
        })}
      </nav>
    </>
  );
}
