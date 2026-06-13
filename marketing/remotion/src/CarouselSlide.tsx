// CARRUSEL · "5 maravillas de la Huasteca a 1 hora de tu cama"
// Un solo componente parametrizado → se renderiza 7 veces (portada, 5 ítems, CTA).
// 1080×1350.

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { PhotoBg } from "./PhotoBg";
import { COLORS, serif, sans, kicker } from "./theme";

export type SlideProps = {
  kind: "cover" | "item" | "cta";
  index: number; // 0 portada, 1..5 ítems, 6 CTA
  total: number; // 5 maravillas
  label: string; // "MARAVILLA 1" / "GUÍA HUASTECA" / "RESERVA"
  title: string;
  subtitle: string;
  photo: string; // archivo en public/photos
};

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const CarouselSlide: React.FC<SlideProps> = ({ kind, index, total, label, title, subtitle, photo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = (d: number) =>
    interpolate(frame, [d, d + 0.7 * fps], [0, 1], {
      easing: EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  return (
    <AbsoluteFill>
      <PhotoBg src={photo} overlay="carousel" zoom zoomFrames={90} fadeIn={8} />

      {/* Marco interior */}
      <AbsoluteFill style={{ padding: 56 }}>
        <div
          style={{
            flex: 1,
            border: `1.5px solid rgba(201,168,106,0.55)`,
            borderRadius: 18,
            padding: 64,
            display: "flex",
            flexDirection: "column",
            justifyContent: kind === "cover" ? "center" : "flex-start",
            position: "relative",
          }}
        >
          {/* Número gigante de fondo para ítems */}
          {kind === "item" && (
            <div
              style={{
                position: "absolute",
                right: 40,
                bottom: -30,
                fontFamily: serif,
                fontWeight: 700,
                fontSize: 460,
                lineHeight: 1,
                color: "rgba(244,239,227,0.06)",
                opacity: e(0),
              }}
            >
              {index}
            </div>
          )}

          {/* Kicker / etiqueta */}
          <div style={{ ...kicker, fontSize: 26, opacity: e(0), transform: `translateY(${(1 - e(0)) * -10}px)` }}>
            {label}
          </div>

          {/* Título */}
          <h1
            style={{
              fontFamily: serif,
              fontWeight: 700,
              color: COLORS.cream,
              fontSize: kind === "cover" ? 104 : 88,
              lineHeight: 1.08,
              margin: "26px 0 0",
              maxWidth: 760,
              opacity: e(6),
              transform: `translateY(${(1 - e(6)) * 20}px)`,
              textShadow: "0 4px 24px rgba(0,0,0,0.35)",
            }}
          >
            {title}
          </h1>

          {/* Subtítulo */}
          <p
            style={{
              fontFamily: sans,
              fontWeight: 300,
              color: COLORS.creamDim,
              fontSize: 32,
              lineHeight: 1.5,
              marginTop: 26,
              maxWidth: 720,
              opacity: e(14),
              transform: `translateY(${(1 - e(14)) * 16}px)`,
            }}
          >
            {subtitle}
          </p>

          {/* CTA extra en última lámina */}
          {kind === "cta" && (
            <div style={{ marginTop: 40, opacity: e(20) }}>
              <div
                style={{
                  display: "inline-block",
                  padding: "16px 32px",
                  borderRadius: 999,
                  background: COLORS.gold,
                  color: COLORS.green900,
                  fontFamily: sans,
                  fontWeight: 700,
                  fontSize: 28,
                }}
              >
                paraisoencantado.com
              </div>
              <div style={{ fontFamily: sans, color: COLORS.creamDim, fontSize: 26, marginTop: 22 }}>
                WhatsApp 489 100 7679 · Xilitla, SLP
              </div>
            </div>
          )}

          {/* Pie: marca + contador */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: 40,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              opacity: e(10),
            }}
          >
            <span style={{ ...kicker, fontSize: 20, color: COLORS.creamDim }}>Paraíso Encantado</span>
            {kind === "item" && (
              <span style={{ fontFamily: sans, fontWeight: 600, color: COLORS.gold, fontSize: 24 }}>
                {index}/{total}
              </span>
            )}
            {kind === "cover" && (
              <span style={{ fontFamily: sans, fontWeight: 600, color: COLORS.gold, fontSize: 22 }}>
                Desliza →
              </span>
            )}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Las 7 láminas (contenido real del plan de marketing)
export const SLIDES: SlideProps[] = [
  {
    kind: "cover",
    index: 0,
    total: 5,
    label: "Guía Huasteca",
    title: "5 maravillas a una hora de tu cama",
    subtitle: "Guarda este post para tu próxima escapada a Xilitla.",
    photo: "cover.jpg",
  },
  {
    kind: "item",
    index: 1,
    total: 5,
    label: "Maravilla 1",
    title: "Las Pozas",
    subtitle: "El jardín surrealista de Edward James. A ~10 min del hotel.",
    photo: "pozas.jpg",
  },
  {
    kind: "item",
    index: 2,
    total: 5,
    label: "Maravilla 2",
    title: "Cascada de Tamul",
    subtitle: "105 metros de agua turquesa cayendo. La postal de la Huasteca.",
    photo: "tamul.jpg",
  },
  {
    kind: "item",
    index: 3,
    total: 5,
    label: "Maravilla 3",
    title: "Sótano de las Golondrinas",
    subtitle: "Un abismo de 376 m y miles de aves saliendo al amanecer.",
    photo: "sotano.jpg",
  },
  {
    kind: "item",
    index: 4,
    total: 5,
    label: "Maravilla 4",
    title: "Puente de Dios",
    subtitle: "Aguas color jade entre la selva. Para nadar y respirar.",
    photo: "puente.jpg",
  },
  {
    kind: "item",
    index: 5,
    total: 5,
    label: "Maravilla 5",
    title: "Xilitla, pueblo mágico",
    subtitle: "Café de altura, calles entre montañas y espíritu surrealista.",
    photo: "xilitla.jpg",
  },
  {
    kind: "cta",
    index: 6,
    total: 5,
    label: "Tu base para vivirlo todo",
    title: "Despierta en la selva, sal a la aventura.",
    subtitle: "Hotel boutique a minutos de todo. Reserva directo, sin comisiones.",
    photo: "cta.jpg",
  },
];
