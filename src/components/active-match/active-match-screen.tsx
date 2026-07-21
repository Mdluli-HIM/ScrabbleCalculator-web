"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  BookOpen,
  Check,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";

import {
  completeActiveMatch,
  getActiveMatch,
  submitActiveTurn,
} from "@/features/active-match/active-match.api";

import type {
  CompleteActiveMatchInput,
  ActiveMatch,
  ActiveMatchPlayer,
  ActiveTurn,
  SubmitActiveTurnInput,
} from "@/features/active-match/active-match.types";

import {
  readGuestSessionToken,
} from "@/lib/session/browser-session";

import {
  MultiWordTurnWorkflow,
} from "./simple-multi-word-turn-workflow";

import {
  EndMatchModal,
} from "./end-match-modal";

import styles from "./active-match-screen.module.css";

interface ActiveMatchScreenProps {
  matchId: string;
}

function makeIdempotencyKey():
  string {
  if (
    typeof crypto !==
      "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return [
    "turn",
    Date.now().toString(36),
    Math.random()
      .toString(36)
      .slice(2),
  ].join("-");
}

function getOrderedPlayers(
  match: ActiveMatch,
): ActiveMatchPlayer[] {
  return [...match.players].sort(
    (
      first,
      second,
    ) =>
      first.turnOrder -
        second.turnOrder ||
      first.seatNumber -
        second.seatNumber,
  );
}

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

      <span>
        Scrabble Calculator
      </span>
    </Link>
  );
}

interface StandingsProps {
  match: ActiveMatch;
  desktop?: boolean;
}

function Standings({
  match,
  desktop = false,
}: StandingsProps) {
  const players =
    getOrderedPlayers(match);

  return (
    <ol
      className={
        desktop
          ? styles.desktopStandings
          : styles.mobileStandingsList
      }
    >
      {players.map(
        (
          player,
          index,
        ) => {
          const isCurrent =
            player.id ===
            match.currentPlayer?.id;

          return (
            <li
              key={player.id}
            >
              <span
                className={`${styles.position} ${
                  isCurrent
                    ? styles.currentPosition
                    : ""
                }`}
              >
                {index + 1}
              </span>

              <strong>
                {player.displayName}
              </strong>

              {isCurrent ? (
                <span
                  className={styles.playingBadge}
                >
                  {desktop
                    ? "Currently Playing"
                    : "Playing"}
                </span>
              ) : (
                <span
                  className={styles.concealedScore}
                  aria-label="Score concealed"
                >
                  —
              </span>
              )}
            </li>
          );
        },
      )}
    </ol>
  );
}

