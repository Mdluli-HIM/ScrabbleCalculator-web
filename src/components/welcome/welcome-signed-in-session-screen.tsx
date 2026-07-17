"use client";

import Link from "next/link";

import {
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";

import type {
  MatchSummary,
} from "@/features/guest/guest.api";

import styles from "./welcome-signed-in-session-screen.module.css";

interface WelcomeSignedInSessionScreenProps {
  displayName: string;
  membershipLabel?: string;
  match: MatchSummary;
  currentRound?: number;
  totalRounds?: number;
  updatedLabel?: string;
  recordedPlayers?: string[];
  onContinue: () => void;
  onStartNew: () => void;
  isStartingNew?: boolean;
}

function SignedInBrand() {
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

export function WelcomeSignedInSessionScreen({
  displayName,
  membershipLabel = "Pro Member",
  match,
  currentRound = 7,
  totalRounds = 12,
  updatedLabel = "2 hrs ago",
  recordedPlayers = [
    "Player 1 (You)",
    "Player 2",
  ],
  onContinue,
  onStartNew,
  isStartingNew = false,
}: WelcomeSignedInSessionScreenProps) {
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
        <header
          className={styles.accountHeader}
        >
          <div
            className={styles.userIdentity}
          >
            <span
              className={styles.avatar}
              aria-hidden="true"
            />

            <span>
              Welcome back, {displayName}
            </span>
          </div>

          <span
            className={styles.membershipBadge}
          >
            {membershipLabel}
          </span>
        </header>

        <SignedInBrand />

        <article
          className={styles.matchCard}
        >
          <div
            className={styles.matchStatusRow}
          >
            <div
              className={styles.statusGroup}
            >
              <span
                className={styles.savedBadge}
              >
                Saved Match
              </span>

              <span
                className={styles.hiddenScore}
              >
                Score Hidden

                <LockKeyhole
                  aria-hidden="true"
                />
              </span>
            </div>

            <span
              className={styles.roundLabel}
            >
              Round {currentRound} of {totalRounds}
            </span>
          </div>

          <div
            className={styles.matchSummary}
          >
            <h1>
              {match.name}
            </h1>

            <p>
              {playerCount} players active
              <span aria-hidden="true">
                •
              </span>
              Last updated {updatedLabel}
            </p>
          </div>

          <div
            className={styles.recordedPlayers}
          >
            {recordedPlayers.map(
              (player) => (
                <div
                  key={player}
                  className={styles.recordedPlayer}
                >
                  <strong>
                    {player}
                  </strong>

                  <span
                    className={styles.recordedStatus}
                  >
                    <LockKeyhole
                      aria-hidden="true"
                    />

                  Recorded
                  </span>
                </div>
              ),
            )}
          </div>

          <button
            type="button"
            className={styles.continueButton}
            disabled={isStartingNew}
            onClick={onContinue}
          >
            Continue Tournament
          </button>
        </article>

        <section
          className={styles.newMatchSection}
        >
          <button
            type="button"
            className={styles.newMatchButton}
            disabled={isStartingNew}
            onClick={onStartNew}
          >
            {isStartingNew ? (
              <>
                <LoaderCircle
                  className={styles.spinner}
                  aria-hidden="true"
                />

                Starting…
              </>
            ) : (
              "Start New Match"
            )}
          </button>

          <p>
            Your active match will be
            archived in your Match History.
        </p>
        </section>
      </div>
    </main>
  );
}
