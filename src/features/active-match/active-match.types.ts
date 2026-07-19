export type ActiveMatchStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type ActiveDictionaryPolicy =
  | "LOCAL_WORD_LIST"
  | "OXFORD_ONLY"
  | "TOURNAMENT_LEXICON_ONLY"
  | "BOTH_REQUIRED"
  | "EITHER_ACCEPTED";

export type ActiveMatchPlayerSource =
  | "REGISTERED_USER"
  | "GUEST_PLAYER"
  | "LOCAL";

export type TilePremium =
  | "NONE"
  | "DOUBLE_LETTER"
  | "TRIPLE_LETTER"
  | "DOUBLE_WORD"
  | "TRIPLE_WORD";

export interface ActiveDictionaryLexicon {
  code: string;
  version: string;
  name: string;
}

export interface ActiveMatchPlayer {
  id: string;
  source: ActiveMatchPlayerSource;
  registeredUserId: string | null;
  guestPlayerId: string | null;
  displayName: string;
  seatNumber: number;
  turnOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveMatch {
  id: string;
  name: string | null;
  status: ActiveMatchStatus;
  dictionaryPolicy:
    ActiveDictionaryPolicy;
  dictionaryLexicon:
    ActiveDictionaryLexicon | null;
  ownerType:
    | "REGISTERED_USER"
    | "GUEST_SESSION";
  currentTurnOrder: number | null;
  currentPlayer:
    ActiveMatchPlayer | null;
  playerCount: number;
  canEdit: boolean;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  players: ActiveMatchPlayer[];
}

export interface ActiveTurnPlayer {
  id: string;
  displayName: string;
  turnOrder: number;
}

export interface ActiveTurnWord {
  wordOrder: number;
  word: string;
  letterPoints: number;
  wordMultiplier: number;
  points: number;
}

export interface ActiveTurn {
  id: string;
  matchId: string;
  turnNumber: number;
  player: ActiveTurnPlayer;
  wordPoints: number;
  bingoBonus: number;
  points: number;
  placedTileCount: number;
  replacementTileCount: number;
  words: ActiveTurnWord[];
  createdAt: string;
}

export interface SubmitActiveTurnResult {
  turn: ActiveTurn;
  nextPlayer: ActiveTurnPlayer;
  replayed: boolean;
  experience: unknown;
}

export interface ActivePlacedTile {
  id: string;
  letter: string;
  isBlank: boolean;
  premium: TilePremium;
}

export interface ActivePlacedWordTile {
  source: "PLACED";
  placedTileId: string;
}

export interface ActiveExistingWordTile {
  source: "EXISTING";
  letter: string;
  isBlank: boolean;
}

export interface SubmitActiveTurnInput {
  playerId: string;

  placedTiles:
    ActivePlacedTile[];

  words: Array<{
    tiles: Array<
      | ActivePlacedWordTile
      | ActiveExistingWordTile
    >;
  }>;
}
