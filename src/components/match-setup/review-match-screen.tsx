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
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  LoaderCircle,
  LockKeyhole,
  Play,
  UsersRound,
} from "lucide-react";

import {
  getGuestMatch,
} from "@/features/match-setup/match-setup.api";

import {
  clearMatchSetupDraft,
  readMatchSetupDraft,
  saveMatchSetupDraft,
} from "@/features/match-setup/match-setup.storage";

import type {
  MatchSetupDraft,
  MatchSetupPlayerDraft,
} from "@/features/match-setup/match-setup.types";

import {
  startGuestMatch,
} from "@/features/match-setup/start-match.api";

import {
  readGuestSessionToken,
  saveActiveMatchId,
} from "@/lib/session/browser-session";

import styles from "./review-match-screen.module.css";

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

interface PlayerOrderProps {
  players:
    MatchSetupPlayerDraft[];
  compact?: boolean;
}

function PlayerOrder({
  players,
  compact = false,
}: PlayerOrderProps) {
  return (
    <ol
      className={
        compact
          ? styles.compactPlayerList
          : styles.playerList
      }
    >
      {players.map(
        (
          player,
          index,
        ) => (
          <li
            key={player.clientId}
          >
            <span
              className={styles.playerNumber}
              aria-hidden="true"
            >
              {index + 1}
            </span>

            <strong>
              {player.displayName.trim() ||
                `Player ${index + 1}`}
            </strong>

            {index === 0 ? (
              <span
                className={styles.firstBadge}
              >
                Goes First
              </span>
            ) : null}
          </li>
        ),
      )}
    </ol>
  );
}

interface StartMatchPanelProps {
  playerCount: number;
  isReady: boolean;
  isPending: boolean;
  errorMessage: string | null;
  mobile?: boolean;
  onStart: () => void;
}

function StartMatchPanel({
  playerCount,
  isReady,
  isPending,
  errorMessage,
  mobile = false,
  onStart,
}: StartMatchPanelProps) {
  return (
    <section
      className={`${styles.startPanel} ${
        mobile
          ? styles.mobileStartPanel
          : styles.desktopStartPanel
      }`}
    >
      <div
        className={styles.startPanelHeading}
      >
        <span
          className={styles.playIcon}
          aria-hidden="true"
        >
          <Play />
        </span>

        <span>
          <h2>
            Match Ready to Begin
          </h2>

          <p>
            Confirm players, lock in your
            scores-concealed rule, and
            start the board calculator.
          </p>
        </span>
      </div>

      <div
        className={styles.startDivider}
      />

      <div
        className={styles.startFooter}
      >
        <div
          className={styles.startBadges}
        >
          <span>
            <UsersRound
              aria-hidden="true"
            />

            {playerCount} players
          </span>

          <span>
            <LockKeyhole
              aria-hidden="true"
            />

            Scores concealed
          </span>
        </div>

        <button
          type="button"
          className={styles.startButton}
          disabled={
            !isReady ||
            isPending
          }
          onClick={onStart}
        >
          {isPending ? (
            <>
              <LoaderCircle
                className={styles.spinner}
                aria-hidden="true"
              />

              Starting Match…
            </>
          ) : (
            "Start Match"
          )}
        </button>
      </div>

      {!isReady ? (
        <p
          className={styles.readinessError}
          role="alert"
        >
          Return to Player Setup and save
          every player before starting.
        </p>
      ) : null}

      {errorMessage ? (
        <p
          className={styles.requestError}
          role="alert"
        >
        {errorMessage}
        </p>
      ) : null}
    </section>
  );
}

interface ReviewErrorOverlayProps {
  isRetrying: boolean;
  onRetry: () => void;
  onBack: () => void;
}

