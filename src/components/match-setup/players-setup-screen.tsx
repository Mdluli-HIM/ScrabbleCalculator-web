"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  useMutation,
} from "@tanstack/react-query";

import {
  ArrowLeft,
  BookOpen,
  Info,
  LoaderCircle,
  LockKeyhole,
  X,
} from "lucide-react";

import {
  saveGuestMatchPlayers,
} from "@/features/match-setup/match-setup.api";

import {
  readMatchSetupDraft,
  saveMatchSetupDraft,
} from "@/features/match-setup/match-setup.storage";

import type {
  MatchSetupDraft,
  MatchSetupPlayerDraft,
} from "@/features/match-setup/match-setup.types";

import {
  readGuestSessionToken,
} from "@/lib/session/browser-session";

import styles from "./players-setup-screen.module.css";

function Brand() {
  return (
    <Link
      href="/"
      className={styles.brand}
      aria-label="Scrabble Calculator home"
    >
      <span
        className={styles.brandTiles}
        aria-hidden="true"
      >
        <span
          className={styles.logoTile}
        >
          <strong>S</strong>
          <small>1</small>
        </span>

        <span
          className={styles.logoTile}
        >
          <strong>C</strong>
          <small>3</small>
        </span>
      </span>

      <span
        className={styles.brandName}
      >
        Scrabble Calculator
      </span>
    </Link>
  );
}

function normalizeName(
  value: string,
): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

function createPlayerDrafts(
  count: number,
  existing:
    MatchSetupPlayerDraft[] = [],
): MatchSetupPlayerDraft[] {
  return Array.from(
    {
      length: count,
    },
    (
      _value,
      index,
    ) => ({
      clientId:
        existing[index]?.clientId ??
        `player-${index + 1}`,

      displayName:
        existing[index]?.displayName ??
        "",

      serverPlayerId:
        existing[index]?.serverPlayerId ??
        null,
    }),
  );
}

interface PlayerError {
  message: string;
}

interface PlayersPreviewProps {
  setup: MatchSetupDraft;
  players: MatchSetupPlayerDraft[];
}

function PlayersPreview({
  setup,
  players,
}: PlayersPreviewProps) {
  return (
    <aside
      className={styles.previewCard}
      aria-label="Match setup preview"
    >
      <span
        className={styles.previewEyebrow}
      >
        Match Setup
      </span>

      <h2>
        {setup.matchName}
      </h2>

      <div
        className={styles.previewDivider}
      />

      <strong
        className={styles.previewPlayerCount}
      >
        {setup.playerCount} Players
      </strong>

      <ol
        className={styles.previewPlayers}
      >
        {players.map(
          (
            player,
            index,
          ) => (
            <li
              key={player.clientId}
            >
              <span>
                {player.displayName.trim() ||
                  `Player ${index + 1}`}
              </span>

              {index === 0 ? (
                <span
                  className={styles.previewFirstBadge}
                >
                  Goes First
                </span>
              ) : null}
            </li>
          ),
        )}
      </ol>

      <div
        className={styles.previewDivider}
      />

      <div
        className={styles.previewSetting}
      >
        <BookOpen
          aria-hidden="true"
        />

        <span>
          Local Starter Dictionary
        </span>
      </div>

      <div
        className={styles.previewSetting}
      >
        <LockKeyhole
          aria-hidden="true"
        />

        <span>
          Scores Concealed
        </span>
      </div>
    </aside>
  );
}

interface PlayersSetupScreenProps {
  previewValid?: boolean;
  previewError?: boolean;
}

