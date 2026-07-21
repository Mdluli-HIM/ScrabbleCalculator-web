"use client";

import {
  ArrowLeft,
  Plus,
  Trash2,
  UsersRound,
  Zap,
} from "lucide-react";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import {
  useState,
} from "react";

import {
  createQuickScoreGame,
  makeQuickScoreId,
  saveQuickScoreGame,
} from "@/features/quick-score/quick-score.storage";

import styles from "./quick-score.module.css";

interface PlayerField {
  id: string;
  value: string;
}

function createPlayerField():
  PlayerField {
  return {
    id:
      makeQuickScoreId(
        "player-field",
      ),

    value: "",
  };
}

export function QuickScoreSetupScreen() {
  const router =
    useRouter();

  const [
    players,
    setPlayers,
  ] = useState<
    PlayerField[]
  >(() => [
    createPlayerField(),
    createPlayerField(),
  ]);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<
    string | null
  >(null);

  function updatePlayer(
    id: string,
    value: string,
  ): void {
    setPlayers(
      (current) =>
        current.map(
          (player) =>
            player.id === id
              ? {
                  ...player,
                  value,
                }
              : player,
        ),
    );

    setErrorMessage(null);
  }

  function addPlayer():
    void {
    if (players.length >= 8) {
      setErrorMessage(
        "Quick Score supports up to 8 players.",
      );

      return;
    }

    setPlayers(
      (current) => [
        ...current,
        createPlayerField(),
      ],
    );

    setErrorMessage(null);
  }

  function removePlayer(
    id: string,
  ): void {
    if (players.length <= 2) {
      return;
    }

    setPlayers(
      (current) =>
        current.filter(
          (player) =>
            player.id !== id,
        ),
    );

    setErrorMessage(null);
  }

  function startGame():
    void {
    const names =
      players.map(
        (player) =>
          player.value.trim(),
      );

    if (
      names.some(
        (name) => !name,
      )
    ) {
      setErrorMessage(
        "Enter a name for every player or remove the empty player.",
      );

      return;
    }

    const normalizedNames =
      names.map(
        (name) =>
          name.toLocaleLowerCase(),
      );

    if (
      new Set(
        normalizedNames,
      ).size !==
      normalizedNames.length
    ) {
      setErrorMessage(
        "Each player must have a different name.",
      );

      return;
    }

    saveQuickScoreGame(
      createQuickScoreGame(
        names,
      ),
    );

    router.push(
      "/quick-score/play",
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

            Back
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
          className={styles.header}
        >
          <div
            className={
              styles.headerIcon
            }
          >
            <Zap
              aria-hidden="true"
            />
          </div>

          <p
            className={styles.eyebrow}
          >
            Simple scoring
          </p>

          <h1>
            Who is playing?
          </h1>

          <p>
            Enter player names. During
            the game, everyone will see
            the live scores.
          </p>
        </section>

        <section
          className={
            styles.setupCard
          }
        >
          <div
            className={
              styles.sectionTitle
            }
          >
            <div>
              <UsersRound
                aria-hidden="true"
              />

              <span>Players</span>
            </div>

            <small>
              {players.length}/8
            </small>
          </div>

          <div
            className={
              styles.playerList
            }
          >
            {players.map(
              (
                player,
                index,
              ) => (
                <div
                  key={player.id}
                  className={
                    styles.playerRow
                  }
                >
                  <span
                    className={
                      styles.playerNumber
                    }
                  >
                    {index + 1}
                  </span>

                  <input
                    type="text"
                    value={
                      player.value
                    }
                    maxLength={30}
                    autoComplete="off"
                    placeholder={`Player ${
                      index + 1
                    } name`}
                    aria-label={`Player ${
                      index + 1
                    } name`}
                    onChange={(
                      event,
                    ) => {
                      updatePlayer(
                        player.id,
                        event.target
                          .value,
                      );
                    }}
                  />

                  <button
                    type="button"
                    className={
                      styles.removeButton
                    }
                    disabled={
                      players.length <= 2
                    }
                    aria-label={`Remove player ${
                      index + 1
                    }`}
                    onClick={() => {
                      removePlayer(
                        player.id,
                      );
                    }}
                  >
                    <Trash2
                      aria-hidden="true"
                    />
                  </button>
                </div>
              ),
            )}
          </div>

          <button
            type="button"
            className={
              styles.addButton
            }
            disabled={
              players.length >= 8
            }
            onClick={addPlayer}
          >
            <Plus
              aria-hidden="true"
            />

            Add another player
          </button>

          {errorMessage ? (
            <p
              className={styles.error}
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <button
            type="button"
            className={
              styles.primaryButton
            }
            onClick={startGame}
          >
            Start Quick Score
          </button>

          <p
            className={
              styles.setupNote
            }
          >
            No accounts, words, tiles or
            board bonuses are required.
          </p>
        </section>
      </div>
    </main>
  );
}
