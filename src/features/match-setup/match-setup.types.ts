export type MatchSetupPlayerCount =
  | 2
  | 3
  | 4;

export type MatchSetupDictionaryPolicy =
  "LOCAL_WORD_LIST";

export interface MatchSetupPlayerDraft {
  clientId: string;
  displayName: string;
  serverPlayerId: string | null;
}

export interface MatchSetupDraft {
  matchName: string;
  playerCount:
    MatchSetupPlayerCount | null;
  dictionaryPolicy:
    MatchSetupDictionaryPolicy;
  matchId: string | null;
  players?: MatchSetupPlayerDraft[];
  updatedAt: string;
}

export interface MatchSetupApiPlayer {
  id: string;
  source:
    | "LOCAL"
    | "REGISTERED_USER"
    | "GUEST_PLAYER";
  displayName: string;
  seatNumber: number;
  turnOrder: number;
  createdAt?: string;
}

export interface MatchSetupApiMatch {
  id: string;
  name: string | null;
  status:
    | "DRAFT"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";
  dictionaryPolicy:
    MatchSetupDictionaryPolicy;
  playerCount: number;
  players: MatchSetupApiPlayer[];
}
