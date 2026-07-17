"use client";

import Link from "next/link";

import {
  AlertTriangle,
  LoaderCircle,
} from "lucide-react";

import type {
  MatchSummary,
} from "@/features/guest/guest.api";

import styles from "./welcome-guest-session-screen.module.css";

interface WelcomeGuestSessionScreenProps {
  match: MatchSummary;
  onResume: () => void;
  onOverwrite: () => void;
  isOverwriting?: boolean;
}

function GuestSessionBrand() {
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

export function WelcomeGuestSessionScreen({
  match,
  onResume,
  onOverwrite,
  isOverwriting = false,
}: WelcomeGuestSessionScreenProps) {
  const playerCount =
    match.players?.length ??
    match.playerCount ??
    0;

  return (
    <main
      className={styles.page}
    >
      <div
        className={styles.shell}
      >
        <GuestSessionBrand />

        <p
          className={styles.sessionLabel}
        >
          Active Session Found
        </p>

        <article
          className={styles.matchCard}
        >
          <div
            className={styles.matchHeader}
          >
            <span
              className={styles.activeBadge}
            >
              Active Match
            </span>

            <span
              className={styles.hiddenScore}
            >
              Scores Hidden
              <span aria-hidden="true">
                🔒
              </span>
            </span>
          </div>

          <div
            className={styles.matchDetails}
          >
            <h1>
              {match.name}
            </h1>

            <p>
              {playerCount === 1
                ? "1 player active"
                : `${playerCount} players active`}
            </p>
          </div>

          <button
            type="button"
            className={styles.resumeButton}
            disabled={isOverwriting}
            onClick={onResume}
          >
            Resume Match
          </button>
        </article>

        <section
          className={styles.overwriteCard}
        >
          <div
            className={styles.overwriteHeader}
          >
            <h2>
              Start New Match
            </h2>

            <span
              className={styles.warningLabel}
            >
              <AlertTriangle
                aria-hidden="true"
              />

              Overwrites active game
            </span>
          </div>

          <p>
            Starting a new session will
            permanently clear your current
            Guest game &ldquo;{match.name}&rdquo;.
          </p>

          <button
            type="button"
            className={styles.overwriteButton}
            disabled={isOverwriting}
            onClick={onOverwrite}
          >
            {isOverwriting ? (
              <>
                <LoaderCircle
                  className={styles.spinner}
                  aria-hidden="true"
                />

                Starting…
              </>
            ) : (
              "Overwrite & Start Guest"
            )}
          </button>
        </section>
      </div>
    </main>
  );
}
