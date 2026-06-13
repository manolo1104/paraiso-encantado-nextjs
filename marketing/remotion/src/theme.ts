// Sistema de marca — Hotel Paraíso Encantado
// Tipografías del SITIO WEB: Cormorant Garamond (serif) + Jost (sans).

import { loadFont as loadSerif } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadSans } from "@remotion/google-fonts/Jost";

export const serif = loadSerif("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
}).fontFamily;

// Cargar también la itálica (acentos elegantes)
loadSerif("italic", { weights: ["500", "600"], subsets: ["latin"] });

export const sans = loadSans("normal", {
  weights: ["300", "400", "500", "600"],
  subsets: ["latin"],
}).fontFamily;

export const COLORS = {
  green900: "#0B221B",
  green800: "#0F2E24",
  green700: "#15412F",
  green600: "#1E5C45",
  green500: "#2C7A5B",
  cream: "#F4EFE3",
  creamDim: "rgba(244,239,227,0.72)",
  gold: "#C9A86A",
};

// Texto en mayúsculas espaciadas (estilo "kicker" editorial) — Jost
export const kicker = {
  fontFamily: sans,
  fontWeight: 500,
  letterSpacing: "0.34em",
  textTransform: "uppercase" as const,
  color: COLORS.gold,
};
