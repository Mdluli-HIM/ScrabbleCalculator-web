"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Trash2,
} from "lucide-react";

import type {
  SubmitActiveTurnInput,
  TilePremium,
} from "@/features/active-match/active-match.types";

import type {
  FormedWordDraft,
  PlacedTileDraft,
} from "@/features/active-match/multi-word-turn.types";

import {
  buildMultiWordTurnInput,
  calculateMultiWordTurnScore,
  createAutomaticFormedWordDraft,
  createPlacedTilesFromInput,
  getFormedWordText,
  getPremiumLabel,
  getTilePointValue,
  normalizeTurnLetters,
  validateMultiWordTurn,
} from "@/features/active-match/multi-word-turn.utils";

import styles from "./multi-word-turn-workflow.module.css";

const PREMIUM_OPTIONS: Array<{
  value: Exclude<
    TilePremium,
    "NONE"
  >;
  label: string;
}> = [
  {
    value: "DOUBLE_LETTER",
    label: "DL",
  },
  {
    value: "TRIPLE_LETTER",
    label: "TL",
  },
  {
    value: "DOUBLE_WORD",
    label: "DW",
  },
  {
    value: "TRIPLE_WORD",
    label: "TW",
  },
];

interface WordInputDraft {
  id: string;
  value: string;
}

interface MultiWordTurnWorkflowProps {
  currentPlayerId: string;
  isSubmitting: boolean;

  onSubmit: (
    input: SubmitActiveTurnInput,
  ) => Promise<void>;
}

