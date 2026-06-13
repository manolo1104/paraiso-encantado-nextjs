import "./index.css";
import React from "react";
import { Composition } from "remotion";
import { Post } from "./Post";
import { CarouselSlide, SLIDES } from "./CarouselSlide";
import { Reel, REEL_DURATION } from "./Reel";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* POST — feed 4:5 */}
      <Composition
        id="Post"
        component={Post}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1350}
      />

      {/* CARRUSEL — 7 láminas (portada, 5 maravillas, CTA) */}
      {SLIDES.map((s) => (
        <Composition
          key={s.index}
          id={`Carrusel-${s.index}`}
          component={CarouselSlide}
          durationInFrames={90}
          fps={30}
          width={1080}
          height={1350}
          defaultProps={s}
        />
      ))}

      {/* REEL — vertical 9:16 */}
      <Composition
        id="Reel"
        component={Reel}
        durationInFrames={REEL_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
