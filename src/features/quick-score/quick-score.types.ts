export type QuickScoreGameStatus =
  | "IN_PROGRESS"
  | "COMPLETED";

export interface QuickScorePlayer {
  id: string;
  name: string;
  score: number;
  turnOrder: number;
}

export interface QuickScoreTurn {
  id: string;
  turnNumber: number;
  playerId: string;
  playerName: string;
  points: number;
  createdAt: string;
}

export interface QuickScoreGame {
  id: string;
  status: QuickScoreGameStatus;
  players: QuickScorePlayer[];
  currentPlayerIndex: number;
  turns: QuickScoreTurn[];
  createdAt: string;
  completedAt: string | null;
}
