"use client";

import Link from "next/link";

import {
  AlertTriangle,
  LoaderCircle,
} from "lucide-react";

import styles from "./welcome-api-unavailable-screen.module.css";

interface WelcomeApiUnavailableScreenProps {
  onStartGuest: () => void;
  onTryAgain: () => void;
  isStarting?: boolean;
  isRetrying?: boolean;
}

function ApiUnavailableBrand() {
  return (
    <Link
      href="/"
      className={styles.apiBrand}
      aria-label="Scrabble Calculator home"
    >
      <span
        className={styles.apiBrandTiles}
        aria-hidden="true"
      >
        <span
          className={styles.apiLogoTile}
        >
          <strong>S</strong>
          <small>1</small>
        </span>

        <span
          className={styles.apiLogoTile}
        >
          <strong>C</strong>
          <small>3</small>
        </span>
      </span>

      <span
        className={styles.apiBrandName}
      >
        Scrabble Calculator
      </span>
    </Link>
  );
}

export function WelcomeApiUnavailableScreen({
  onStartGuest,
  onTryAgain,
  isStarting = false,
  isRetrying = false,
}: WelcomeApiUnavailableScreenProps) {
  const isBusy =
    isStarting ||
    isRetrying;

  return (
    <main
      className={styles.apiPage}
    >
      <div
        className={styles.apiShell}
      >
        <ApiUnavailableBrand />

        <section
          className={styles.apiErrorCard}
          role="alert"
          aria-live="assertive"
        >
          <div
            className={styles.apiErrorHeading}
          >
            <AlertTriangle
              className={styles.apiErrorIcon}
              aria-hidden="true"
            />

            <strong>
              Connection Offline
            </strong>
          </div>

          <p>
            We can&apos;t reach the server
            right now. Please check your
            connection or try again in a
            moment.
          </p>
        </section>

        <section
          className={styles.apiHero}
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
          className={styles.apiActions}
        >
          <button
            type="button"
            className={styles.apiStartButton}
            disabled={isBusy}
            onClick={onStartGuest}
          >
            {isStarting ? (
              <>
                <LoaderCircle
                  className={styles.apiSpinner}
                  aria-hidden="true"
                />

                Connecting…
              </>
            ) : (
              "Start as Guest"
            )}
          </button>

          <button
            type="button"
            className={styles.apiRetryButton}
            disabled={isBusy}
            onClick={onTryAgain}
          >
            {isRetrying ? (
              <>
                <LoaderCircle
                  className={styles.apiSpinner}
                  aria-hidden="true"
                />

                Trying Again…
              </>
            ) : (
              "Try Again"
            )}
          </button>

          <Link
            href="/sign-in"
            className={styles.apiAccountLink}
          >
            Sign In or Register
          </Link>
        </section>
      </div>
    </main>
  );
}
