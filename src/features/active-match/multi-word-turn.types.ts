import type {
  TilePremium,
} from "./active-match.types";

export interface PlacedTileDraft {
  id: string;
  letter: string;
  isBlank: boolean;
  premium: TilePremium;
}

export interface ExistingWordLetterDraft {
  id: string;
  source: "EXISTING";
  letter: string;
  isBlank: boolean;
  placedTileId: null;
}

export interface PlacedWordLetterDraft {
  id: string;
  source: "PLACED";
  letter: string;
  isBlank: boolean;
  placedTileId: string;
}

export type FormedWordLetterDraft =
  | ExistingWordLetterDraft
  | PlacedWordLetterDraft;

export interface FormedWordDraft {
  id: string;
  letters: FormedWordLetterDraft[];
}

export interface FormedWordScorePreview {
  wordId: string;
  word: string;
  letterPoints: number;
  wordMultiplier: number;
  points: number;
}

export interface MultiWordTurnScorePreview {
  words: FormedWordScorePreview[];
  bingoBonus: number;
  total: number;
}

export interface MultiWordValidationResult {
  isValid: boolean;
  errors: string[];
}
