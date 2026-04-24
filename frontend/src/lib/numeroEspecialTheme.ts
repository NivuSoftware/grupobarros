import type { NumeroEspecialColor, TipoNumeroEspecial } from "./api";

export interface NumeroEspecialColorTheme {
  key: NumeroEspecialColor;
  adminLabel: string;
  badgeSingular: string;
  badgePlural: string;
  colorName: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  accentGlow: string;
  cardBackground: string;
  imageOverlay: string;
  /** Override color for the large number display (defaults to accent) */
  numberColor?: string;
  /** Neon text-shadow for the large number display */
  numberGlow?: string;
  /** Override background for the top badge chip (defaults to accentStrong→accent gradient) */
  chipBackground?: string;
}

export const NUMERO_ESPECIAL_COLOR_OPTIONS: NumeroEspecialColorTheme[] = [
  {
    key: "ORANGE",
    adminLabel: "Naranja · Orange Number",
    badgeSingular: "Orange Number",
    badgePlural: "Orange Numbers",
    colorName: "naranja",
    accent: "#ff9822",
    accentStrong: "#ff6a00",
    accentSoft: "rgba(255, 152, 34, 0.22)",
    accentGlow: "rgba(255, 140, 0, 0.42)",
    cardBackground: "linear-gradient(135deg, rgba(255, 106, 0, 0.16), rgba(255, 186, 73, 0.06))",
    imageOverlay: "linear-gradient(135deg, rgba(255, 106, 0, 0.92), transparent)",
  },
  {
    key: "BLACK",
    adminLabel: "Negro · Black Number",
    badgeSingular: "Black Number",
    badgePlural: "Black Numbers",
    colorName: "negro",
    accent: "#ffffff",
    accentStrong: "#e4e4e7",
    accentSoft: "rgba(255, 255, 255, 0.18)",
    accentGlow: "rgba(255, 255, 255, 0.18)",
    cardBackground: "linear-gradient(135deg, rgba(255, 255, 255, 0.10), rgba(24, 24, 27, 0.55))",
    imageOverlay: "linear-gradient(135deg, rgba(17, 17, 17, 0.88), transparent)",
    numberColor: "#ffffff",
    numberGlow: "0 0 2px #000, 0 0 6px rgba(160,160,170,0.9), 0 0 16px rgba(120,120,135,0.7), 0 0 32px rgba(80,80,95,0.5), 1px 1px 0 #1a1a1f, -1px -1px 0 #1a1a1f",
    chipBackground: "linear-gradient(135deg, #111111 0%, #2f2f35 100%)",
  },
  {
    key: "GREEN",
    adminLabel: "Verde · Green Number",
    badgeSingular: "Green Number",
    badgePlural: "Green Numbers",
    colorName: "verde",
    accent: "#22c55e",
    accentStrong: "#15803d",
    accentSoft: "rgba(34, 197, 94, 0.22)",
    accentGlow: "rgba(34, 197, 94, 0.32)",
    cardBackground: "linear-gradient(135deg, rgba(21, 128, 61, 0.16), rgba(74, 222, 128, 0.06))",
    imageOverlay: "linear-gradient(135deg, rgba(21, 128, 61, 0.92), transparent)",
  },
  {
    key: "BLUE",
    adminLabel: "Azul · Blue Number",
    badgeSingular: "Blue Number",
    badgePlural: "Blue Numbers",
    colorName: "azul",
    accent: "#38bdf8",
    accentStrong: "#2563eb",
    accentSoft: "rgba(56, 189, 248, 0.22)",
    accentGlow: "rgba(59, 130, 246, 0.28)",
    cardBackground: "linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(56, 189, 248, 0.06))",
    imageOverlay: "linear-gradient(135deg, rgba(37, 99, 235, 0.92), transparent)",
  },
  {
    key: "RED",
    adminLabel: "Rojo · Red Number",
    badgeSingular: "Red Number",
    badgePlural: "Red Numbers",
    colorName: "rojo",
    accent: "#f87171",
    accentStrong: "#dc2626",
    accentSoft: "rgba(248, 113, 113, 0.22)",
    accentGlow: "rgba(220, 38, 38, 0.28)",
    cardBackground: "linear-gradient(135deg, rgba(220, 38, 38, 0.16), rgba(248, 113, 113, 0.06))",
    imageOverlay: "linear-gradient(135deg, rgba(220, 38, 38, 0.92), transparent)",
  },
];

const NUMERO_ESPECIAL_THEME_MAP: Record<NumeroEspecialColor, NumeroEspecialColorTheme> =
  NUMERO_ESPECIAL_COLOR_OPTIONS.reduce((acc, option) => {
    acc[option.key] = option;
    return acc;
  }, {} as Record<NumeroEspecialColor, NumeroEspecialColorTheme>);

export function getNumeroEspecialColorTheme(color?: NumeroEspecialColor | null) {
  return NUMERO_ESPECIAL_THEME_MAP[color ?? "ORANGE"] ?? NUMERO_ESPECIAL_THEME_MAP.ORANGE;
}

export function getNumeroEspecialBadgeLabel(tipo: TipoNumeroEspecial, color?: NumeroEspecialColor | null) {
  if (tipo === "ORO") return "ORO";
  return getNumeroEspecialColorTheme(color).badgeSingular.toUpperCase();
}
