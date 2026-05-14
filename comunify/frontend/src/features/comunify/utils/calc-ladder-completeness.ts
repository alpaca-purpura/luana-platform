import type { OfferLadder } from "../types/ladder.types";

export interface LadderCompletenessResult {
  score: number; // 0-100
  missingLevels: string[];
  hasConnections: boolean;
  isComplete: boolean;
}

const REQUIRED_LEVELS = ["level_1", "level_2", "level_3", "level_4"] as const;
const LEVEL_LABELS: Record<string, string> = {
  level_1: "Lead Magnet",
  level_2: "Tripwire",
  level_3: "Core",
  level_4: "Premium",
};

export function calcLadderCompleteness(ladder: OfferLadder | undefined): LadderCompletenessResult {
  if (!ladder) {
    return {
      score: 0,
      missingLevels: REQUIRED_LEVELS.map((l) => LEVEL_LABELS[l] ?? l),
      hasConnections: false,
      isComplete: false,
    };
  }

  const presentLevels = new Set<string>();
  if (ladder.level_1) presentLevels.add("level_1");
  if (ladder.level_2) presentLevels.add("level_2");
  if (ladder.level_3) presentLevels.add("level_3");
  if (ladder.level_4) presentLevels.add("level_4");

  const missingLevels = REQUIRED_LEVELS.filter((l) => !presentLevels.has(l)).map(
    (l) => LEVEL_LABELS[l] ?? l
  );

  const levelScore = (presentLevels.size / REQUIRED_LEVELS.length) * 100;
  const score = Math.round(levelScore);

  return {
    score,
    missingLevels,
    hasConnections: false, // TODO T-fe-3 polish post-merge: connections not in type yet
    isComplete: missingLevels.length === 0,
  };
}
