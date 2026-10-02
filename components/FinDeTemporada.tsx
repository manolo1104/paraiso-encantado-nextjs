'use client';

import { useEffect, useState, type ReactNode } from 'react';

// Esconde una sección de temporada cuando ya pasó su fecha, aunque la página se haya
// compilado antes. Arranca visible para que el HTML del servidor y el del navegador
// coincidan (si arrancara oculta, React se quejaría al hidratar).
export default function FinDeTemporada({ fin, children }: { fin: string; children: ReactNode }) {
  const [vigente, setVigente] = useState(true);

  useEffect(() => {
    if (Date.now() > Date.parse(fin)) setVigente(false);
  }, [fin]);

  return vigente ? <>{children}</> : null;
}
