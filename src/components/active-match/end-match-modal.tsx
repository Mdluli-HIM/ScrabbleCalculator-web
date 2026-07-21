"use client";

import {
  AlertTriangle,
  CircleX,
  LoaderCircle,
  Medal,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import type {
  ActiveMatchPlayer,
  CompleteActiveMatchInput,
  CompleteActiveMatchReason,
} from "@/features/active-match/active-match.types";

import styles from "./end-match-modal.module.css";

interface EndMatchModalProps {
  isOpen: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  matchName: string;
  roundNumber: number;
  playerCount: number;
  players: ActiveMatchPlayer[];
  onClose: () => void;

  onConfirm: (
    input: CompleteActiveMatchInput,
  ) => void | Promise<void>;
}

function normalizeRack(
  value: string,
): string {
  return value
    .toUpperCase()
    .replace(
      /[^A-Z?]/g,
      "",
    )
    .slice(0, 7);
}

function createRackTiles(
  value: string,
): CompleteActiveMatchInput["players"][number]["rackTiles"] {
  return normalizeRack(value)
    .split("")
    .map((character) => {
      if (character === "?") {
        return {
          letter: "A",
          isBlank: true,
        };
      }

      return {
        letter: character,
        isBlank: false,
      };
    });
}

export function EndMatchModal({
  isOpen,
  isLoading,
  errorMessage,
  matchName,
  roundNumber,
  playerCount,
  players,
  onClose,
  onConfirm,
}: EndMatchModalProps) {
  const orderedPlayers =
    useMemo(
      () =>
        [...players].sort(
          (
            first,
            second,
          ) =>
            first.turnOrder -
              second.turnOrder ||
            first.seatNumber -
              second.seatNumber,
        ),
      [players],
    );

  const [
    reason,
    setReason,
  ] = useState<
    CompleteActiveMatchReason | ""
  >("");

  const [
    finishingPlayerId,
    setFinishingPlayerId,
  ] = useState("");

  const [
    rackValues,
    setRackValues,
  ] = useState<
    Record<string, string>
  >({});

  const [
    formError,
    setFormError,
  ] = useState<
    string | null
  >(null);

  function resetForm():
    void {
    setReason("");
    setFinishingPlayerId("");

    setRackValues(
      Object.fromEntries(
        orderedPlayers.map(
          (player) => [
            player.id,
            "",
          ],
        ),
      ),
    );

    setFormError(null);
  }

  function handleClose():
    void {
    if (isLoading) {
      return;
    }

    resetForm();
    onClose();
  }

  if (!isOpen) {
    return null;
  }

  const hasError =
    Boolean(errorMessage);

  const playerLabel =
    playerCount === 1
      ? "1 Player"
      : `${playerCount} Players`;

  function chooseReason(
    nextReason:
      CompleteActiveMatchReason,
  ): void {
    setReason(nextReason);
    setFormError(null);

    if (
      nextReason ===
      "STALEMATE"
    ) {
      setFinishingPlayerId("");
      return;
    }

    const defaultPlayer =
      finishingPlayerId ||
      orderedPlayers[0]?.id ||
      "";

    setFinishingPlayerId(
      defaultPlayer,
    );

    if (defaultPlayer) {
      setRackValues(
        (current) => ({
          ...current,
          [defaultPlayer]: "",
        }),
      );
    }
  }

  function chooseFinisher(
    playerId: string,
  ): void {
    setFinishingPlayerId(
      playerId,
    );

    setRackValues(
      (current) => ({
        ...current,
        [playerId]: "",
      }),
    );

    setFormError(null);
  }

  function updateRack(
    playerId: string,
    value: string,
  ): void {
    const playerIsFinisher =
      reason ===
        "PLAYER_EMPTIED_RACK" &&
      finishingPlayerId ===
        playerId;

    if (playerIsFinisher) {
      return;
    }

    setRackValues(
      (current) => ({
        ...current,
        [playerId]:
          normalizeRack(value),
      }),
    );

    setFormError(null);
  }

  async function submitCompletion():
    Promise<void> {
    if (!reason) {
      setFormError(
        "Choose how the match finished.",
      );

      return;
    }

    if (
      reason ===
        "PLAYER_EMPTIED_RACK" &&
      !finishingPlayerId
    ) {
      setFormError(
        "Choose who used all their tiles.",
      );

      return;
    }

    const input:
      CompleteActiveMatchInput = {
        reason,

        players:
          orderedPlayers.map(
            (player) => {
              const playerIsFinisher =
                reason ===
                  "PLAYER_EMPTIED_RACK" &&
                finishingPlayerId ===
                  player.id;

              return {
                playerId:
                  player.id,

                rackTiles:
                  playerIsFinisher
                    ? []
                    : createRackTiles(
                        rackValues[
                          player.id
                        ] ?? "",
                      ),
              };
            },
          ),

        ...(reason ===
          "PLAYER_EMPTIED_RACK"
          ? {
              finishingPlayerId,
            }
          : {}),
      };

    setFormError(null);

    await onConfirm(input);
  }

  return (
    <div
      className={styles.overlay}
      role={
        hasError
          ? "alertdialog"
          : "dialog"
      }
      aria-modal="true"
      aria-labelledby="end-match-title"
    >
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close end match dialog"
        disabled={isLoading}
        onClick={handleClose}
      />

      <section
        className={`${styles.panel} ${
          hasError
            ? styles.errorPanel
            : ""
        }`}
      >
        <div
          className={styles.handle}
          aria-hidden="true"
        />

        {hasError ? (
          <>
            <div
              className={
                styles.errorIcon
              }
            >
              <CircleX
                aria-hidden="true"
              />
            </div>

            <h2
              id="end-match-title"
              className={
                styles.errorTitle
              }
            >
              The match could not be
              completed
            </h2>

            <p
              className={
                styles.errorDescription
              }
            >
              Your scores are still safe.
              Please try again.
            </p>

            <MatchSummary
              matchName={matchName}
              roundNumber={roundNumber}
              playerLabel={
                playerLabel
              }
            />

            <div
              className={
                styles.errorActions
              }
            >
              <button
                type="button"
                className={
                  styles.primaryButton
                }
                disabled={isLoading}
                onClick={() => {
                  void submitCompletion();
                }}
              >
                {isLoading ? (
                  <>
                    <LoaderCircle
                      className={
                        styles.spinner
                      }
                      aria-hidden="true"
                    />

                    Trying Again...
                  </>
                ) : (
                  "Try Again"
                )}
              </button>

              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                disabled={isLoading}
                onClick={handleClose}
              >
                Return to Match
              </button>
            </div>
          </>
        ) : (
          <>
            <p
              className={styles.eyebrow}
            >
              End Match
            </p>

            <h2
              id="end-match-title"
              className={styles.title}
            >
              Ready to reveal the final
              scores?
            </h2>

            <p
              className={
                styles.description
              }
            >
              Tell us how the match ended
              and enter every player&apos;s
              remaining tiles.
            </p>

            <MatchSummary
              matchName={matchName}
              roundNumber={roundNumber}
              playerLabel={
                playerLabel
              }
            />

            <div
              className={
                styles.completionForm
              }
            >
              <section
                className={
                  styles.formSection
                }
              >
                <h3>
                  How did the match
                  finish?
                </h3>

                <div
                  className={
                    styles.reasonGrid
                  }
                >
                  <button
                    type="button"
                    className={`${styles.reasonButton} ${
                      reason ===
                      "PLAYER_EMPTIED_RACK"
                        ? styles.reasonButtonActive
                        : ""
                    }`}
                    disabled={isLoading}
                    onClick={() => {
                      chooseReason(
                        "PLAYER_EMPTIED_RACK",
                      );
                    }}
                  >
                    <strong>
                      A player used all
                      their tiles
                    </strong>

                    <span>
                      The other remaining
                      tiles are transferred
                      to the finisher.
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.reasonButton} ${
                      reason ===
                      "STALEMATE"
                        ? styles.reasonButtonActive
                        : ""
                    }`}
                    disabled={isLoading}
                    onClick={() => {
                      chooseReason(
                        "STALEMATE",
                      );
                    }}
                  >
                    <strong>
                      No more moves were
                      possible
                    </strong>

                    <span>
                      Each player&apos;s
                      remaining rack is
                      deducted.
                    </span>
                  </button>
                </div>
              </section>

              {reason ===
              "PLAYER_EMPTIED_RACK" ? (
                <section
                  className={
                    styles.formSection
                  }
                >
                  <label
                    htmlFor="finishing-player"
                  >
                    Who used all their
                    tiles?
                  </label>

                  <select
                    id="finishing-player"
                    className={
                      styles.playerSelect
                    }
                    value={
                      finishingPlayerId
                    }
                    disabled={isLoading}
                    onChange={(
                      event,
                    ) => {
                      chooseFinisher(
                        event.target
                          .value,
                      );
                    }}
                  >
                    {orderedPlayers.map(
                      (player) => (
                        <option
                          key={
                            player.id
                          }
                          value={
                            player.id
                          }
                        >
                          {
                            player.displayName
                          }
                        </option>
                      ),
                    )}
                  </select>
                </section>
              ) : null}

              {reason ? (
                <section
                  className={
                    styles.formSection
                  }
                >
                  <div
                    className={
                      styles.rackHeading
                    }
                  >
                    <h3>
                      Remaining tiles
                    </h3>

                    <span>
                      Maximum 7
                    </span>
                  </div>

                  <div
                    className={
                      styles.rackList
                    }
                  >
                    {orderedPlayers.map(
                      (player) => {
                        const playerIsFinisher =
                          reason ===
                            "PLAYER_EMPTIED_RACK" &&
                          finishingPlayerId ===
                            player.id;

                        const rackValue =
                          rackValues[
                            player.id
                          ] ?? "";

                        return (
                          <label
                            key={
                              player.id
                            }
                            className={
                              styles.rackRow
                            }
                          >
                            <span
                              className={
                                styles.rackPlayer
                              }
                            >
                              <strong>
                                {
                                  player.displayName
                                }
                              </strong>

                              <small>
                                {playerIsFinisher
                                  ? "Rack emptied"
                                  : `${rackValue.length}/7 tiles`}
                              </small>
                            </span>

                            <input
                              type="text"
                              className={
                                styles.rackInput
                              }
                              value={
                                playerIsFinisher
                                  ? ""
                                  : rackValue
                              }
                              placeholder={
                                playerIsFinisher
                                  ? "No tiles"
                                  : "Example: AE?"
                              }
                              maxLength={7}
                              autoCapitalize="characters"
                              autoComplete="off"
                              spellCheck={false}
                              disabled={
                                isLoading ||
                                playerIsFinisher
                              }
                              onChange={(
                                event,
                              ) => {
                                updateRack(
                                  player.id,
                                  event.target
                                    .value,
                                );
                              }}
                            />
                          </label>
                        );
                      },
                    )}
                  </div>

                  <p
                    className={
                      styles.rackHint
                    }
                  >
                    Enter letters without
                    spaces. Use{" "}
                    <strong>?</strong> for
                    a blank tile. Leave
                    empty when no tiles
                    remain.
                  </p>
                </section>
              ) : null}

              {formError ? (
                <p
                  className={
                    styles.formError
                  }
                  role="alert"
                >
                  {formError}
                </p>
              ) : null}
            </div>

            <div
              className={
                styles.warningCard
              }
            >
              <div
                className={
                  styles.warningIcon
                }
              >
                <AlertTriangle
                  aria-hidden="true"
                />
              </div>

              <div
                className={
                  styles.warningCopy
                }
              >
                <strong>
                  This cannot be undone
                </strong>

                <span>
                  Players cannot submit
                  new turns after the
                  match is completed.
                </span>
              </div>
            </div>

            <div
              className={
                styles.actions
              }
            >
              <button
                type="button"
                className={
                  styles.primaryButton
                }
                disabled={
                  isLoading ||
                  !reason
                }
                onClick={() => {
                  void submitCompletion();
                }}
              >
                {isLoading ? (
                  <>
                    <LoaderCircle
                      className={
                        styles.spinner
                      }
                      aria-hidden="true"
                    />

                    Finishing Match...
                  </>
                ) : (
                  "End Match & Reveal Scores"
                )}
              </button>

              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                disabled={isLoading}
                onClick={handleClose}
              >
                Continue Playing
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

interface MatchSummaryProps {
  matchName: string;
  roundNumber: number;
  playerLabel: string;
}

function MatchSummary({
  matchName,
  roundNumber,
  playerLabel,
}: MatchSummaryProps) {
  return (
    <div
      className={
        styles.summaryCard
      }
    >
      <div
        className={
          styles.summaryIcon
        }
      >
        <Medal
          aria-hidden="true"
        />
      </div>

      <div
        className={
          styles.summaryCopy
        }
      >
        <strong>
          {matchName}
        </strong>

        <span>
          Round {roundNumber}
          {" • "}
          {playerLabel}
        </span>
      </div>
    </div>
  );
}