function ReviewErrorOverlay({
  isRetrying,
  onRetry,
  onBack,
}: ReviewErrorOverlayProps) {
  return (
    <div
      className={styles.errorOverlay}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="review-error-title"
      aria-describedby="review-error-description"
    >
      <section
        className={styles.errorDialog}
      >
        <span
          className={styles.errorIcon}
          aria-hidden="true"
        >
          <AlertTriangle />
        </span>

        <h2
          id="review-error-title"
        >
          Match couldn&apos;t start
        </h2>

        <p
          id="review-error-description"
        >
          We couldn&apos;t configure the
          board right now. Your match
          setup has been saved.
        </p>

        <button
          type="button"
          className={styles.retryButton}
          disabled={isRetrying}
          onClick={onRetry}
        >
          {isRetrying ? (
            <>
              <LoaderCircle
                className={styles.errorSpinner}
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
          className={styles.backPlayersButton}
          disabled={isRetrying}
          onClick={onBack}
        >
          Back to Players
        </button>
      </section>
    </div>
  );
}

function ReviewLoadingOverlay() {
  return (
    <div
      className={styles.startingOverlay}
      role="status"
      aria-live="polite"
      aria-label="Configuring the Scrabble board"
    >
      <div
        className={styles.startingDialog}
      >
        <LoaderCircle
          className={styles.startingDialogSpinner}
          aria-hidden="true"
        />

        <strong>
          Configuring Board...
        </strong>
      </div>

      <div
        className={styles.startingBottomBar}
      >
        <LoaderCircle
          className={styles.startingButtonSpinner}
          aria-hidden="true"
        />

        <span>
          Starting Match...
        </span>
      </div>
    </div>
  );
}

interface ReviewMatchScreenProps {
  previewLoading?: boolean;
  previewError?: boolean;
}

export function ReviewMatchScreen({
  previewLoading = false,
  previewError = false,
}: ReviewMatchScreenProps) {
  const router =
    useRouter();

  const [
    setup,
    setSetup,
  ] = useState<
    MatchSetupDraft | null
  >(null);

  const [
    hasRestored,
    setHasRestored,
  ] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrateReview():
      Promise<void> {
      if (
        previewLoading ||
        previewError
      ) {
        const previewSetup:
          MatchSetupDraft = {
          matchName:
            "Sunday Game Night",

          playerCount: 3,

          dictionaryPolicy:
            "LOCAL_WORD_LIST",

          matchId:
            "preview-loading-match",

          players: [
            {
              clientId:
                "preview-loading-player-1",

              displayName:
                "Marcus",

              serverPlayerId:
                "preview-server-player-1",
            },
            {
              clientId:
                "preview-loading-player-2",

              displayName:
                "Alex",

              serverPlayerId:
                "preview-server-player-2",
            },
            {
              clientId:
                "preview-loading-player-3",

              displayName:
                "Lerato",

              serverPlayerId:
                "preview-server-player-3",
            },
          ],

          updatedAt:
            new Date().toISOString(),
        };

        if (!cancelled) {
          setSetup(
            previewSetup,
          );

          setHasRestored(true);
        }

        return;
      }

      const stored =
        readMatchSetupDraft();

      if (
        !stored?.matchId ||
        !stored.playerCount ||
        !stored.players?.length
      ) {
        if (!cancelled) {
          router.replace(
            "/matches/new/players",
          );
        }

        return;
      }

      let hydratedSetup =
        stored;

      const guestSessionToken =
        readGuestSessionToken();

      if (guestSessionToken) {
        try {
          const match =
            await getGuestMatch(
              guestSessionToken,
              stored.matchId,
            );

          const orderedApiPlayers =
            [...match.players].sort(
              (
                first,
                second,
              ) =>
                first.turnOrder -
                  second.turnOrder ||
                first.seatNumber -
                  second.seatNumber,
            );

          const hydratedPlayers:
            MatchSetupPlayerDraft[] =
            Array.from(
              {
                length:
                  stored.playerCount,
              },
              (
                _unused,
                index,
              ) => {
                const apiPlayer =
                  orderedApiPlayers[
                    index
                  ];

                const storedPlayer =
                  stored.players?.[
                    index
                  ];

                return {
                  clientId:
                    storedPlayer
                      ?.clientId ??
                    `player-${index + 1}`,

                  displayName:
                    apiPlayer
                      ?.displayName
                      ?.trim() ||
                    storedPlayer
                      ?.displayName
                      ?.trim() ||
                    `Player ${index + 1}`,

                  serverPlayerId:
                    apiPlayer?.id ??
                    storedPlayer
                      ?.serverPlayerId ??
                    null,
                };
              },
            );

          hydratedSetup = {
            ...stored,

            matchName:
              match.name?.trim() ||
              stored.matchName,

            players:
              hydratedPlayers,

            updatedAt:
              new Date().toISOString(),
          };

          saveMatchSetupDraft(
            hydratedSetup,
          );
        } catch {
          /*
           * Keep the locally saved setup when
           * the API refresh is unavailable.
           */
        }
      }

      if (cancelled) {
        return;
      }

      setSetup(
        hydratedSetup,
      );

      setHasRestored(true);
    }

    queueMicrotask(() => {
      void hydrateReview();
    });

    return () => {
      cancelled = true;
    };
  }, [
    previewError,
    previewLoading,
    router,
  ]);

  const players =
    useMemo(
      () =>
        setup?.players ?? [],
      [setup],
    );

  const expectedPlayerCount =
    setup?.playerCount ?? 0;

  const isReady =
    Boolean(
      setup?.matchId &&
      expectedPlayerCount >= 2 &&
      players.length ===
        expectedPlayerCount &&
      players.every(
        (player) =>
          player.displayName
            .trim()
            .length >= 2 &&
          Boolean(
            player.serverPlayerId,
          ),
      ),
    );

  const startMutation =
    useMutation({
      mutationFn: async () => {
        const guestSessionToken =
          readGuestSessionToken();

        if (!guestSessionToken) {
          throw new Error(
            "Your guest session has expired. Return to the Welcome screen and start again.",
          );
        }

        if (
          !setup?.matchId ||
          !isReady
        ) {
          throw new Error(
            "The match setup is incomplete.",
          );
        }

        const [
          match,
        ] = await Promise.all([
          startGuestMatch(
            guestSessionToken,
            setup.matchId,
          ),

          new Promise<void>(
            (resolve) => {
              window.setTimeout(
                resolve,
                900,
              );
            },
          ),
        ]);

        return match;
      },

      onSuccess: (match) => {
        saveActiveMatchId(
          match.id,
        );

        clearMatchSetupDraft();

        router.push(
          `/matches/${match.id}`,
        );
      },
    });

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
          Preparing your match review…
        </p>
      </main>
    );
  }

  const requestError =
    startMutation.isError
      ? (
          startMutation.error instanceof
          Error
            ? startMutation.error.message
            : "The match could not be started."
        )
      : null;

  const showLoadingState =
    previewLoading ||
    startMutation.isPending;

  const showErrorState =
    !showLoadingState &&
    (
      previewError ||
      startMutation.isError
    );

  return (
    <main
      className={`${styles.page} ${
        showLoadingState
          ? styles.pageStarting
          : ""
      } ${
        showErrorState
          ? styles.pageError
          : ""
      }`}
      aria-busy={
        showLoadingState
      }
    >
      <div
        className={styles.desktopLayout}
      >
        <section
          className={styles.leftColumn}
        >
          <header
            className={styles.header}
          >
            <Link
              href="/matches/new/players"
              className={styles.backLink}
            >
              <ArrowLeft
              aria-hidden="true"
              />

              Back to Players
            </Link>

            <Brand />
          </header>

          <section
            className={styles.progressSection}
          >
            <div
              className={styles.progressHeading}
            >
              <strong>
                Step 3 of 3
              </strong>

              <span>
                Review
              </span>
            </div>

            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-label="Step 3 of 3"
              aria-valuemin={1}
              aria-valuemax={3}
              aria-valuenow={3}
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
              Review your match
            </h1>

            <p>
              Check everything before
              starting {setup.matchName}.
            </p>
          </section>

          <article
            className={styles.detailsCard}
          >
            <div
              className={styles.cardHeading}
            >
              <span>
                Match Details
              </span>

              <Link
                href="/matches/new"
              >
                Edit
              </Link>
            </div>

            <h2>
              {setup.matchName}
            </h2>

            <div
              className={styles.matchMeta}
            >
              <span>
                <UsersRound
                  aria-hidden="true"
                />

                {expectedPlayerCount} Players
              </span>

              <span>
                <BookOpen
                  aria-hidden="true"
                />

                Local Starter Dictionary
              </span>

              <span>
                <LockKeyhole
                  aria-hidden="true"
                />

                Scores Concealed
              </span>
            </div>
          </article>

          <article
            className={styles.orderCard}
          >
            <div
              className={styles.cardHeading}
            >
              <span>
                Player Order
              </span>

              <Link
                href="/matches/new/players"
              >
                Edit Players
              </Link>
            </div>

            <PlayerOrder
              players={players}
            />
          </article>

          <article
            className={styles.concealedCard}
          >
            <span
              className={styles.concealedIcon}
              aria-hidden="true"
            >
              <LockKeyhole />
            </span>

            <span>
              <strong>
                Scores remain concealed
              </strong>

              <small>
                Players will only see
                points from the current
                turn. Final totals are
                revealed when the match
                ends.
              </small>
            </span>
          </article>

          <p
            className={styles.warning}
          >
            Match settings and dictionary
            cannot be changed once the
            match starts.
          </p>

          <StartMatchPanel
            mobile
            playerCount={
              expectedPlayerCount
            }
            isReady={isReady}
            isPending={
              showLoadingState
            }
            errorMessage={
              requestError
            }
            onStart={() => {
              startMutation.mutate();
            }}
          />
        </section>

        <aside
          className={styles.rightColumn}
        >
          <section
            className={styles.summaryPanel}
          >
            <h2>
              {setup.matchName}
            </h2>

            <p>
              Ready to begin — review e
              setup below.
            </p>

            <div
              className={styles.playerSummary}
            >
              <div
                className={styles.playerSummaryHeading}
              >
                <span
                  className={styles.usersIcon}
                  aria-hidden="true"
                >
                  <UsersRound />
                </span>

                <span>
                  <small>
                    Players
                  </small>

                  <strong>
                    {expectedPlayerCount} players
                  </strong>
                </span>
              </div>

              <PlayerOrder
                players={players}
                compact
              />
            </div>
          </section>

          <StartMatchPanel
            playerCount={
              expectedPlayerCount
            }
            isReady={isReady}
            isPending={
              showLoadingState
            }
            errorMessage={
              requestError
            }
            onStart={() => {
              startMutation.mutate();
            }}
          />
        </aside>
      </div>
      {showLoadingState ? (
        <ReviewLoadingOverlay />
      ) : null}

      {showErrorState ? (
        <ReviewErrorOverlay
          isRetrying={
            startMutation.isPending
          }
          onRetry={() => {
            if (previewError) {
              router.push(
                "/matches/new/review?state=loading",
              );

              return;
            }

            startMutation.reset();
            startMutation.mutate();
          }}
          onBack={() => {
            router.push(
              "/matches/new/players",
            );
          }}
        />
      ) : null}

    </main>
  );
}
