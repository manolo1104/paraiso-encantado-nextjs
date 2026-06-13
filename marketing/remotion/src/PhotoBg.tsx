// Fondo de FOTO REAL (de mi-hotel/public/images) con zoom lento "Ken Burns"
// y un degradado oscuro (scrim) para que el texto siempre se lea.
// Las fotos viven en remotion/public/photos/ y se sirven con staticFile().

import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";

type Overlay = "post" | "carousel" | "reel" | "outro";

const SCRIM: Record<Overlay, string> = {
  post: "linear-gradient(180deg, rgba(8,22,17,0.70) 0%, rgba(8,22,17,0.30) 34%, rgba(8,22,17,0.44) 60%, rgba(8,22,17,0.85) 100%)",
  carousel:
    "linear-gradient(180deg, rgba(8,22,17,0.80) 0%, rgba(8,22,17,0.45) 38%, rgba(8,22,17,0.40) 62%, rgba(8,22,17,0.74) 100%)",
  reel: "radial-gradient(125% 75% at 50% 46%, rgba(8,22,17,0.20) 32%, rgba(8,22,17,0.72) 100%)",
  outro: "linear-gradient(180deg, rgba(8,22,17,0.78) 0%, rgba(8,22,17,0.62) 50%, rgba(8,22,17,0.84) 100%)",
};

export const PhotoBg: React.FC<{
  src: string;
  overlay?: Overlay;
  zoom?: boolean;
  zoomFrames?: number; // sobre cuántos frames mapear el zoom (def: duración de la comp)
  fadeIn?: number; // frames para aparecer
  focusX?: number; // object-position %
  focusY?: number;
}> = ({ src, overlay = "reel", zoom = false, zoomFrames, fadeIn = 0, focusX = 50, focusY = 50 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const span = zoomFrames ?? durationInFrames;

  const scale = zoom
    ? interpolate(frame, [0, span], [1.06, 1.2], { extrapolateRight: "clamp" })
    : 1.04;
  const opacity = fadeIn
    ? interpolate(frame, [0, fadeIn], [0, 1], {
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      })
    : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B221B", overflow: "hidden", opacity }}>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <Img
          src={staticFile(`photos/${src}`)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `${focusX}% ${focusY}%`,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: SCRIM[overlay] }} />
    </AbsoluteFill>
  );
};
