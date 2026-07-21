"use client";

import {
  ArrowLeft,
  Medal,
  RotateCcw,
  Trophy,
  UsersRound,
} from "lucide-react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  useSyncExternalStore,
} from "react";

import {
  clearQuickScoreGame,
  createQuickScoreGame,
  getQuickScoreGameSnapshot,
  getQuickScoreServerSnapshot,
  saveQuickScoreGame,
  subscribeQuickScoreGame,
} from "@/features/quick-score/quick-score.storage";

import styles from "./quick-score.module.css";

export function QuickScoreResultsScreen() {
  const router =
    useRouter();

  const game =
    useSyncExternalStore(
      subscribeQuickScoreGame,
      getQuickScoreGameSnapshot,
      getQuickScoreServerSnapshot,
    );

  if (!game) {
    return (
      <main
        className={styles.page}
      >
        <div
          className={
            styles.emptyCard
          }
        >
          <UsersRound
            aria-hidden="true"
          />

          <h1>
            No results available
          </h1>

          <Link
            href="/quick-score"
            className={
              styles.primaryLink
            }
          >
            Start Quick Score
          </Link>
        </div>
      </main>
    );
  }

  if (
    game.status !==
    "COMPLETED"
  ) {
    return (
      <main
        className={styles.page}
      >
        <div
          className={
            styles.emptyCard
          }
        >
          <Trophy
            aria-hidden="true"
          />

          <h1>
            The game is still active
          </h1>

          <Link
            href="/quick-score/play"
            className={
              styles.primaryLink
            }
          >
            Return to Game
          </Link>
        </div>
      </main>
    );
  }

  const completedGame = game;

  const standings =
    [...completedGame.players].sort(
      (
        first,
        second,
      ) =>
        second.score -
          first.score ||
        first.turnOrder -
          second.turnOrder,
    );

  const uniqueScores =
    Array.from(
      new Set(
        standings.map(
          (player) =>
            player.score,
        ),
      ),
    );

  const rankedStandings =
    standings.map(
      (player) => ({
        ...player,

        rank:
          uniqueScores.indexOf(
            player.score,
          ) + 1,
      }),
    );

  const winningScore =
    standings[0]?.score ?? 0;

  const winners =
    standings.filter(
      (player) =>
        player.score ===
        winningScore,
    );

  const winnerNames =
    winners
      .map(
        (player) =>
          player.name,
      )
      .join(" & ");

  const highestTurn =
    completedGame.turns.reduce<
      (typeof completedGame.turns)[number]
      | null
    >(
      (
        highest,
        turn,
      ) =>
        !highest ||
        turn.points >
          highest.points
          ? turn
          : highest,
      null,
    );

  function playAgain():
    void {
    saveQuickScoreGame(
      createQuickScoreGame(
        completedGame.players.map(
          (player) =>
            player.name,
        ),
      ),
    );

    router.push(
      "/quick-score/play",
    );
  }

  function chooseNewPlayers():
    void {
    clearQuickScoreGame();

    router.push(
      "/quick-score",
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
          className={styles.topbar}
        >
          <Link
            href="/"
            className={
              styles.backLink
            }
          >
            <ArrowLeft
              aria-hidden="true"
            />

            Home
          </Link>

          <div
            className={styles.brand}
          >
            <span>S</span>
            <span>C</span>

            <strong>
              Quick Score
            </strong>
          </div>
        </header>

        <section
          className={
            styles.resultsHero
          }
        >
          <div
            className={
              styles.winnerIcon
            }
          >
            <Trophy
              aria-hidden="true"
            />
          </div>

          <p
            className={styles.eyebrow}
          >
            Game completed
          </p>

          <h1>
            {winners.length > 1
              ? `${winnerNames} tie`
              : `${winnerNames} wins`}
          </h1>

          <strong>
            {winningScore}
            {" "}points
          </strong>
        </section>

        <section
          className={
            styles.standingsCard
          }
        >
          <div
            className={
              styles.sectionTitle
            }
          >
            <div>
              <Medal
                aria-hidden="true"
              />

              <span>
                Final standings
              </span>
            </div>
          </div>

          <div>
            {rankedStandings.map(
              (player) => (
                <article
                  key={player.id}
                  className={
                    styles.standingRow
                  }
                >
                  <span
                    className={
                      styles.rankBadge
                    }
                  >
                    {player.rank}
                  </span>

                  <strong>
                    {player.name}
                  </strong>

                  <b>
                    {player.score}
                    {" "}pts
                  </b>
                </article>
              ),
            )}
          </div>
        </section>

        <section
          className={
            styles.summaryGrid
          }
        >
          <article
            className={
              styles.summaryResultCard
            }
          >
            <span>
              Total turns
            </span>

            <strong>
              {completedGame.turns.length}
            </strong>
          </article>

          <article
            className={
              styles.summaryResultCard
            }
          >
            <span>
              Highest turn
            </span>

            <strong>
              {highestTurn
                ? `${highestTurn.points} pts`
                : "0 pts"}
            </strong>

            <small>
              {highestTurn?.playerName ??
                "No turns"}
            </small>
          </article>

          <article
            className={
              styles.summaryResultCard
            }
          >
            <span>
              Players
            </span>

            <strong>
              {completedGame.players.length}
            </strong>
          </article>
        </section>

        <section
          className={
            styles.resultActions
          }
        >
          <button
            type="button"
            className={
              styles.primaryButton
            }
            onClick={playAgain}
          >
            <RotateCcw
              aria-hidden="true"
            />

            Play Again
          </button>

          <button
            type="button"
            className={
              styles.secondaryResultButton
            }
            onClick={
              chooseNewPlayers
            }
          >
            Choose New Players
          </button>
        </section>
      </div>
    </main>
  );
}
