import type {
  SubmitActiveTurnInput,
  TilePremium,
} from "./active-match.types";

import type {
  FormedWordDraft,
  FormedWordLetterDraft,
  FormedWordScorePreview,
  MultiWordTurnScorePreview,
  MultiWordValidationResult,
  PlacedTileDraft,
} from "./multi-word-turn.types";

const LETTER_POINTS:
  Record<string, number> = {
    A: 1,
    B: 3,
    C: 3,
    D: 2,
    E: 1,
    F: 4,
    G: 2,
    H: 4,
    I: 1,
    J: 8,
    K: 5,
    L: 1,
    M: 3,
    N: 1,
    O: 1,
    P: 3,
    Q: 10,
    R: 1,
    S: 1,
    T: 1,
    U: 1,
    V: 4,
    W: 4,
    X: 8,
    Y: 4,
    Z: 10,
  };

function createDraftId(
  prefix: string,
): string {
  if (
    typeof crypto !==
      "undefined" &&
    "randomUUID" in crypto
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return [
    prefix,
    Date.now().toString(36),
    Math.random()
      .toString(36)
      .slice(2, 10),
  ].join("-");
}

export function normalizeTurnLetters(
  input: string,
): string {
  return input
    .replace(
      /[^a-zA-Z]/g,
      "",
    )
    .toUpperCase()
    .slice(0, 7);
}

export function createPlacedTilesFromInput(
  input: string,
  currentTiles:
    PlacedTileDraft[] = [],
): PlacedTileDraft[] {
  const letters =
    normalizeTurnLetters(
      input,
    ).split("");

  return letters.map(
    (
      letter,
      index,
    ) => {
      const currentTile =
        currentTiles[index];

      if (
        currentTile &&
        currentTile.letter ===
          letter
      ) {
        return currentTile;
      }

      return {
        id:
          createDraftId(
            "placed-tile",
          ),

        letter,
        isBlank: false,
        premium: "NONE",
      };
    },
  );
}

export function createPlacedWordDraft(
  placedTiles:
    PlacedTileDraft[],
): FormedWordDraft {
  return {
    id:
      createDraftId(
        "formed-word",
      ),

    letters:
      placedTiles.map(
        (tile) => ({
          id:
            createDraftId(
              "word-letter",
            ),

          source:
            "PLACED",

          letter:
            tile.letter,

          isBlank:
            tile.isBlank,

          placedTileId:
            tile.id,
        }),
      ),
  };
}

export function createExistingLetterDraft(
  letter: string,
  isBlank = false,
): FormedWordLetterDraft {
  return {
    id:
      createDraftId(
        "word-letter",
      ),

    source:
      "EXISTING",

    letter:
      letter
        .trim()
        .toUpperCase()
        .slice(0, 1),

    isBlank,
    placedTileId: null,
  };
}

export function createPlacedLetterDraft(
  tile: PlacedTileDraft,
): FormedWordLetterDraft {
  return {
    id:
      createDraftId(
        "word-letter",
      ),

    source:
      "PLACED",

    letter:
      tile.letter,

    isBlank:
      tile.isBlank,

    placedTileId:
      tile.id,
  };
}

export function createAutomaticFormedWordDraft(
  wordId: string,
  input: string,
  placedTiles:
    PlacedTileDraft[],
): FormedWordDraft {
  const normalizedWord =
    input
      .replace(
        /[^a-zA-Z]/g,
        "",
      )
      .toUpperCase()
      .slice(0, 40);

  const usedPlacedTileIds =
    new Set<string>();

  return {
    id: wordId,

    letters:
      normalizedWord
        .split("")
        .map(
          (
            letter,
            index,
          ) => {
            const matchingTile =
              placedTiles.find(
                (tile) =>
                  tile.letter ===
                    letter &&
                  !usedPlacedTileIds.has(
                    tile.id,
                  ),
              );

            if (matchingTile) {
              usedPlacedTileIds.add(
                matchingTile.id,
              );

              return {
                id:
                  `${wordId}-letter-${index}`,

                source:
                  "PLACED" as const,

                letter:
                  matchingTile.letter,

                isBlank:
                  matchingTile.isBlank,

                placedTileId:
                  matchingTile.id,
              };
            }

            return {
              id:
                `${wordId}-letter-${index}`,

              source:
                "EXISTING" as const,

              letter,

              isBlank: false,

              placedTileId: null,
            };
          },
        ),
  };
}

export function getFormedWordText(
  word: FormedWordDraft,
): string {
  return word.letters
    .map(
      (letter) =>
        letter.letter,
    )
    .join("");
}

function getLetterValue(
  letter: string,
  isBlank: boolean,
): number {
  if (isBlank) {
    return 0;
  }

  return (
    LETTER_POINTS[
      letter.toUpperCase()
    ] ?? 0
  );
}

export function getTilePointValue(
  letter: string,
  isBlank = false,
): number {
  return getLetterValue(
    letter,
    isBlank,
  );
}

function scoreFormedWord(
  word: FormedWordDraft,
  placedTileMap:
    Map<string, PlacedTileDraft>,
): FormedWordScorePreview {
  let letterPoints = 0;
  let wordMultiplier = 1;

  for (
    const wordLetter
    of word.letters
  ) {
    if (
      wordLetter.source ===
      "EXISTING"
    ) {
      letterPoints +=
        getLetterValue(
          wordLetter.letter,
          wordLetter.isBlank,
        );

      continue;
    }

    const placedTile =
      placedTileMap.get(
        wordLetter.placedTileId,
      );

    if (!placedTile) {
      continue;
    }

    const baseValue =
      getLetterValue(
        placedTile.letter,
        placedTile.isBlank,
      );

    switch (
      placedTile.premium
    ) {
      case "DOUBLE_LETTER":
        letterPoints +=
          baseValue * 2;
        break;

      case "TRIPLE_LETTER":
        letterPoints +=
          baseValue * 3;
        break;

      case "DOUBLE_WORD":
        letterPoints +=
          baseValue;
        wordMultiplier *= 2;
        break;

      case "TRIPLE_WORD":
        letterPoints +=
          baseValue;
        wordMultiplier *= 3;
        break;

      default:
        letterPoints +=
          baseValue;
    }
  }

  return {
    wordId:
      word.id,

    word:
      getFormedWordText(
        word,
      ),

    letterPoints,
    wordMultiplier,

    points:
      letterPoints *
      wordMultiplier,
  };
}

export function calculateMultiWordTurnScore(
  placedTiles:
    PlacedTileDraft[],
  formedWords:
    FormedWordDraft[],
): MultiWordTurnScorePreview {
  const placedTileMap =
    new Map(
      placedTiles.map(
        (tile) => [
          tile.id,
          tile,
        ],
      ),
    );

  const words =
    formedWords.map(
      (word) =>
        scoreFormedWord(
          word,
          placedTileMap,
        ),
    );

  const bingoBonus =
    placedTiles.length === 7
      ? 50
      : 0;

  return {
    words,
    bingoBonus,

    total:
      words.reduce(
        (
          total,
          word,
        ) =>
          total +
          word.points,
        bingoBonus,
      ),
  };
}

export function validateMultiWordTurn(
  placedTiles:
    PlacedTileDraft[],
  formedWords:
    FormedWordDraft[],
): MultiWordValidationResult {
  const errors:
    string[] = [];

  if (
    placedTiles.length < 1
  ) {
    errors.push(
      "Enter at least one tile placed during this turn.",
    );
  }

  if (
    placedTiles.length > 7
  ) {
    errors.push(
      "A turn cannot place more than seven tiles.",
    );
  }

  if (
    formedWords.length < 1
  ) {
    errors.push(
      "Add at least one word formed during this turn.",
    );
  }

  if (
    formedWords.length > 15
  ) {
    errors.push(
      "A turn cannot form more than fifteen words.",
    );
  }

  const placedTileMap =
    new Map(
      placedTiles.map(
        (tile) => [
          tile.id,
          tile,
        ],
      ),
    );

  const usedPlacedTileIds =
    new Set<string>();

  const normalizedWords =
    new Set<string>();

  formedWords.forEach(
    (
      word,
      wordIndex,
    ) => {
      const wordNumber =
        wordIndex + 1;

      if (
        word.letters.length < 1
      ) {
        errors.push(
          `Word ${wordNumber} has no letters.`,
        );

        return;
      }

      const wordText =
        getFormedWordText(
          word,
        );

      if (
        !/^[A-Z]+$/.test(
          wordText,
        )
      ) {
        errors.push(
          `Word ${wordNumber} contains an invalid letter.`,
        );
      }

      if (
        normalizedWords.has(
          wordText,
        )
      ) {
        errors.push(
          `${wordText} has been added more than once.`,
        );
      }

      normalizedWords.add(
        wordText,
      );

      const wordPlacedTileIds =
        new Set<string>();

      word.letters.forEach(
        (wordLetter) => {
          if (
            wordLetter.source !==
            "PLACED"
          ) {
            return;
          }

          const placedTile =
            placedTileMap.get(
              wordLetter
                .placedTileId,
            );

          if (!placedTile) {
            errors.push(
              `${wordText} references a tile that is no longer in Tiles Placed.`,
            );

            return;
          }

          if (
            placedTile.letter !==
            wordLetter.letter
          ) {
            errors.push(
              `${wordText} contains a new letter that does not match its placed tile.`,
            );
          }

          if (
            wordPlacedTileIds.has(
              placedTile.id,
            )
          ) {
            errors.push(
              `${wordText} uses the same placed tile more than once.`,
            );
          }

          wordPlacedTileIds.add(
            placedTile.id,
          );

          usedPlacedTileIds.add(
            placedTile.id,
          );
        },
      );

      if (
        wordPlacedTileIds.size === 0
      ) {
        errors.push(
          `${wordText} must use at least one newly placed tile.`,
        );
      }
    },
  );

  placedTiles.forEach(
    (tile) => {
      if (
        !usedPlacedTileIds.has(
          tile.id,
        )
      ) {
        errors.push(
          `The placed ${tile.letter} tile is not used in any formed word.`,
        );
      }
    },
  );

  return {
    isValid:
      errors.length === 0,

    errors,
  };
}

export function buildMultiWordTurnInput(
  playerId: string,
  placedTiles:
    PlacedTileDraft[],
  formedWords:
    FormedWordDraft[],
): SubmitActiveTurnInput {
  const validation =
    validateMultiWordTurn(
      placedTiles,
      formedWords,
    );

  if (!validation.isValid) {
    throw new Error(
      validation.errors[0] ??
        "The turn setup is incomplete.",
    );
  }

  return {
    playerId,

    placedTiles:
      placedTiles.map(
        (tile) => ({
          id: tile.id,
          letter:
            tile.letter,
          isBlank:
            tile.isBlank,
          premium:
            tile.premium,
        }),
      ),

    words:
      formedWords.map(
        (word) => ({
          tiles:
            word.letters.map(
              (letter) => {
                if (
                  letter.source ===
                  "PLACED"
                ) {
                  return {
                    source:
                      "PLACED" as const,

                    placedTileId:
                      letter
                        .placedTileId,
                  };
                }

                return {
                  source:
                    "EXISTING" as const,

                  letter:
                    letter.letter,

                  isBlank:
                    letter.isBlank,
                };
              },
            ),
        }),
      ),
  };
}

export function getPremiumLabel(
  premium:
    TilePremium,
): string | null {
  switch (premium) {
    case "DOUBLE_LETTER":
      return "DL";

    case "TRIPLE_LETTER":
      return "TL";

    case "DOUBLE_WORD":
      return "DW";

    case "TRIPLE_WORD":
      return "TW";

    default:
      return null;
  }
}