function createId(
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

function normalizeWord(
  value: string,
): string {
  return value
    .replace(
      /[^a-zA-Z]/g,
      "",
    )
    .toUpperCase()
    .slice(0, 40);
}

function wordUsesPlacedTile(
  word: FormedWordDraft,
): boolean {
  return word.letters.some(
    (letter) =>
      letter.source ===
      "PLACED",
  );
}

function getUsedTiles(
  word: FormedWordDraft,
  placedTiles:
    PlacedTileDraft[],
): PlacedTileDraft[] {
  const usedIds =
    new Set(
      word.letters.flatMap(
        (letter) =>
          letter.source ===
          "PLACED"
            ? [
                letter
                  .placedTileId,
              ]
            : [],
      ),
    );

  return placedTiles.filter(
    (tile) =>
      usedIds.has(tile.id),
  );
}

export function MultiWordTurnWorkflow({
  currentPlayerId,
  isSubmitting,
  onSubmit,
}: MultiWordTurnWorkflowProps) {
  const [
    tileInput,
    setTileInput,
  ] = useState("");

  const [
    placedTiles,
    setPlacedTiles,
  ] = useState<
    PlacedTileDraft[]
  >([]);

  const [
    words,
    setWords,
  ] = useState<
    WordInputDraft[]
  >([
    {
      id: "main-word",
      value: "",
    },
  ]);

  const [
    selectedTileIndex,
    setSelectedTileIndex,
  ] = useState(0);

  const [
    message,
    setMessage,
  ] = useState<
    string | null
  >(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<
    string | null
  >(null);

  const formedWords =
    useMemo(
      () =>
        words
          .filter(
            (word) =>
              word.value.length > 0,
          )
          .map(
            (word) =>
              createAutomaticFormedWordDraft(
                word.id,
                word.value,
                placedTiles,
              ),
          ),
      [
        placedTiles,
        words,
      ],
    );

  const scorePreview =
    useMemo(
      () =>
        calculateMultiWordTurnScore(
          placedTiles,
          formedWords,
        ),
      [
        formedWords,
        placedTiles,
      ],
    );

  const validation =
    useMemo(
      () =>
        validateMultiWordTurn(
          placedTiles,
          formedWords,
        ),
      [
        formedWords,
        placedTiles,
      ],
    );

  const wordsWithoutNewTiles =
    formedWords.filter(
      (word) =>
        !wordUsesPlacedTile(
          word,
        ),
    );

  const selectedTile =
    placedTiles[
      selectedTileIndex
    ];

  const activePremiums =
    placedTiles.filter(
      (tile) =>
        tile.premium !==
        "NONE",
    );

  const canSubmit =
    validation.isValid &&
    wordsWithoutNewTiles.length ===
      0 &&
    !isSubmitting;

  function resetMessages():
    void {
    setMessage(null);
    setErrorMessage(null);
  }

  function updatePlacedTiles(
    value: string,
  ): void {
    const normalized =
      normalizeTurnLetters(
        value,
      );

    const nextTiles =
      createPlacedTilesFromInput(
        normalized,
        placedTiles,
      );

    setTileInput(normalized);
    setPlacedTiles(nextTiles);

    setSelectedTileIndex(
      (current) =>
        nextTiles.length === 0
          ? 0
          : Math.min(
              current,
              nextTiles.length -
                1,
            ),
    );

    resetMessages();
  }

  function clearTurn():
    void {
    setTileInput("");
    setPlacedTiles([]);

    setWords([
      {
        id: "main-word",
        value: "",
      },
    ]);

    setSelectedTileIndex(0);
    resetMessages();
  }

  function applyPremium(
    premium:
      Exclude<
        TilePremium,
        "NONE"
      >,
  ): void {
    if (!selectedTile) {
      setMessage(
        "Select a placed tile first.",
      );

      return;
    }

    setPlacedTiles(
      (current) =>
        current.map(
          (
            tile,
            index,
          ) =>
            index ===
            selectedTileIndex
              ? {
                  ...tile,

                  premium:
                    tile.premium ===
                    premium
                      ? "NONE"
                      : premium,
                }
              : tile,
        ),
    );

    resetMessages();
  }

  function updateWord(
    wordId: string,
    value: string,
  ): void {
    const normalized =
      normalizeWord(value);

    setWords(
      (current) =>
        current.map(
          (word) =>
            word.id ===
            wordId
              ? {
                  ...word,
                  value:
                    normalized,
                }
              : word,
        ),
    );

    resetMessages();
  }

  function addWord():
    void {
    if (
      words.length >= 15
    ) {
      setMessage(
        "A turn can contain a maximum of fifteen words.",
      );

      return;
    }

    setWords(
      (current) => [
        ...current,

        {
          id:
            createId(
              "connected-word",
            ),

          value: "",
        },
      ],
    );

    resetMessages();
  }

  function removeWord(
    wordId: string,
  ): void {
    setWords(
      (current) =>
        current.filter(
          (word) =>
            word.id !==
            wordId,
        ),
    );

    resetMessages();
  }

  async function submitTurn():
    Promise<void> {
    if (
      wordsWithoutNewTiles.length >
      0
    ) {
      setErrorMessage(
        `${getFormedWordText(
          wordsWithoutNewTiles[0],
        )} must contain at least one newly placed tile.`,
      );

      return;
    }

    if (!validation.isValid) {
      setErrorMessage(
        validation.errors[0] ??
          "Complete the turn before submitting it.",
      );

      return;
    }

    try {
      const input =
        buildMultiWordTurnInput(
          currentPlayerId,
          placedTiles,
          formedWords,
        );

      resetMessages();

      await onSubmit(input);

      clearTurn();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The turn could not be submitted.",
      );
    }
  }

  const actionLabel =
    formedWords.length <= 1
      ? "Validate & Score Word"
      : `Validate & Score ${formedWords.length} Words`;

  return (
    <div
      className={styles.workflow}
    >
      <section
        className={styles.card}
      >
        <div
          className={styles.cardHeader}
        >
          <span>
            Tiles Placed
          </span>

          <strong>
            {placedTiles.length}/7
            {" "}
            tiles
          </strong>
        </div>

        <div
          className={styles.inputShell}
        >
          <input
            type="text"
            value={tileInput}
            placeholder="Type tiles here..."
            disabled={isSubmitting}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            onChange={(
              event,
            ) => {
              updatePlacedTiles(
                event.target.value,
              );
            }}
          />

          <button
            type="button"
            disabled={
              !tileInput ||
              isSubmitting
            }
            onClick={clearTurn}
          >
            Clear
          </button>
        </div>

        {placedTiles.length > 0 ? (
          <div
            className={styles.placedTiles}
          >
            {placedTiles.map(
              (
                tile,
                index,
              ) => (
                <button
                  type="button"
                  key={tile.id}
                  className={
                    selectedTileIndex ===
                    index
                      ? styles.selectedTile
                      : ""
                  }
                  onClick={() => {
                    setSelectedTileIndex(
                      index,
                    );
                  }}
                >
                  <strong>
                    {tile.letter}
                  </strong>

                  <small>
                    {getPremiumLabel(
                      tile.premium,
                    ) ??
                      getTilePointValue(
                        tile.letter,
                        tile.isBlank,
                      )}
                  </small>
                </button>
              ),
            )}
          </div>
        ) : null}

        <p
          className={styles.helperText}
        >
          Select a placed tile and
          apply its board bonus.
        </p>

        <div
          className={styles.premiumButtons}
        >
          {PREMIUM_OPTIONS.map(
            (option) => (
              <button
                type="button"
                key={option.value}
                className={
                  selectedTile
                    ?.premium ===
                  option.value
                    ? styles.activePremium
                    : ""
                }
                disabled={
                  !selectedTile ||
                  isSubmitting
                }
                onClick={() => {
                  applyPremium(
                    option.value,
                  );
                }}
              >
                {option.label}
              </button>
            ),
          )}
        </div>
      </section>

      <section
        className={styles.card}
      >
        <div
          className={styles.cardHeader}
        >
          <span>
            Multipliers Applied
          </span>
        </div>

        {activePremiums.length >
        0 ? (
          <div
            className={styles.multiplierImpactList}
          >
            {activePremiums.map(
              (tile) => {
                const affectedWords =
                  formedWords
                    .filter(
                      (word) =>
                        word.letters.some(
                          (letter) =>
                            letter.source ===
                              "PLACED" &&
                            letter
                              .placedTileId ===
                              tile.id,
                        ),
                    )
                    .map(
                      (word) =>
                        getFormedWordText(
                          word,
                        ),
                    );

                return (
                  <article
                    key={tile.id}
                    className={styles.multiplierImpact}
                  >
                    <strong>
                      {getPremiumLabel(
                        tile.premium,
                      )}
                      {" "}on{" "}
                      {tile.letter}
                    </strong>

                    <span>
                      {affectedWords.length >
                      0
                        ? `Applies to: ${affectedWords.join(", ")}`
                        : "Add a word containing this tile."}
                    </span>
                  </article>
                );
              },
            )}
          </div>
        ) : (
          <p
            className={styles.emptyPremiums}
          >
            No multipliers applied.
          </p>
        )}

        <div
          className={styles.bingoRow}
        >
          <strong>
            7-Letter Bonus
            {" "}
            (+50 pts)
          </strong>

          <span
            className={`${styles.toggle} ${
              placedTiles.length ===
              7
                ? styles.toggleActive
                : ""
            }`}
          >
            <span />
          </span>
        </div>
      </section>

      <section
        className={styles.card}
      >
        <div
          className={styles.cardHeader}
        >
          <span>
            Words Created
          </span>

          <strong
            className={styles.countBadge}
          >
            {formedWords.length}
          </strong>
        </div>

        <div
          className={styles.wordInputList}
        >
          {words.map(
            (
              word,
              index,
            ) => {
              const formedWord =
                formedWords.find(
                  (candidate) =>
                    candidate.id ===
                    word.id,
                );

              const usedTiles =
                formedWord
                  ? getUsedTiles(
                      formedWord,
                      placedTiles,
                    )
                  : [];

              return (
                <article
                  key={word.id}
                  className={styles.wordInputItem}
                >
                  <div
                    className={styles.wordInputTop}
                  >
                    <label
                      htmlFor={word.id}
                    >
                      {index === 0
                        ? "Main Word"
                        : `Additional Word ${index}`}
                    </label>

                    {index > 0 ? (
                      <button
                        type="button"
                        className={styles.removeWordButton}
                        onClick={() => {
                          removeWord(
                            word.id,
                          );
                        }}
                      >
                        <Trash2 />
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div
                    className={styles.wordInputShell}
                  >
                    <input
                      id={word.id}
                      type="text"
                      value={
                        word.value
                      }
                      placeholder={
                        index === 0
                          ? "BANKS"
                          : "SPIDER"
                      }
                      disabled={
                        isSubmitting
                      }
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      onChange={(
                        event,
                      ) => {
                        updateWord(
                          word.id,
                          event.target
                            .value,
                        );
                      }}
                    />
                  </div>

                  {word.value ? (
                    <p
                      className={styles.wordUsage}
                    >
                      {usedTiles.length >
                      0
                        ? `New tiles detected: ${usedTiles
                            .map(
                              (tile) =>
                                tile.letter,
                            )
                            .join(", ")}`
                        : "No newly placed tile detected."}
                    </p>
                  ) : null}
                </article>
              );
            },
          )}
        </div>

        <button
          type="button"
          className={styles.addWordButton}
          disabled={
            placedTiles.length ===
              0 ||
            words.length >= 15 ||
            isSubmitting
          }
          onClick={addWord}
        >
          <Plus />
          Add Another Word
        </button>
      </section>

      <section
        className={styles.card}
      >
        <div
          className={styles.cardHeader}
        >
          <span>
            Score Breakdown
          </span>
        </div>

        <div
          className={styles.scoreBreakdown}
        >
          {scorePreview.words.map(
            (word) => (
              <div
                key={word.wordId}
              >
                <span>
                  {word.word}
                  {word.wordMultiplier >
                  1
                    ? ` (${word.wordMultiplier}× word)`
                    : ""}
                </span>

                <strong>
                  {word.points}
                  {" "}pts
                </strong>
              </div>
            ),
          )}

          <div>
            <span>
              7-Letter Bonus
            </span>

            <strong>
              {scorePreview.bingoBonus}
              {" "}pts
            </strong>
          </div>

          <div
            className={styles.totalRow}
          >
            <span>
              Turn Score
            </span>

            <strong>
              {scorePreview.total}
              {" "}pts
            </strong>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <p
          className={styles.errorMessage}
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      {message ? (
        <p
          className={styles.noticeMessage}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <button
        type="button"
        className={styles.submitButton}
        disabled={!canSubmit}
        onClick={() => {
          void submitTurn();
        }}
      >
        {isSubmitting
          ? "Validating Words..."
          : actionLabel}
      </button>
    </div>
  );
}
