import type { DefectSpec } from "@/game/types";

export const defectCatalog: Record<string, DefectSpec> = {
  particle: {
    id: "particle",
    label: "Particle",
    killerByDefault: false,
    reworkable: true,
    description: "Surface contamination that may be removable."
  },
  scratch: {
    id: "scratch",
    label: "Scratch",
    killerByDefault: false,
    reworkable: true,
    description: "Surface abrasion; deep tracks become reject."
  },
  bridge: {
    id: "bridge",
    label: "Pattern Bridge",
    killerByDefault: true,
    reworkable: false,
    description: "Potential short between patterned features."
  },
  open: {
    id: "open",
    label: "Pattern Open",
    killerByDefault: true,
    reworkable: false,
    description: "Likely break in circuit continuity."
  },
  misalignment: {
    id: "misalignment",
    label: "Misalignment",
    killerByDefault: false,
    reworkable: true,
    description: "Overlay-style shift in pattern registration."
  },
  benign: {
    id: "benign",
    label: "Benign Variance",
    killerByDefault: false,
    reworkable: false,
    description: "Non-critical cosmetic variation within tolerance."
  }
};
