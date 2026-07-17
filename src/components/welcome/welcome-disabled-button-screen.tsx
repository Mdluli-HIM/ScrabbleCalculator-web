"use client";

import type {
  CSSProperties,
} from "react";

import {
  useState,
} from "react";

import Link from "next/link";

import {
  LoaderCircle,
} from "lucide-react";

import styles from "./welcome-disabled-button-screen.module.css";

interface WelcomeDisabledButtonScreenProps {
  onStartGuest: () => void;
  isStarting?: boolean;
}

interface TileProps {
  letter: string;
  points: number;
  rotation: number;
}

function WordTile({
  letter,
  points,
  rotation,
}: TileProps) {
  const style = {
    "--tile-rotation":
      `${rotation}deg`,
  } as CSSProperties;

  return (
    <span
      className={styles.wordTile}
      style={style}
      aria-hidden="true"
    >
      <strong>
        {letter}
      </strong>

      <small>
        {points}
      </small>
    </span>
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

      <span
        className={styles.brandName}
      >
        Scrabble Calculator
      </span>
    </Link>
  );
}

function WordArtwork() {
  const tiles = [
    ["W", 4, -11],
    ["O", 1, 7],
    ["R", 1, -3],
    ["D", 2, 9],
    ["S", 1, -2],
  ] as const;

  return (
    <div
      className={styles.artwork}
      aria-hidden="true"
    >
      <div
        className={styles.wordTileRow}
      >
        {tiles.map(
          (
            [
              letter,
              points,
              rotation,
            ],
          ) => (
            <WordTile
              key={letter}
              letter={letter}
              points={points}
              rotation={rotation}
            />
          ),
        )}
      </div>

      <span
        className={styles.concealedBadge}
      >
        Scores Concealed

        <span>
          🔒
        </span>
      </span>
    </div>
  );
}

export function WelcomeDisabledButtonScreen({
  onStartGuest,
  isStarting = false,
}: WelcomeDisabledButtonScreenProps) {
  const [
    hasAcceptedTerms,
    setHasAcceptedTerms,
  ] = useState(false);

  const isDisabled =
    !hasAcceptedTerms ||
    isStarting;

  return (
    <main
      className={styles.page}
    >
      <div
        className={styles.shell}
      >
        <Brand />

        <WordArtwork />

        <section
          className={styles.hero}
        >
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

        <section
          className={styles.termsSection}
        >
          <label
            className={styles.termsLabel}
          >
            <input
              type="checkbox"
              className={styles.checkboxInput}
              checked={hasAcceptedTerms}
              onChange={(event) => {
                setHasAcceptedTerms(
                  event.target.checked,
                );
              }}
            />

            <span
              className={styles.checkbox}
              aria-hidden="true"
            >
              {hasAcceptedTerms
                ? "✓"
                : ""}
            </span>

            <span
              className={styles.termsText}
            >
              <strong>
                I agree to the Terms of Play
              </strong>

              <small>
                Accept rules regarding
                concealed score tallies.
              </small>
            </span>
          </label>

          <button
            type="button"
            className={styles.startButton}
            disabled={isDisabled}
            onClick={onStartGuest}
          >
            {isStarting ? (
              <>
                <LoaderCircle
                  className={styles.spinner}
                  aria-hidden="true"
                />

                Starting…
              </>
            ) : (
              "Start as Guest"
            )}
          </button>

          {!hasAcceptedTerms ? (
            <p
              className={styles.validationMessage}
              role="alert"
            >
              Please accept the terms to
              continue.
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
