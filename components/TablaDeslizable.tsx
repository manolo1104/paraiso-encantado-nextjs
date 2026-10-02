'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

// Contenedor de tabla que se marca con data-desliza cuando la tabla no cabe a lo ancho,
// para que el CSS muestre «Desliza la tabla…» solo cuando de verdad hay columnas fuera
// de la vista (una tabla de 3 columnas cortas sí cabe en un celular). Mide el propio
// contenedor y la tabla porque, según la página, el que hace scroll es uno u otro.
export default function TablaDeslizable({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [desborda, setDesborda] = useState(false);

  useEffect(() => {
    const caja = ref.current;
    if (!caja) return;
    const medir = () => {
      const tabla = caja.querySelector('table');
      setDesborda([caja, tabla].some((el) => !!el && el.scrollWidth > el.clientWidth + 1));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(caja);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} data-desliza={desborda ? '' : undefined}>
      {children}
    </div>
  );
}
