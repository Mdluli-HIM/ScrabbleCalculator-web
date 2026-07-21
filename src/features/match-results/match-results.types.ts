import type {
  ActiveMatch,
} from "@/features/active-match/active-match.types";

export type MatchEndReason =
  | "PLAYER_EMPTIED_RACK"
  | "STALEMATE";

export interface MatchResultPlayerReference {
  playerId: string;
  displayName: string;
}

export interface MatchResultRackTile {
  letter: string;
  isBlank: boolean;
  value: number;
}

export interface MatchResultStanding {
  playerId: string;
  displayName: string;
  turnOrder: number;

  baseScore: number;
  rackTileCount: number;
  rackDeduction: number;
  finishingBonus: number;
  finalScore: number;

  rank: number;
  isWinner: boolean;

  remainingRack:
    MatchResultRackTile[];
}

export interface MatchResultHighlightTurn {
  playerId: string;
  displayName: string;
  turnNumber: number;
  points: number;
}

export interface MatchResultHighlightWord {
  playerId: string;
  displayName: string;
  turnNumber: number;
  word: string;
  points: number;
}

export interface MatchExperienceEventCounts {
  total: number;
  leadChanges: number;
  sharedLeads: number;
  rankRises: number;
  comebacks: number;
  momentumShifts: number;
}

export interface MatchResultHighlights {
  totalTurns: number;
  totalWords: number;
  bingoCount: number;

  highestScoringTurn:
    MatchResultHighlightTurn | null;

  highestScoringWord:
    MatchResultHighlightWord | null;

  experienceEvents:
    MatchExperienceEventCounts;
}

export interface CompletedMatchResult {
  matchId: string;
  status: "COMPLETED";
  reason: MatchEndReason;
  finishingPlayerId: string | null;
  completedAt: string;

  totalRackDeduction: number;
  hasSharedWin: boolean;

  winners:
    MatchResultPlayerReference[];

  podium:
    MatchResultStanding[];

  standings:
    MatchResultStanding[];

  highlights?:
    MatchResultHighlights;
}

export interface MatchResultsBundle {
  match: ActiveMatch;
  result: CompletedMatchResult;
}
