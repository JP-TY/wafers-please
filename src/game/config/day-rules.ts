import { day1Rules } from "@/game/config/day1-rules";
import { day2Rules } from "@/game/config/day2-rules";
import { day3Rules } from "@/game/config/day3-rules";
import type { DayRuleConfig } from "@/game/types";

export const dayRulesByDay: Record<number, DayRuleConfig> = {
  1: day1Rules,
  2: day2Rules,
  3: day3Rules
};

export function getDayRules(day: number): DayRuleConfig {
  return dayRulesByDay[day] ?? day3Rules;
}
