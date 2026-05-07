'use client';

import { Receipt, Clock, CheckCircle2, Circle, ChevronRight, AlertTriangle } from 'lucide-react';
import styles from './facturacion.module.css';

const PLAN = [
  {
    fase: 1,
    titulo: 'Proveedor de timbrado PAC',
    descripcion: 'Contratar un PAC (Proveedor Autorizado de Certificación) autorizado por el SAT.',
    opciones: ['Facturama — API sencilla, ~$200 MXN/mes, 200 CFDIs incluidos', 'SW Sapiens — más económico para bajo volumen', 'Edicom — enterprise, overkill para hotel boutique'],
    recomendacion: 'Facturama por su API REST bien documentada y precio accesible.',
    estado: 'pendiente',
  },
  {
    fase: 2,
    titulo: 'CSD del hotel (Certificado de Sello Digital)',
    descripcion: 'Necesitas obtener el CSD en el portal del SAT con la e.firma de la empresa.',
    opciones: ['Descargar en sat.gob.mx → "Factura electrónica" → "Sellos digitales"', 'Requiere RFC del hotel, e.firma vigente', 'El CSD tiene vigencia de 4 años'],
    recomendacion: 'Tramitar antes de contratar el PAC — algunos verifican el CSD al registrar.',
    estado: 'pendiente',
  },
  {
    fase: 3,
    titulo: 'API de timbrado integrada al admin',
    descripcion: 'Al confirmar una reserva, el staff puede generar CFDI 4.0 con un click.',
    opciones: [
      'Nueva ruta /api/admin/facturacion/generar — recibe datos de reserva, llama API del PAC, devuelve XML + PDF',
      'Guardar UUID fiscal y folio CFDI en Google Sheets (columna nueva en Reservas)',
      'Enviar CFDI al huésped vía email automáticamente',
    ],
    recomendacion: 'Agregar botón "Generar CFDI" en la vista detalle de cada reserva.',
    estado: 'pendiente',
  },
  {
    fase: 4,
    titulo: 'Datos fiscales del huésped',
    descripcion: 'El huésped debe proporcionar RFC, razón social y uso del CFDI para factura a nombre de empresa.',
    opciones: [
      'Formulario opcional en /reservar/checkout: "¿Necesitas factura?"',
      'Campos: RFC, Razón Social, Régimen Fiscal, Uso CFDI (G03 — Gastos en general)',
      'Guardar en la reserva; si no se llena, CFDI va a RFC público XAXX010101000',
    ],
    recomendacion: 'Campo opcional en checkout para no generar fricción en reservas normales.',
    estado: 'pendiente',
  },
  {
    fase: 5,
    titulo: 'Portal de auto-facturación',
    descripcion: 'Página pública donde el huésped ingresa su folio y RFC para generar su CFDI por su cuenta.',
    opciones: [
      '/facturacion — página pública en el sitio',
      'Busca reserva por folio + email → muestra datos → genera CFDI al instante',
      'Descarga PDF + XML directamente desde el browser',
    ],
    recomendacion: 'Implementar después de tener el timbrado funcionando en admin.',
    estado: 'pendiente',
  },
];

const REQS = [
  { label: 'RFC del hotel registrado en el SAT', done: false },
  { label: 'e.firma vigente del negocio', done: false },
  { label: 'CSD (Certificado de Sello Digital)', done: false },
  { label: 'Cuenta con PAC autorizado', done: false },
  { label: 'API key del PAC', done: false },
  { label: 'Régimen fiscal del hotel', done: false },
];

export default function FacturacionClient() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerIcon}><Receipt size={28} /></div>
        <div>
          <h1 className={styles.title}>Facturación / CFDI</h1>
          <p className={styles.subtitle}>Módulo en preparación</p>
        </div>
        <span className={styles.statusChip}>
          <Clock size={12} /> En planeación
        </span>
      </div>

      <div className={styles.alert}>
        <AlertTriangle size={16} />
        <div>
          <strong>Este módulo aún no está activo.</strong> Para activarlo necesitas contratar un PAC (Proveedor Autorizado de Certificación) y obtener tu CSD del SAT. Una vez que me confirmes que tienes los requisitos, puedo implementar el timbrado completo.
        </div>
      </div>

      {/* Checklist de requisitos */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Requisitos previos</h2>
        <div className={styles.reqList}>
          {REQS.map((r, i) => (
            <div key={i} className={styles.reqItem}>
              {r.done
                ? <CheckCircle2 size={16} className={styles.iconDone} />
                : <Circle size={16} className={styles.iconPending} />
              }
              <span className={r.done ? styles.reqDone : styles.reqText}>{r.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Plan de implementación */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Plan de implementación</h2>
        <div className={styles.planList}>
          {PLAN.map((fase) => (
            <div key={fase.fase} className={styles.faseCard}>
              <div className={styles.faseHeader}>
                <span className={styles.faseNum}>Fase {fase.fase}</span>
                <h3 className={styles.faseTitulo}>{fase.titulo}</h3>
              </div>
              <p className={styles.faseDesc}>{fase.descripcion}</p>
              <ul className={styles.faseOpts}>
                {fase.opciones.map((o, i) => (
                  <li key={i} className={styles.faseOpt}>
                    <ChevronRight size={12} className={styles.faseOptIcon} />
                    {o}
                  </li>
                ))}
              </ul>
              <div className={styles.faseRec}>
                <strong>Recomendación:</strong> {fase.recomendacion}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Estimación */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Estimación de costo y tiempo</h2>
        <div className={styles.estimGrid}>
          <div className={styles.estimCard}>
            <span className={styles.estimLabel}>Costo mensual PAC</span>
            <span className={styles.estimVal}>~$200–500 MXN</span>
            <span className={styles.estimSub}>según volumen de CFDIs</span>
          </div>
          <div className={styles.estimCard}>
            <span className={styles.estimLabel}>Tiempo de implementación</span>
            <span className={styles.estimVal}>1–2 semanas</span>
            <span className={styles.estimSub}>una vez con CSD y API key</span>
          </div>
          <div className={styles.estimCard}>
            <span className={styles.estimLabel}>CFDIs típicos por mes</span>
            <span className={styles.estimVal}>10–40</span>
            <span className={styles.estimSub}>según ocupación del hotel</span>
          </div>
        </div>
      </section>
    </div>
  );
}
