"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Trash2,
} from "lucide-react";

import {
  ActiveMatchApiError,
} from "@/features/active-match/active-match.api";

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
    label: "Double Letter",
  },
  {
    value: "TRIPLE_LETTER",
    label: "Triple Letter",
  },
  {
    value: "DOUBLE_WORD",
    label: "Double Word",
  },
  {
    value: "TRIPLE_WORD",
    label: "Triple Word",
  },
];

interface WordInputDraft {
  id: string;
  value: string;
}

interface InvalidDictionaryWord {
  word?: unknown;
  normalizedWord?: unknown;
  accepted?: unknown;
  isValid?: unknown;
  valid?: unknown;
  status?: unknown;
}

function getInvalidWordNames(
  details: unknown,
): string[] {
  if (
    !details ||
    typeof details !==
      "object"
  ) {
    return [];
  }

  const wordsValue =
    (
      details as {
        words?: unknown;
      }
    ).words;

  if (
    !Array.isArray(
      wordsValue,
    )
  ) {
    return [];
  }

  const invalidWords =
    wordsValue
      .filter(
        (
          entry,
        ): entry is InvalidDictionaryWord =>
          Boolean(
            entry &&
            typeof entry ===
              "object",
          ),
      )
      .filter(
        (entry) => {
          if (
            entry.accepted ===
              false ||
            entry.isValid ===
              false ||
            entry.valid ===
              false
          ) {
            return true;
          }

          if (
            typeof entry.status ===
              "string"
          ) {
            return [
              "INVALID",
              "REJECTED",
              "NOT_FOUND",
              "UNKNOWN",
            ].includes(
              entry.status
                .toUpperCase(),
            );
          }

          return false;
        },
      )
      .map(
        (entry) => {
          const candidate =
            entry.word ??
            entry.normalizedWord;

          return typeof candidate ===
            "string"
            ? candidate
                .trim()
                .toUpperCase()
            : "";
        },
      )
      .filter(Boolean);

  return [
    ...new Set(
      invalidWords,
    ),
  ];
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

  const [
    showFirstTurnGuide,
    setShowFirstTurnGuide,
  ] = useState(false);

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          const guideCompleted =
            window.localStorage
              .getItem(
                "scrabble-turn-guide-completed",
              );

          setShowFirstTurnGuide(
            guideCompleted !==
              "true",
          );
        },
        0,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, []);

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

  function dismissFirstTurnGuide():
    void {
    window.localStorage.setItem(
      "scrabble-turn-guide-completed",
      "true",
    );

    setShowFirstTurnGuide(
      false,
    );
  }

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

      window.localStorage.setItem(
        "scrabble-turn-guide-completed",
        "true",
      );

      setShowFirstTurnGuide(
        false,
      );

      clearTurn();
    } catch (error) {
      if (
        error instanceof
          ActiveMatchApiError &&
        error.code ===
          "TURN_WORDS_INVALID"
      ) {
        const invalidWords =
          getInvalidWordNames(
            error.details,
          );

        setErrorMessage(
          invalidWords.length > 0
            ? invalidWords.length === 1
              ? `${invalidWords[0]} was not found in the selected dictionary. Check the spelling or choose another word.`
              : `${invalidWords.join(
                  ", ",
                )} were not found in the selected dictionary.`
            : "One or more words were not found in the selected dictionary.",
        );

        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The turn could not be submitted.",
      );
    }
  }

  const actionLabel =
    "Score This Turn";

  const nextStepMessage = (() => {
    if (
      placedTiles.length === 0
    ) {
      return "Enter the tiles you placed to begin.";
    }

    if (
      formedWords.length === 0
    ) {
      return "Enter the main word you made.";
    }

    if (
      wordsWithoutNewTiles.length >
      0
    ) {
      return `${getFormedWordText(
        wordsWithoutNewTiles[0],
      )} does not use any tile you entered.`;
    }

    const unusedTileError =
      validation.errors.find(
        (error) =>
          error.includes(
            "is not used in any formed word",
          ),
      );

    if (unusedTileError) {
      return "Add every word created by the tiles you placed.";
    }

    return (
      validation.errors[0] ??
      null
    );
  })();

  return (
    <div
      className={styles.workflow}
    >
      {showFirstTurnGuide ? (
        <section
          className={styles.firstTurnGuide}
        >
          <div
            className={styles.guideHeader}
          >
            <div>
              <span>
                First turn?
              </span>

              <strong>
                Score it in four steps
              </strong>
            </div>

            <button
              type="button"
              onClick={
                dismissFirstTurnGuide
              }
            >
              Got it
            </button>
          </div>

          <ol>
            <li>
              Enter the tiles you placed.
            </li>

            <li>
              Enter every word you made.
            </li>

            <li>
              Add a board bonus when needed.
            </li>

            <li>
              Press Score This Turn.
            </li>
          </ol>
        </section>
      ) : null}
      <section
        className={styles.card}
      >
        <div
          className={styles.cardHeader}
        >
          <span>
            Tiles You Placed
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
            placeholder="Enter rack tiles..."
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
          Tap a tile only when it landed
          on a bonus square.
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

      {activePremiums.length > 0 ||
        placedTiles.length === 7 ? (
      <section
        className={styles.card}
      >
        <div
          className={styles.cardHeader}
        >
          <span>
            Board Bonuses
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
            No board bonus selected.
          </p>
        )}

        <div
          className={`${styles.bingoRow} ${
            placedTiles.length === 7
              ? ""
              : styles.hiddenElement
          }`}
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
      ) : null}

      <section
        className={styles.card}
      >
        <div
          className={styles.cardHeader}
        >
          <span>
            Words You Made
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
                        : words.length === 2
                          ? "Other Word"
                          : `Other Word ${index}`}
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
                        ? `Uses your tiles: ${usedTiles
                            .map(
                              (tile) =>
                                tile.letter,
                            )
                            .join(", ")}`
                        : "This word does not use any tile you entered."}
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

      {formedWords.length > 0 ? (
      <section
        className={styles.card}
      >
        <div
          className={styles.cardHeader}
        >
          <span>
            This Turn&apos;s Score
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
      ) : null}

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

      {!canSubmit &&
      nextStepMessage ? (
        <p
          className={
            styles.nextStepMessage
          }
          role="status"
        >
          {nextStepMessage}
        </p>
      ) : null}
    </div>
  );
}
