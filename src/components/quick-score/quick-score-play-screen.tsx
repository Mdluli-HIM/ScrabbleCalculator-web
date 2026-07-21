"use client";

import {
  ArrowLeft,
  Flag,
  RotateCcw,
  Trophy,
  Undo2,
  UsersRound,
} from "lucide-react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  type FormEvent,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import {
  getQuickScoreGameSnapshot,
  getQuickScoreServerSnapshot,
  makeQuickScoreId,
  saveQuickScoreGame,
  subscribeQuickScoreGame,
} from "@/features/quick-score/quick-score.storage";

import styles from "./quick-score.module.css";

export function QuickScorePlayScreen() {
  const router =
    useRouter();

  const game =
    useSyncExternalStore(
      subscribeQuickScoreGame,
      getQuickScoreGameSnapshot,
      getQuickScoreServerSnapshot,
    );

  const [
    scoreInput,
    setScoreInput,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (
      game?.status ===
      "COMPLETED"
    ) {
      router.replace(
        "/quick-score/results",
      );
    }
  }, [
    game?.status,
    router,
  ]);

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
            No Quick Score game
          </h1>

          <p>
            Add the player names before
            starting the scoreboard.
          </p>

          <Link
            href="/quick-score"
            className={
              styles.primaryLink
            }
          >
            Add Players
          </Link>
        </div>
      </main>
    );
  }

  if (
    game.status ===
    "COMPLETED"
  ) {
    return null;
  }

  const activeGame = game;

  const currentPlayer =
    activeGame.players[
      activeGame.currentPlayerIndex
    ];

  const roundNumber =
    Math.floor(
      activeGame.turns.length /
        activeGame.players.length,
    ) + 1;

  const highestScore =
    Math.max(
      ...activeGame.players.map(
        (player) =>
          player.score,
      ),
    );

  const hasLeader =
    activeGame.turns.length > 0;

  const recentTurns =
    [...activeGame.turns]
      .reverse()
      .slice(0, 8);

  function applyScore(
    points: number,
  ): void {
    if (!currentPlayer) {
      return;
    }

    const nextPlayerIndex =
      (
        activeGame.currentPlayerIndex +
        1
      ) %
      activeGame.players.length;

    saveQuickScoreGame({
      ...activeGame,

      currentPlayerIndex:
        nextPlayerIndex,

      players:
        activeGame.players.map(
          (player) =>
            player.id ===
            currentPlayer.id
              ? {
                  ...player,

                  score:
                    player.score +
                    points,
                }
              : player,
        ),

      turns: [
        ...activeGame.turns,
        {
          id:
            makeQuickScoreId(
              "quick-turn",
            ),

          turnNumber:
            activeGame.turns.length +
            1,

          playerId:
            currentPlayer.id,

          playerName:
            currentPlayer.name,

          points,

          createdAt:
            new Date()
              .toISOString(),
        },
      ],
    });

    setScoreInput("");
    setErrorMessage(null);
  }

  function submitScore(
    event: FormEvent<
      HTMLFormElement
    >,
  ): void {
    event.preventDefault();

    if (!scoreInput.trim()) {
      setErrorMessage(
        "Enter the points scored this turn.",
      );

      return;
    }

    const points =
      Number(scoreInput);

    if (
      !Number.isInteger(points) ||
      points < 0 ||
      points > 999
    ) {
      setErrorMessage(
        "Enter a whole number from 0 to 999.",
      );

      return;
    }

    applyScore(points);
  }

  function undoLastTurn():
    void {
    const lastTurn =
      activeGame.turns[
        activeGame.turns.length - 1
      ];

    if (!lastTurn) {
      return;
    }

    const previousPlayerIndex =
      activeGame.players.findIndex(
        (player) =>
          player.id ===
          lastTurn.playerId,
      );

    saveQuickScoreGame({
      ...activeGame,

      currentPlayerIndex:
        previousPlayerIndex >= 0
          ? previousPlayerIndex
          : 0,

      players:
        activeGame.players.map(
          (player) =>
            player.id ===
            lastTurn.playerId
              ? {
                  ...player,

                  score:
                    player.score -
                    lastTurn.points,
                }
              : player,
        ),

      turns:
        activeGame.turns.slice(
          0,
          -1,
        ),
    });

    setScoreInput("");
    setErrorMessage(null);
  }

  function endGame():
    void {
    const confirmed =
      window.confirm(
        "End this game and show the final standings?",
      );

    if (!confirmed) {
      return;
    }

    saveQuickScoreGame({
      ...activeGame,
      status: "COMPLETED",
      completedAt:
        new Date().toISOString(),
    });

    router.push(
      "/quick-score/results",
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
            href="/quick-score"
            className={
              styles.backLink
            }
          >
            <ArrowLeft
              aria-hidden="true"
            />

            Setup
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

          <span
            className={
              styles.liveBadge
            }
          >
            Live
          </span>
        </header>

        <section
          className={
            styles.scoreHeader
          }
        >
          <p
            className={styles.eyebrow}
          >
            Current scores
          </p>

          <h1>
            Everyone can see the score
          </h1>

          <p>
            Round {roundNumber}
            {" · "}
            Turn{" "}
            {activeGame.turns.length + 1}
          </p>
        </section>

        <section
          className={
            styles.scoreGrid
          }
        >
          {activeGame.players.map(
            (
              player,
              index,
            ) => {
              const isCurrent =
                index ===
                activeGame.currentPlayerIndex;

              const isLeader =
                hasLeader &&
                player.score ===
                  highestScore;

              return (
                <article
                  key={player.id}
                  className={`${styles.scoreCard} ${
                    isCurrent
                      ? styles.scoreCardCurrent
                      : ""
                  }`}
                >
                  <div
                    className={
                      styles.scoreMeta
                    }
                  >
                    <span>
                      Player{" "}
                      {player.turnOrder}
                    </span>

                    {isLeader ? (
                      <small>
                        <Trophy
                          aria-hidden="true"
                        />

                        Leading
                      </small>
                    ) : null}
                  </div>

                  <strong>
                    {player.name}
                  </strong>

                  <div
                    className={
                      styles.scoreValue
                    }
                  >
                    {player.score}
                  </div>

                  {isCurrent ? (
                    <span
                      className={
                        styles.currentLabel
                      }
                    >
                      Current turn
                    </span>
                  ) : null}
                </article>
              );
            },
          )}
        </section>

        <section
          className={
            styles.currentPanel
          }
        >
          <div
            className={
              styles.roundBadge
            }
          >
            Round {roundNumber}
          </div>

          <h2
            className={
              styles.turnTitle
            }
          >
            {currentPlayer?.name}
            &apos;s turn
          </h2>

          <p>
            How many points did{" "}
            {currentPlayer?.name} score?
          </p>

          <form
            className={
              styles.scoreForm
            }
            onSubmit={submitScore}
          >
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={999}
              step={1}
              value={scoreInput}
              className={
                styles.scoreInput
              }
              placeholder="24"
              aria-label="Points scored"
              onChange={(
                event,
              ) => {
                setScoreInput(
                  event.target.value,
                );

                setErrorMessage(null);
              }}
            />

            <button
              type="submit"
              className={
                styles.submitButton
              }
            >
              Add Score & Next Player
            </button>
          </form>

          {errorMessage ? (
            <p
              className={styles.error}
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <div
            className={
              styles.quickActions
            }
          >
            <button
              type="button"
              className={
                styles.secondaryAction
              }
              onClick={() => {
                applyScore(0);
              }}
            >
              <RotateCcw
                aria-hidden="true"
              />

              Pass Turn
            </button>

            <button
              type="button"
              className={
                styles.secondaryAction
              }
              disabled={
                activeGame.turns.length === 0
              }
              onClick={
                undoLastTurn
              }
            >
              <Undo2
                aria-hidden="true"
              />

              Undo Last
            </button>

            <button
              type="button"
              className={
                styles.dangerAction
              }
              onClick={endGame}
            >
              <Flag
                aria-hidden="true"
              />

              End Game
            </button>
          </div>
        </section>

        <section
          className={
            styles.historyCard
          }
        >
          <div
            className={
              styles.historyHeader
            }
          >
            <h2>
              Recent turns
            </h2>

            <span>
              {activeGame.turns.length}
              {" "}total
            </span>
          </div>

          {recentTurns.length ? (
            <div
              className={
                styles.historyList
              }
            >
              {recentTurns.map(
                (turn) => (
                  <article
                    key={turn.id}
                    className={
                      styles.historyItem
                    }
                  >
                    <span>
                      Turn{" "}
                      {turn.turnNumber}
                    </span>

                    <strong>
                      {turn.playerName}
                    </strong>

                    <b>
                      +{turn.points}
                    </b>
                  </article>
                ),
              )}
            </div>
          ) : (
            <p
              className={
                styles.historyEmpty
              }
            >
              Scores entered during the
              game will appear here.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
