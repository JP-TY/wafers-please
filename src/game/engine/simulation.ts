import { defectCatalog } from "@/game/config/defects";
import type {
  DayRuleConfig,
  DefectClass,
  Disposition,
  WaferCase
} from "@/game/types";

function hashString(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededFloat(seed: string): number {
  const hashed = hashString(seed);
  return (hashed % 10000) / 10000;
}

function randomDefect(seed: string, defectPool: DefectClass[]): DefectClass {
  const index = Math.floor(seededFloat(seed) * defectPool.length);
  return defectPool[index] ?? "benign";
}

function generateDefectProfile(seed: string, defectPool: DefectClass[], simplifyForDayOne: boolean) {
  const defectClass = randomDefect(`${seed}-class`, defectPool);
  const severity = (Math.floor(seededFloat(`${seed}-sev`) * (simplifyForDayOne ? 2 : 3)) + 1) as 1 | 2 | 3;
  const defectPattern = (Math.floor(seededFloat(`${seed}-pattern`) * 4) + 1) as 1 | 2 | 3 | 4;
  const defectLoad = Math.min(
    5,
    Math.max(1, severity + Math.floor(seededFloat(`${seed}-load`) * (simplifyForDayOne ? 2 : 3)) - 1)
  ) as 1 | 2 | 3 | 4 | 5;
  return { defectClass, severity, defectPattern, defectLoad };
}

function expectedDispositionFor(
  defectClass: DefectClass,
  severity: number,
  reworkEligible: boolean,
  defectLoad: number
): Disposition {
  const meta = defectCatalog[defectClass];
  if (defectClass === "benign" || (severity === 1 && defectLoad <= 2)) {
    return "accept";
  }
  if (severity === 3 || defectLoad >= 5) {
    return "reject";
  }
  if (meta.killerByDefault && (severity >= 2 || defectLoad >= 4)) {
    return "reject";
  }
  if (meta.reworkable && (defectLoad >= 3 || severity >= 2) && !reworkEligible) {
    return "reject";
  }
  return "accept";
}

export function generateWaferCase(
  config: DayRuleConfig,
  index: number,
  scenarioSeed: string
): WaferCase {
  const localSeed = `${scenarioSeed}-${config.day}-${index}`;
  const simplifyForDayOne = config.day === 1;
  let primary = generateDefectProfile(`${localSeed}-primary`, config.enabledDefects, simplifyForDayOne);
  if (simplifyForDayOne && index === 1) {
    // Guarantee an early shift wafer that demonstrates the repair workflow.
    primary = {
      ...primary,
      defectClass: "scratch",
      severity: 2,
      defectLoad: 3
    };
  }
  const secondaryRoll = seededFloat(`${localSeed}-secondary-count`);
  const secondaryCount = simplifyForDayOne
    ? (secondaryRoll > 0.94 ? 1 : 0)
    : secondaryRoll > 0.58
      ? (secondaryRoll > 0.82 ? 2 : 1)
      : 0;
  const secondaryDefects = Array.from({ length: secondaryCount }).map((_, idx) =>
    generateDefectProfile(`${localSeed}-secondary-${idx}`, config.enabledDefects, simplifyForDayOne)
  );
  const allDefects = [primary, ...secondaryDefects];
  const maxSeverity = Math.max(...allDefects.map((d) => d.severity));
  const maxLoad = Math.max(...allDefects.map((d) => d.defectLoad));
  const hasKillerSecondary = allDefects.some((d) => defectCatalog[d.defectClass].killerByDefault);
  let reworkEligible =
    (defectCatalog[primary.defectClass].reworkable || secondaryDefects.some((d) => defectCatalog[d.defectClass].reworkable)) &&
    (maxSeverity >= 2 || maxLoad >= 3) &&
    seededFloat(`${localSeed}-rw`) > 0.25 &&
    maxSeverity < 3 &&
    maxLoad < 5 &&
    !hasKillerSecondary;
  if (simplifyForDayOne && index === 1 && defectCatalog[primary.defectClass].reworkable) {
    reworkEligible = true;
  }
  const expectedDisposition = expectedDispositionFor(primary.defectClass, maxSeverity, reworkEligible, maxLoad);

  return {
    id: `W-${config.day}-${index + 1}`,
    defectClass: primary.defectClass,
    severity: primary.severity,
    defectLoad: primary.defectLoad,
    defectPattern: primary.defectPattern,
    secondaryDefects,
    reworkEligible,
    expectedDisposition
  };
}
