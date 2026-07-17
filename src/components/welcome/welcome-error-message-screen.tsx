"use client";

import type {
  CSSProperties,
} from "react";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import {
  useMutation,
} from "@tanstack/react-query";

import {
  LoaderCircle,
} from "lucide-react";

import {
  createGuestSession,
} from "@/features/guest/guest.api";

import {
  clearActiveMatchId,
  saveGuestSessionToken,
} from "@/lib/session/browser-session";

import styles from "./welcome-error-message-screen.module.css";

interface ArtworkTileProps {
  letter: string;
  points: number;
  rotation: number;
}

function ArtworkTile({
  letter,
  points,
  rotation,
}: ArtworkTileProps) {
  const style = {
    "--error-tile-rotation":
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

function ErrorStateBrand() {
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

function ErrorStateArtwork() {
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
            <ArtworkTile
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

export function WelcomeErrorMessageScreen() {
  const router =
    useRouter();

  const guestMutation =
    useMutation({
      mutationFn:
        createGuestSession,

      onSuccess: (session) => {
        saveGuestSessionToken(
          session.guestSessionToken,
        );

        clearActiveMatchId();

        router.push(
          "/matches/new",
        );
      },
    });

  return (
    <main
      className={styles.page}
    >
      <div
      className={styles.shell}
      >
        <ErrorStateBrand />

        <ErrorStateArtwork />

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
          className={styles.actions}
        >
          <button
            type="button"
            className={styles.guestButton}
            disabled={
              guestMutation.isPending
            }
            onClick={() => {
              guestMutation.mutate();
            }}
          >
            {guestMutation.isPending ? (
              <>
                <LoaderCircle
                  className={styles.spinner}
                  aria-hidden="true"
                />

                Starting…
              </>
            ) : (
              "Start as guest"
            )}
          </button>

          <div
            className={styles.errorMessage}
            role="alert"
            aria-live="assertive"
          >
            <span
              aria-hidden="true"
              className={styles.errorEmoji}
            >
              🚨
            </span>

            <span
              className={styles.visuallyHidden}
            >
              Something went wrong while
              starting the guest session.
              Please try again.
            </span>
          </div>

          <nav
            className={styles.accountActions}
            aria-label="Account actions"
          >
            <Link
              href="/sign-in"
              className={styles.signInButton}
            >
              Sign In
            </Link>

            <Link
              href="/create-account"
              className={styles.registerButton}
            >
              Register
            </Link>
          </nav>
        </section>
      </div>
    </main>
  );
}
