// REEL · 9:16 (1080×1920) · ~18 s. "POV: llegas al Paraíso".
// Cada escena usa una FOTO REAL del hotel/atracciones (Ken Burns + fundido) con
// texto animado encima. Cierre con CTA. Pensado para verse SIN sonido.

import React from "react";
import {
  AbsoluteFill,
  Series,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { PhotoBg } from "./PhotoBg";
import { COLORS, serif, sans, kicker } from "./theme";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

const SCENES = [
  { eyebrow: "POV", text: "cambiaste la ciudad", accent: "por esto.", dur: 95, src: "post.jpg" },
  { text: "Despiertas dentro", accent: "de la selva.", dur: 80, src: "suite1.jpg" },
  { text: "El café sabe", accent: "distinto aquí.", dur: 80, src: "suite2.jpg" },
  { text: "Las Pozas,", accent: "a 10 minutos.", dur: 80, src: "pozas.jpg" },
  { text: "No vas a", accent: "querer irte.", dur: 80, src: "cta.jpg" },
];
const OUTRO = 125;

export const REEL_DURATION = SCENES.reduce((a, s) => a + s.dur, 0) + OUTRO;

const SceneText: React.FC<{ text: string; accent: string; eyebrow?: string; durationInFrames: number }> = ({
  text,
  accent,
  eyebrow,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inP = interpolate(frame, [0, 0.6 * fps], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outP = interpolate(frame, [durationInFrames - 0.4 * fps, durationInFrames], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = inP - outP;
  const y = (1 - inP) * 46;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 90 }}>
      <div style={{ opacity, transform: `translateY(${y}px)`, textAlign: "center" }}>
        {eyebrow && <div style={{ ...kicker, fontSize: 34, marginBottom: 24 }}>{eyebrow}</div>}
        <div
          style={{
            fontFamily: serif,
            fontWeight: 700,
            color: COLORS.cream,
            fontSize: 120,
            lineHeight: 1.04,
            textShadow: "0 6px 40px rgba(0,0,0,0.65)",
          }}
        >
          {text}
          <br />
          <span style={{ color: COLORS.gold, fontStyle: "italic" }}>{accent}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene: React.FC<{
  src: string;
  text: string;
  accent: string;
  eyebrow?: string;
  durationInFrames: number;
}> = ({ src, text, accent, eyebrow, durationInFrames }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <PhotoBg src={src} overlay="reel" zoom zoomFrames={durationInFrames} fadeIn={0.5 * fps} />
      <SceneText text={text} accent={accent} eyebrow={eyebrow} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
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
      <PhotoBg src="suite1.jpg" overlay="outro" zoom zoomFrames={OUTRO} fadeIn={0.5 * fps} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 90, textAlign: "center" }}>
        <div style={{ opacity: e(0), transform: `scale(${interpolate(e(0), [0, 1], [0.92, 1])})` }}>
          <div style={{ ...kicker, fontSize: 30 }}>Hotel Boutique · Xilitla</div>
          <div
            style={{
              fontFamily: serif,
              fontWeight: 700,
              color: COLORS.cream,
              fontSize: 128,
              lineHeight: 1.0,
              margin: "20px 0 0",
              textShadow: "0 6px 40px rgba(0,0,0,0.65)",
            }}
          >
            Paraíso
            <br />
            Encantado
          </div>
        </div>
        <div style={{ width: 80, height: 2, background: COLORS.gold, margin: "44px 0", opacity: e(10) }} />
        <div style={{ opacity: e(16), textAlign: "center" }}>
          <div style={{ fontFamily: sans, fontWeight: 600, color: COLORS.cream, fontSize: 38 }}>
            Reserva directo
          </div>
          <div style={{ fontFamily: sans, fontWeight: 300, color: COLORS.cream, fontSize: 32, marginTop: 12 }}>
            paraisoencantado.com · WhatsApp 489 100 7679
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const w = interpolate(frame, [0, durationInFrames], [0, 100], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: "rgba(244,239,227,0.15)" }}>
      <div style={{ height: "100%", width: `${w}%`, background: COLORS.gold }} />
    </div>
  );
};

export const Reel: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.green900 }}>
      <Series>
        {SCENES.map((s, i) => (
          <Series.Sequence key={i} durationInFrames={s.dur} premountFor={fps}>
            <Scene
              src={s.src}
              text={s.text}
              accent={s.accent}
              eyebrow={s.eyebrow}
              durationInFrames={s.dur}
            />
          </Series.Sequence>
        ))}
        <Series.Sequence durationInFrames={OUTRO} premountFor={fps}>
          <Outro />
        </Series.Sequence>
      </Series>

      {/* Marca persistente abajo */}
      <div
        style={{
          position: "absolute",
          bottom: 54,
          left: 0,
          right: 0,
          textAlign: "center",
          ...kicker,
          fontSize: 22,
          color: "rgba(244,239,227,0.7)",
          textShadow: "0 2px 12px rgba(0,0,0,0.6)",
        }}
      >
        Xilitla · Huasteca Potosina
      </div>

      <ProgressBar />
    </AbsoluteFill>
  );
};
