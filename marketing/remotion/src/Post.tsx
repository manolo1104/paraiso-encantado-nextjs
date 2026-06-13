// POST · feed 4:5 (1080×1350). Gancho sensorial + marca + CTA.
// Se renderiza como imagen fija (still) pero tiene animación de entrada
// por si se exporta como video corto.

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { PhotoBg } from "./PhotoBg";
import { COLORS, serif, sans, kicker } from "./theme";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const Post: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = (delay: number) =>
    interpolate(frame, [delay, delay + 0.8 * fps], [0, 1], {
      easing: EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const e1 = enter(0);
  const e2 = enter(8);
  const e3 = enter(18);

  return (
    <AbsoluteFill>
      <PhotoBg src="post.jpg" overlay="post" zoom zoomFrames={150} fadeIn={10} focusY={45} />
      <AbsoluteFill
        style={{
          padding: 96,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Marca arriba */}
        <div style={{ opacity: e1, transform: `translateY(${(1 - e1) * -12}px)` }}>
          <div style={{ ...kicker, fontSize: 26 }}>Paraíso Encantado</div>
          <div
            style={{
              width: 64,
              height: 2,
              background: COLORS.gold,
              margin: "22px auto 0",
              opacity: 0.8,
            }}
          />
        </div>

        {/* Gancho central */}
        <div style={{ opacity: e2, transform: `translateY(${(1 - e2) * 24}px)`, maxWidth: 820 }}>
          <p
            style={{
              fontFamily: serif,
              fontWeight: 600,
              color: COLORS.cream,
              fontSize: 86,
              lineHeight: 1.06,
              margin: 0,
              textShadow: "0 4px 30px rgba(0,0,0,0.55)",
            }}
          >
            Lo primero que escuchas no es el tráfico:
            <span style={{ color: COLORS.gold, fontStyle: "italic" }}> son los pájaros.</span>
          </p>
          <p
            style={{
              fontFamily: sans,
              fontWeight: 300,
              color: COLORS.creamDim,
              fontSize: 30,
              lineHeight: 1.5,
              marginTop: 34,
            }}
          >
            Despierta dentro de la selva de la Huasteca, a minutos de Las Pozas.
          </p>
        </div>

        {/* CTA / ubicación abajo */}
        <div style={{ opacity: e3, width: "100%" }}>
          <div style={{ ...kicker, fontSize: 22, color: COLORS.creamDim }}>
            Xilitla · Huasteca Potosina
          </div>
          <div
            style={{
              marginTop: 26,
              display: "inline-block",
              padding: "16px 34px",
              borderRadius: 999,
              border: `1.5px solid ${COLORS.gold}`,
              color: COLORS.cream,
              fontFamily: sans,
              fontWeight: 600,
              fontSize: 26,
              letterSpacing: "0.04em",
            }}
          >
            Reserva directo · paraisoencantado.com
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