export function ActiveMatchScreen({
  matchId,
}: ActiveMatchScreenProps) {
  const [
    match,
    setMatch,
  ] = useState<
    ActiveMatch | null
  >(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState<
    string | null
  >(null);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);


  const [
    isEndMatchModalOpen,
    setIsEndMatchModalOpen,
  ] = useState(false);

  const [
    isEndingMatch,
    setIsEndingMatch,
  ] = useState(false);


  const [
    endMatchError,
    setEndMatchError,
  ] = useState<
    string | null
  >(null);

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
    lastTurn,
    setLastTurn,
  ] = useState<
    ActiveTurn | null
  >(null);

  const [
    completedTurnCount,
    setCompletedTurnCount,
  ] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function restoreMatch():
      Promise<void> {
      const guestSessionToken =
        readGuestSessionToken();

      if (!guestSessionToken) {
        if (!cancelled) {
          setLoadError(
            "Your guest session has expired. Return to the welcome screen and start again.",
          );

          setIsLoading(false);
        }

        return;
      }

      try {
        const loadedMatch =
          await getActiveMatch(
            guestSessionToken,
            matchId,
          );

        const savedTurnCount =
          window.sessionStorage
            .getItem(
              `scrabble-turn-count:${matchId}`,
            );

        if (!cancelled) {
          setMatch(
            loadedMatch,
          );

          setCompletedTurnCount(
            Number(
              savedTurnCount ??
                0,
            ) || 0,
          );

          setLoadError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "The match could not be loaded.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void restoreMatch();

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  const roundNumber =
    match?.playerCount
      ? Math.floor(
          completedTurnCount /
            match.playerCount,
        ) + 1
      : 1;

  async function submitMultiWordTurn(
    input: SubmitActiveTurnInput,
  ): Promise<void> {
    if (
      !match?.currentPlayer ||
      isSubmitting
    ) {
      throw new Error(
        "The current player is unavailable.",
      );
    }

    const guestSessionToken =
      readGuestSessionToken();

    if (!guestSessionToken) {
      throw new Error(
        "Your guest session has expired.",
      );
    }

    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);
    setLastTurn(null);

    try {
      const result =
        await submitActiveTurn(
          guestSessionToken,
          matchId,
          makeIdempotencyKey(),
          input,
        );

      const refreshedMatch =
        await getActiveMatch(
          guestSessionToken,
          matchId,
        );

      setLastTurn(
        result.turn,
      );

      setMatch(
        refreshedMatch,
      );

      setCompletedTurnCount(
        result.turn.turnNumber,
      );

      window.sessionStorage
        .setItem(
          `scrabble-turn-count:${matchId}`,
          String(
            result.turn
              .turnNumber,
          ),
        );
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEndMatchModal():
    void {
    setMessage(null);
    setErrorMessage(null);
    setEndMatchError(null);
    setIsEndMatchModalOpen(true);
  }

  function closeEndMatchModal():
    void {
    if (isEndingMatch) {
      return;
    }

    setEndMatchError(null);
    setIsEndMatchModalOpen(false);
  }

  async function confirmEndMatch(
    input: CompleteActiveMatchInput,
  ): Promise<void> {
    setIsEndingMatch(true);
    setMessage(null);
    setErrorMessage(null);
    setEndMatchError(null);

    try {
      const guestSessionToken =
        readGuestSessionToken();

      if (!guestSessionToken) {
        throw new Error(
          "Your guest session has expired. Return to the welcome screen and start again.",
        );
      }

      const forcePreviewError =
        process.env.NODE_ENV ===
          "development" &&
        new URLSearchParams(
          window.location.search,
        ).get(
          "endMatchState",
        ) === "error";

      if (forcePreviewError) {
        throw new Error(
          "The match could not be completed.",
        );
      }

      await completeActiveMatch(
        guestSessionToken,
        matchId,
        input,
      );

      setEndMatchError(null);
      setIsEndMatchModalOpen(false);

      window.sessionStorage
        .removeItem(
          `scrabble-turn-count:${matchId}`,
        );

      window.location.assign(
        `/matches/${matchId}/results`,
      );
    } catch (error) {
      setEndMatchError(
        error instanceof Error
          ? error.message
          : "The match could not be completed.",
      );
    } finally {
      setIsEndingMatch(false);
    }
  }

  function showUnavailable(
    action: string,
  ): void {
    setMessage(
      `${action} will be connected when its turn type is added to the API.`,
    );

    setErrorMessage(null);
  }

  if (isLoading) {
    return (
      <main
        className={styles.statePage}
      >
        <LoaderCircle
          className={styles.spinner}
          aria-hidden="true"
        />

        <p>
          Loading active match…
        </p>
      </main>
    );
  }

  if (
    loadError ||
    !match
  ) {
    return (
      <main
        className={styles.statePage}
      >
        <h1>
          Match unavailable
        </h1>

        <p>
          {loadError ??
            "The match could not be found."}
        </p>

        <Link
          href="/"
          className={styles.stateButton}
        >
          Return to Welcome
        </Link>
      </main>
    );
  }

  const currentPlayer =
    match.currentPlayer;

  return (
    <main
      className={styles.page}
    >
      <div
        className={styles.layout}
      >
        <aside
          className={styles.sidebar}
        >
          <section
            className={styles.sidebarCard}
          >
            <div
              className={styles.sidebarTitle}
            >
              <span>
                Live Standings
              </span>

              <LockKeyhole
                aria-hidden="true"
              />
            </div>

            <h2>
              Scores Concealed
            </h2>

            <Standings
              match={match}
              desktop
            />
          </section>

          <section
            className={styles.sidebarCard}
          >
            <div
              className={styles.summaryHeading}
            >
              Match Configuration
              Summary
            </div>

            <div
              className={styles.configurationRow}
            >
              <span
                className={styles.summaryIcon}
              >
                <BookOpen />
              </span>

              <span>
                <small>
                  Match Dictionary
                </small>

                <strong>
                  Players decide word validity
                </strong>
              </span>
            </div>

            <div
              className={styles.configurationRow}
            >
              <span
                className={styles.summaryIcon}
              >
                <LockKeyhole />
              </span>

              <span>
                <small>
                  Score Transmission
                </small>

                <strong>
                  Concealed Standings
                  Enabled
                </strong>
              </span>
            </div>

            <p
              className={styles.configurationNote}
            >
              Players only see point
              margins from the current
              round. Final totals and
              board configurations are
              revealed when the match
              ends.
            </p>
          </section>
        </aside>

        <section
          className={styles.workspace}
        >
          <header
            className={styles.header}
          >
            <Link
              href="/"
              className={styles.backLink}
            >
              <ArrowLeft
                aria-hidden="true"
              />

              <span
                className={styles.mobileBack}
              >
                Back
              </span>

              <span
                className={styles.desktopBack}
              >
                Back to Match Setup
              </span>
            </Link>

            <Brand />
          </header>

          <section
            className={styles.matchHeader}
          >
            <div>
              <h1>
                {match.name ??
                  "Scrabble Match"}
              </h1>

              <p>
                Round {roundNumber}
                {" "}
                <span>
                  • Standard Scrabble
                  rules apply.
                </span>
              </p>
            </div>

            <span
              className={styles.statusBadge}
            >
              <span
                className={styles.mobileStatus}
              >
                In Progress
              </span>

              <span
                className={styles.desktopStatus}
              >
                Active Play
              </span>
            </span>
          </section>

          <section
            className={styles.currentTurnCard}
          >
            <div
              className={styles.currentTurnTop}
            >
              <span>
                Current Turn
              </span>

              <strong>
                ●{" "}
                {currentPlayer
                  ?.displayName ??
                  "Player"}
              </strong>
            </div>

            <h2>
              {currentPlayer
                ?.displayName ??
                "Player"}
              &apos;s Turn
            </h2>

            <p>
              Enter the tiles you played,
              then every word you made.
            </p>
          </section>

          {lastTurn ? (
            <section
              className={styles.successBanner}
            >
              <span
                className={styles.successIcon}
              >
                <Check />
              </span>

              <span>
                <strong>
                  {lastTurn.points}
                  {" "}
                  points recorded
                </strong>

                <small>
                  {lastTurn.player
                    .displayName}
                  , collect{" "}
                  {
                    lastTurn
                      .replacementTileCount
                  }{" "}
                  tiles.
                </small>
              </span>
            </section>
          ) : null}

          {currentPlayer ? (
            <MultiWordTurnWorkflow
              key={`${match.id}-${currentPlayer.id}-${completedTurnCount}`}
              currentPlayerId={
                currentPlayer.id
              }
              isSubmitting={
                isSubmitting
              }
              onSubmit={
                submitMultiWordTurn
              }
            />
          ) : null}

          <section
            className={styles.mobileStandingsCard}
          >
            <div
              className={styles.mobileStandingsTitle}
            >
              <span>
                Standings
                {" "}
                (Scores Concealed)
              </span>

              <LockKeyhole />
            </div>

            <Standings
              match={match}
            />
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

          <div
            className={styles.secondaryActions}
          >
            <button
              type="button"
              onClick={() => {
                showUnavailable(
                  "Pass Turn",
                );
              }}
            >
              Pass Turn
            </button>

            <button
              type="button"
              onClick={() => {
                showUnavailable(
                  "Exchange Tiles",
                );
              }}
            >
              Exchange Tiles
            </button>

            <button
              type="button"
              onClick={() => {
                openEndMatchModal();
              }}
            >
              <span
                className={styles.mobileEndLabel}
              >
                End Match
              </span>

              <span
                className={styles.desktopEndLabel}
              >
                End Match / Resign
              </span>
            </button>
          </div>
        </section>
      </div>
      <EndMatchModal
        isOpen={
          isEndMatchModalOpen
        }
        isLoading={
          isEndingMatch
        }
        errorMessage={
          endMatchError
        }
        matchName={
          match.name ??
          "Scrabble Match"
        }
        roundNumber={
          roundNumber
        }
        playerCount={
          match.playerCount
        }        players={
          match.players
        }

        onClose={
          closeEndMatchModal
        }
        onConfirm={
          confirmEndMatch
        }
      />

    </main>
  );
}