export function PlayersSetupScreen({
  previewValid = false,
  previewError = false,
}: PlayersSetupScreenProps) {
  const router =
    useRouter();

  const [
    setup,
    setSetup,
  ] = useState<MatchSetupDraft | null>(
    null,
  );

  const [
    players,
    setPlayers,
  ] = useState<
    MatchSetupPlayerDraft[]
  >([]);

  const [
    hasRestored,
    setHasRestored,
  ] = useState(false);

  const [
    hasSubmitted,
    setHasSubmitted,
  ] = useState(false);

  const [
    touchedPlayers,
    setTouchedPlayers,
  ] = useState<
    Record<number, boolean>
  >({});

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      if (
        previewValid ||
        previewError
      ) {
        const previewPlayers:
          MatchSetupPlayerDraft[] =
          previewError
            ? [
                {
                  clientId:
                    "preview-error-player-1",

                  displayName:
                    "Marcus",

                  serverPlayerId:
                    null,
                },
                {
                  clientId:
                    "preview-error-player-2",

                  displayName:
                    "marcus",

                  serverPlayerId:
                    null,
                },
                {
                  clientId:
                    "preview-error-player-3",

                  displayName:
                    "",

                  serverPlayerId:
                    null,
                },
              ]
            : [
                {
                  clientId:
                    "preview-valid-player-1",

                  displayName:
                    "Marcus",

                  serverPlayerId:
                    null,
                },
                {
                  clientId:
                    "preview-valid-player-2",

                  displayName:
                    "Alex",

                  serverPlayerId:
                    null,
                },
                {
                  clientId:
                    "preview-valid-player-3",

                  displayName:
                    "Lerato",

                  serverPlayerId:
                    null,
                },
              ];

        const previewSetup:
          MatchSetupDraft = {
          matchName:
            "Sunday Game Night",

          playerCount: 3,

          dictionaryPolicy:
            "LOCAL_WORD_LIST",

          matchId:
            previewError
              ? "preview-error-match"
              : "preview-valid-match",

          players:
            previewPlayers,

          updatedAt:
            new Date().toISOString(),
        };

        setSetup(
          previewSetup,
        );

        setPlayers(
          previewPlayers,
        );

        setTouchedPlayers(
          previewError
            ? {
                1: true,
              }
            : {},
        );

        setHasSubmitted(false);
        setHasRestored(true);

        return;
      }

      const stored =
        readMatchSetupDraft();

      if (
        !stored?.matchId ||
        !stored.playerCount
      ) {
        router.replace(
          "/matches/new",
        );

        return;
      }

      setSetup(stored);

      setPlayers(
        createPlayerDrafts(
          stored.playerCount,
          stored.players,
        ),
      );

      setHasRestored(true);
    });

    return () => {
      cancelled = true;
    };
  }, [
    previewError,
    previewValid,
    router,
  ]);

  useEffect(() => {
    if (
      !hasRestored ||
      !setup ||
      previewValid ||
      previewError
    ) {
      return;
    }

    saveMatchSetupDraft({
      ...setup,
      players,
      updatedAt:
        new Date().toISOString(),
    });
  }, [
    hasRestored,
    players,
    previewError,
    previewValid,
    setup,
  ]);

  const errors =
    useMemo(() => {
      const normalizedNames =
        players.map(
          (player) =>
            normalizeName(
              player.displayName,
            ),
        );

      return players.map(
        (
          player,
          index,
        ): PlayerError | null => {
          const normalized =
            normalizedNames[index];

          if (!normalized) {
            return {
              message:
                "Player name is required.",
            };
          }

          if (normalized.length < 2) {
            return {
              message:
                "Player name must contain at least 2 characters.",
            };
          }

          const duplicateCount =
            normalizedNames.filter(
              (name) =>
                name === normalized,
            ).length;

          if (duplicateCount > 1) {
            return {
              message:
                "Each player must have a unique name.",
            };
          }

          return null;
        },
      );
    }, [players]);

  const isFormValid =
    players.length >= 2 &&
    errors.every(
      (error) =>
        error === null,
    );

  const saveMutation =
    useMutation({
      mutationFn: async () => {
        if (
          !setup?.matchId ||
          !setup.playerCount
        ) {
          throw new Error(
            "Match setup data is missing.",
          );
        }

        const guestSessionToken =
          readGuestSessionToken();

        if (!guestSessionToken) {
          throw new Error(
            "Your guest session has expired. Start a new guest session.",
          );
        }

        const names =
          players.map(
            (player) =>
              player.displayName
                .trim()
                .replace(/\s+/g, " "),
          );

        return saveGuestMatchPlayers(
          guestSessionToken,
          setup.matchId,
          names,
        );
      },

      onSuccess: (match) => {
        if (!setup) {
          return;
        }

        const orderedPlayers =
          [...match.players]
            .sort(
              (
                first,
                second,
              ) =>
                first.turnOrder -
                second.turnOrder,
            );

        const savedPlayers =
          orderedPlayers.map(
            (
              player,
              index,
            ) => ({
              clientId:
                players[index]?.clientId ??
                `player-${index + 1}`,

              displayName:
                player.displayName,

              serverPlayerId:
                player.id,
            }),
          );

        saveMatchSetupDraft({
          ...setup,
          players:
            savedPlayers,
          updatedAt:
            new Date().toISOString(),
        });

        router.push(
          "/matches/new/review",
        );
      },
    });

  function updatePlayer(
    index: number,
    value: string,
  ): void {
    setPlayers(
      (current) =>
        current.map(
          (
            player,
            playerIndex,
          ) =>
            playerIndex === index
              ? {
                  ...player,
                  displayName:
                    value.slice(
                      0,
                      40,
                    ),
                  serverPlayerId:
                    null,
                }
              : player,
        ),
    );
  }

  if (
    !hasRestored ||
    !setup
  ) {
    return (
      <main
        className={styles.loadingPage}
      >
        <LoaderCircle
          className={styles.spinner}
          aria-hidden="true"
        />

        <p>
          Restoring match setup…
        </p>
      </main>
    );
  }

  return (
    <main
      className={styles.page}
    >
      <div
        className={styles.shell}
      >
        <header
          className={styles.header}
        >
          <Link
            href="/matches/new"
            className={styles.backLink}
          >
            <ArrowLeft
              aria-hidden="true"
            />

            <span
              className={styles.backShort}
            >
              Back
            </span>

            <span
              className={styles.backLong}
            >
              Back to Match Details
            </span>
          </Link>

          <Brand />
        </header>

        <div
          className={styles.desktopGrid}
        >
          <div
            className={styles.formColumn}
          >
          <section
            className={styles.progressSection}
          >
            <span>
              Step 2 of 3
            </span>

            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-label="Step 2 of 3"
              aria-valuemin={1}
              aria-valuemax={3}
              aria-valuenow={2}
            >
              <span
                className={styles.progressValue}
              />
            </div>
          </section>

          <section
            className={styles.introduction}
          >
            <h1>
              Add your players
            </h1>

            <p>
              Enter the players joining{" "}
              {setup.matchName}.
            </p>
          </section>

          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();

              setHasSubmitted(true);

              if (
                !isFormValid ||
                saveMutation.isPending
              ) {
                return;
              }

              saveMutation.mutate();
            }}
          >
            <div
              className={styles.playerList}
            >
              {players.map(
                (
                  player,
                  index,
                ) => {
                  const shouldShowError =
                    hasSubmitted ||
                    touchedPlayers[index];

                  const error =
                    shouldShowError
                      ? errors[index]
                      : null;

                  return (
                    <div
                      key={player.clientId}
                      className={styles.playerField}
                    >
                      <div
                        className={`${styles.playerCard} ${
                          error
                            ? styles.playerCardError
                            : ""
                        }`}
                      >
                        <span
                          className={styles.playerNumber}
                          aria-hidden="true"
                        >
                          {index + 1}
                        </span>

                        <label
                          className={styles.visuallyHidden}
                          htmlFor={`player-${index + 1}`}
                        >
                          Player {index + 1} name
                        </label>

                        <input
                          id={`player-${index + 1}`}
                          type="text"
                          maxLength={40}
                          autoComplete="off"
                          value={player.displayName}
                          placeholder={`Enter player ${index + 1} name`}
                          aria-invalid={
                            Boolean(error)
                          }
                          onBlur={() => {
                            setTouchedPlayers(
                              (current) => ({
                                ...current,
                                [index]: true,
                              }),
                            );
                          }}
                          onChange={(event) => {
                            updatePlayer(
                              index,
                              event.target.value,
                            );
                          }}
                        />

                        {index === 0 ? (
                          <span
                            className={styles.firstBadge}
                          >
                            Goes First
                          </span>
                        ) : null}

                        {player.displayName ? (
                          <button
                            type="button"
                            className={styles.clearButton}
                            aria-label={`Clear player ${index + 1} name`}
                            onClick={() => {
                              updatePlayer(
                                index,
                                "",
                              );
                            }}
                          >
                            <X
                              aria-hidden="true"
                            />
                          </button>
                        ) : null}

                        <span
                          className={styles.characterCount}
                        >
                          {player.displayName.length}/40
                        </span>
                      </div>

                      {error ? (
                        <p
                          className={styles.fieldError}
                          role="alert"
                        >
                          {error.message}
                        </p>
                      ) : null}
                    </div>
                  );
                },
              )}
            </div>

            <article
              className={styles.orderCard}
            >
              <span
                className={styles.infoIcon}
                aria-hidden="true"
              >
                <Info />
              </span>

              <span>
                <strong>
                  Player order matters
                </strong>

                <small>
                  Player 1 takes the first
                  turn. You can rearrange
                  the order before
                  continuing.
                </small>
              </span>
            </article>

            <div
              className={styles.actions}
            >
              {isFormValid ||
              saveMutation.isPending ? (
                <button
                  type="submit"
                  className={styles.continueButton}
                  disabled={
                    saveMutation.isPending
                  }
                >
                  {saveMutation.isPending ? (
                    <>
                      <LoaderCircle
                        className={styles.spinner}
                        aria-hidden="true"
                      />

                      Saving Players…
                    </>
                  ) : (
                    "Continue to Review"
                  )}
              </button>
              ) : null}

              {saveMutation.isError ? (
                <p
                  className={styles.requestError}
                  role="alert"
                >
                  {saveMutation.error instanceof Error
                    ? saveMutation.error.message
                    : "The players could not be saved."}
                </p>
              ) : null}

              <Link
                href="/matches/new"
                className={styles.detailsLink}
              >
                <span
                  className={styles.mobileCancelLabel}
                >
                  Back to Match Details
                </span>

                <span
                  className={styles.desktopCancelLabel}
                >
                  Cancel Setup
                </span>
              </Link>
            </div>
          </form>
          </div>

          <PlayersPreview
            setup={setup}
            players={players}
          />
        </div>
      </div>
    </main>
  );
}
