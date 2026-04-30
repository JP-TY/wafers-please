export type DefectClass =
  | "particle"
  | "scratch"
  | "bridge"
  | "open"
  | "misalignment"
  | "benign";

export type Disposition = "accept" | "reject" | "rework";

export type FixMiniGamePhase = "idle" | "active" | "success" | "failed";

export interface FixMiniGameTarget {
  id: string;
  x: number;
  y: number;
  radius: number;
  progress: number;
  cleared: boolean;
  windowCenter?: number;
  windowSize?: number;
  drift?: number;
}

export interface FixMiniGameState {
  tool: "micro-polish" | "plasma-clean" | "laser-trim";
  phase: FixMiniGamePhase;
  difficulty: {
    targetCount: number;
    maxMisses: number;
    speed: number;
  };
  progress: number;
  failures: number;
  startedAt: number;
  elapsedMs: number;
  timeLimitMs: number;
  targets: FixMiniGameTarget[];
  currentTargetIndex: number;
  message: string;
}

export interface DefectSpec {
  id: DefectClass;
  label: string;
  killerByDefault: boolean;
  reworkable: boolean;
  description: string;
}

export interface WaferCase {
  id: string;
  defectClass: DefectClass;
  severity: 1 | 2 | 3;
  defectLoad: 1 | 2 | 3 | 4 | 5;
  defectPattern: 1 | 2 | 3 | 4;
  secondaryDefects: Array<{
    defectClass: DefectClass;
    severity: 1 | 2 | 3;
    defectLoad: 1 | 2 | 3 | 4 | 5;
    defectPattern: 1 | 2 | 3 | 4;
  }>;
  reworkEligible: boolean;
  expectedDisposition: Disposition;
}

export interface DayRuleConfig {
  day: number;
  shiftSeconds: number;
  wafersPerShift: number;
  salaryTarget: number;
  competencyTarget: number;
  salary: {
    basePerWafer: number;
    streakBonus: number;
    wrongDecisionFine: number;
    falseAcceptFine: number;
    reworkCost: number;
    skipManualFixFine: number;
  };
  enabledDefects: DefectClass[];
}

export interface ShiftResult {
  processed: number;
  correctDecisions: number;
  falseAccepts: number;
  falseRejects: number;
  reworkAttempts: number;
  reworkSuccesses: number;
  firstTryFixSuccesses: number;
  fixQuizFailures: number;
  maxComboStreak: number;
  salary: number;
  competency: number;
  passedSalaryGate: boolean;
  passedCompetencyGate: boolean;
}
