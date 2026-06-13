// Fondo de "selva" 100% por código: degradado profundo + destellos de luz a la
// deriva (bokeh) + frondas en las esquinas + viñeta para contraste de texto.
// Todo determinista (sin Math.random) para que el render sea estable.

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { COLORS } from "./theme";

type Blob = { x: number; y: number; r: number; hue: string; amp: number; speed: number; phase: number };

const BLOBS: Blob[] = [
  { x: 18, y: 24, r: 620, hue: "rgba(46,122,91,0.55)", amp: 28, speed: 0.5, phase: 0 },
  { x: 84, y: 18, r: 520, hue: "rgba(201,168,106,0.18)", amp: 22, speed: 0.7, phase: 1.7 },
  { x: 78, y: 82, r: 700, hue: "rgba(30,92,69,0.6)", amp: 34, speed: 0.4, phase: 3.1 },
  { x: 22, y: 88, r: 480, hue: "rgba(44,122,91,0.4)", amp: 26, speed: 0.6, phase: 4.6 },
];

const Frond: React.FC<{ flip?: boolean; bottom?: boolean; sway: number; opacity: number }> = ({
  flip,
  bottom,
  sway,
  opacity,
}) => (
  <svg
    width={620}
    height={620}
    viewBox="0 0 200 200"
    style={{
      position: "absolute",
      ...(bottom ? { bottom: -120 } : { top: -120 }),
      ...(flip ? { right: -120 } : { left: -120 }),
      transform: `${flip ? "scaleX(-1)" : ""} ${bottom ? "scaleY(-1)" : ""} rotate(${sway}deg)`,
      transformOrigin: flip ? "right top" : "left top",
      opacity,
    }}
  >
    {/* fronda estilizada (varias hojas en abanico) */}
    {Array.from({ length: 7 }).map((_, i) => {
      const a = -10 + i * 16;
      return (
        <g key={i} transform={`rotate(${a} 40 40)`}>
          <path
            d="M40 40 C 70 50, 120 50, 170 30 C 120 70, 70 72, 40 40 Z"
            fill={COLORS.green500}
          />
        </g>
      );
    })}
  </svg>
);

export const JungleBg: React.FC<{ animate?: boolean; zoom?: boolean; seed?: number }> = ({
  animate = true,
  zoom = false,
  seed = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = animate ? frame / fps : 1.5; // segundos (valor fijo agradable para stills)

  const scale = zoom
    ? interpolate(frame, [0, durationInFrames], [1.04, 1.16], { extrapolateRight: "clamp" })
    : 1;

  const sway = Math.sin(t * 0.6 + seed) * 3;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.green900, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          background: `linear-gradient(155deg, ${COLORS.green900} 0%, ${COLORS.green800} 45%, ${COLORS.green700} 100%)`,
        }}
      >
        {BLOBS.map((b, i) => {
          const dx = Math.sin(t * b.speed + b.phase + seed) * b.amp;
          const dy = Math.cos(t * b.speed * 0.8 + b.phase + seed) * b.amp;
          // variación sutil de posición por slide (seed)
          const ox = (seed * 7) % 12;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `calc(${b.x + ox}% - ${b.r / 2}px)`,
                top: `calc(${b.y}% - ${b.r / 2}px)`,
                width: b.r,
                height: b.r,
                transform: `translate(${dx}px, ${dy}px)`,
                background: `radial-gradient(circle, ${b.hue} 0%, rgba(0,0,0,0) 68%)`,
                filter: "blur(8px)",
              }}
            />
          );
        })}

        <Frond sway={sway} opacity={0.22} />
        <Frond flip bottom sway={-sway} opacity={0.18} />
      </AbsoluteFill>

      {/* viñeta para contraste del texto */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 80% at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
