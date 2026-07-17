"use client";

import type {
  CSSProperties,
} from "react";

import styles from "./welcome-loading-screen.module.css";

interface TileProps {
  letter: string;
  points: number;
  rotation: number;
}

function Tile({
  letter,
  points,
  rotation,
}: TileProps) {
  const style = {
    "--rotation": `${rotation}deg`,
  } as CSSProperties;

  return (
    <span
      className={styles.tile}
      style={style}
      aria-hidden="true"
    >
      <strong>{letter}</strong>
      <small>{points}</small>
    </span>
  );
}

export function WelcomeLoadingScreen() {
  const tiles = [
    ["W", 4, -11],
    ["O", 1, 7],
    ["R", 1, -3],
    ["D", 2, 9],
    ["S", 1, -2],
  ] as const;

  return (
    <main
      className={styles.page}
      role="status"
      aria-live="polite"
    >
      <div className={styles.frame}>
        <div className={styles.brand}>
          <span className={styles.logoTiles}>
            <span className={styles.logoTile}>
              <strong>S</strong>
              <small>1</small>
            </span>

            <span className={styles.logoTile}>
              <strong>C</strong>
              <small>3</small>
            </span>
          </span>

          <span className={styles.brandName}>
            Scrabble Calculator
          </span>
        </div>

        <div
          className={styles.artwork}
          aria-hidden="true"
        >
          <div className={styles.tileRow}>
            {tiles.map(
              (
                [
                  letter,
                  points,
                  rotation,
                ],
              ) => (
                <Tile
                  key={letter}
                  letter={letter}
                  points={points}
                  rotation={rotation}
                />
              ),
            )}
          </div>

          <span className={styles.badge}>
            Scores Concealed 🔒
          </span>
        </div>

        <section className={styles.hero}>
          <h1>
            Track every word. Reveal at
            the end.
          </h1>

          <p>
            Scores stay hidden until the
            match is over — no peeking at
            your opponents&apos; tallies.
          </p>
        </section>

        <section className={styles.loadingCard}>
          <div className={styles.loadingButton}>
            <span className={styles.pulse} />

            <strong>
              Setting up match…
            </strong>
          </div>

          <p>
            Generating guest board,
            please hold.
          </p>
        </section>

        <div className={styles.disabledActions}>
          <button type="button" disabled>
            Sign In
          </button>

          <button
            type="button"
            disabled
            className={styles.createAccount}
          >
            Create Account
          </button>
        </div>
      </div>
    </main>
  );
}
