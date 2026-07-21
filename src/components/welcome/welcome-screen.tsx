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
  useQuery,
} from "@tanstack/react-query";

import {
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";

import {
  toast,
} from "sonner";

import {
  createGuestSession,
  listGuestMatches,
  type MatchSummary,
} from "@/features/guest/guest.api";

import {
  ApiClientError,
} from "@/lib/api/client";

import {
  clearActiveMatchId,
  clearGuestSessionToken,
  readGuestSessionToken,
  saveActiveMatchId,
  saveGuestSessionToken,
} from "@/lib/session/browser-session";

import {
  WelcomeLoadingScreen,
} from "./welcome-loading-screen";

import {
  WelcomeApiUnavailableScreen,
} from "./welcome-api-unavailable-screen";

import {
  WelcomeGuestSessionScreen,
} from "./welcome-guest-session-screen";

import {
  WelcomeSignedInSessionScreen,
} from "./welcome-signed-in-session-screen";

import {
  WelcomeDisabledButtonScreen,
} from "./welcome-disabled-button-screen";

import styles from "./welcome-screen.module.css";

const FIGMA_PREVIEW_MATCH: MatchSummary = {
  id: "figma-preview-match",
  name: "Sunday Game Night",
  status: "IN_PROGRESS",
  currentTurnOrder: 1,
  players: [
    {
      id: "preview-player-one",
      displayName: "Player One",
      turnOrder: 1,
    },
    {
      id: "preview-player-two",
      displayName: "Player Two",
      turnOrder: 2,
    },
    {
      id: "preview-player-three",
      displayName: "Player Three",
      turnOrder: 3,
    },
  ],
};

interface WelcomeScreenProps {
  forceEmptyState?: boolean;
  forceLoadingState?: boolean;
  forceApiUnavailableState?: boolean;
  forceGuestSessionState?: boolean;
  forceSignedInSessionState?: boolean;
  forceDisabledButtonState?: boolean;
}

interface TileProps {
  letter: string;
  points: number;
  rotation?: number;
  variant:
    | "logo"
    | "mobileWord"
    | "desktopScore";
}

function Tile({
  letter,
  points,
  rotation = 0,
  variant,
}: TileProps) {
  const style = {
    "--tile-rotation":
      `${rotation}deg`,
  } as CSSProperties;

  return (
    <span
      style={style}
      className={`${styles.tile} ${styles[variant]}`}
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
        className={styles.logoTiles}
      >
        <Tile
          letter="S"
          points={1}
          variant="logo"
        />

        <Tile
          letter="C"
          points={3}
          variant="logo"
        />
      </span>

      <span
        className={styles.brandName}
      >
        Scrabble Calculator
      </span>
    </Link>
  );
}

function MobileWordArtwork() {
  const tiles = [
    ["W", 4, -14],
    ["O", 1, 8],
    ["R", 1, -4],
    ["D", 2, 7],
  ] as const;

  return (
    <div
      className={styles.mobileArtwork}
      aria-hidden="true"
    >
      <div
        className={styles.mobileTileRow}
      >
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
              variant="mobileWord"
            />
          ),
        )}
      </div>

      <span
        className={styles.secretBadge}
      >
        Secret Score
        <span>🔒</span>
      </span>
    </div>
  );
}

function DesktopScoreArtwork() {
  const tiles = [
    ["S", 1, -6],
    ["C", 3, 4],
    ["O", 1, 6],
    ["R", 1, -11],
    ["E", 1, 8],
  ] as const;

  return (
    <div
      className={styles.desktopArtwork}
      aria-hidden="true"
    >
      <div
        className={styles.premiumLabels}
      >
        <span>
          Triple Word
        </span>

        <span>
          Double Letter
        </span>
      </div>

      <div
        className={styles.scoreTiles}
      >
        {tiles.map(
          (
            [
              letter,
              points,
              rotation,
            ],
            index,
          ) => (
            <Tile
              key={`${letter}-${index}`}
              letter={letter}
              points={points}
              rotation={rotation}             variant="desktopScore"
            />
          ),
        )}
      </div>

      <div
        className={styles.opponentCard}
      >
        <span
          className={styles.opponentLock}
        >
          <LockKeyhole />
        </span>

        <span
          className={styles.opponentText}
        >
          <strong>
            Opponent Score: ???
          </strong>

          <small>
            Calculated, secure and ready
            to unlock.
          </small>
        </span>
      </div>
    </div>
  );
}

interface MatchCardProps {
  match: MatchSummary;
  onResume: () => void;
  variant: "mobile" | "desktop";
}

function MatchCard({
  match,
  onResume,
  variant,
}: MatchCardProps) {
  const playerCount =
    match.players?.length ??
    match.playerCount ??
    0;

  return (
    <article
      className={`${styles.matchCard} ${
        variant === "desktop"
          ? styles.desktopMatchCard
          : styles.mobileMatchCard
      }`}
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
        className={styles.matchInformation}
      >
        <h2>
          {match.name}
        </h2>

        <p>
          {playerCount} players active
        </p>
      </div>

      <button
        type="button"
        className={styles.resumeButton}
        onClick={onResume}
      >
        Resume Match
      </button>
    </article>
  );
}

interface EmptyMatchCardProps {
  variant: "mobile" | "desktop";
}

function EmptyMatchCard({
  variant,
}: EmptyMatchCardProps) {
  return (
    <article
      className={`${styles.matchCard} ${
        variant === "desktop"
          ? styles.desktopMatchCard
          : styles.mobileMatchCard
      }`}
    >
      <span
        className={styles.emptyBadge}
      >
        No Saved Match
      </span>

      <div
        className={styles.matchInformation}
      >
        <h2>
          Start your first game
        </h2>

        <p>
          Your active match will appear
          here automatically.
        </p>
      </div>
    </article>
  );
}

function AccountActions({
  variant,
}: {
  variant: "mobile" | "desktop";
}) {
  return (
    <nav
      className={
        variant === "desktop"
          ? styles.desktopAccountActions
          : styles.mobileAccountActions
      }
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
        className={styles.createAccountButton}
      >
        Create Account
      </Link>
    </nav>
  );
}

export function WelcomeScreen({
  forceEmptyState = false,
  forceLoadingState = false,
  forceApiUnavailableState = false,
  forceGuestSessionState = false,
  forceSignedInSessionState = false,
  forceDisabledButtonState = false,
}: WelcomeScreenProps) {
  const router =
    useRouter();

  const activeMatchQuery =
    useQuery<MatchSummary | null>({
      queryKey: [
        "welcome",
        "active-match",
      ],

      retry: false,

      queryFn: async () => {
        const guestToken =
          readGuestSessionToken();

        if (!guestToken) {
          return null;
        }

        try {
          const matches =
            await listGuestMatches(
              guestToken,
            );

          const activeMatch =
            matches.find(
              (match) =>
                match.status ===
                "IN_PROGRESS",
            ) ?? null;

          if (activeMatch) {
            saveActiveMatchId(
              activeMatch.id,
            );
          } else {
            clearActiveMatchId();
          }

          return activeMatch;
        } catch (error) {
          if (
            error instanceof
              ApiClientError &&
            (
              error.status === 401 ||
              error.status === 409
            )
          ) {
            clearGuestSessionToken();
            clearActiveMatchId();

            return null;
          }

          throw error;
        }
      },
    });

  const visibleMatch =
    forceEmptyState
      ? null
      : (
          activeMatchQuery.data ??
          FIGMA_PREVIEW_MATCH
        );

  const guestMutation =
    useMutation({
      mutationFn:
        createGuestSession,

      onSuccess: (session) => {
        saveGuestSessionToken(
          session.guestSessionToken,
        );

        clearActiveMatchId();

        toast.success(
          "Guest session created.",
        );

        router.push(
          "/matches/new",
        );
      },

      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to start the guest session.",
        );
      },
    });

  function handleResume():
    void {
    if (!visibleMatch) {
      return;
    }

    if (
      visibleMatch.id ===
      FIGMA_PREVIEW_MATCH.id
    ) {
      toast.info(
        "Start as Guest to create your first real match.",
      );

      router.push(
        "/matches/new",
      );

      return;
    }

    saveActiveMatchId(
      visibleMatch.id,
    );

    router.push(
      `/matches/${visibleMatch.id}`,
    );
  }

  function handleStartGuest():
    void {
    guestMutation.mutate();
  }

  function handleTryAgain():
    void {
    guestMutation.reset();

    const guestToken =
      readGuestSessionToken();

    if (guestToken) {
      void activeMatchQuery.refetch();
      return;
    }

    guestMutation.mutate();
  }

  if (
    forceLoadingState ||
    guestMutation.isPending
  ) {
    return (
      <WelcomeLoadingScreen />
    );
  }

  if (forceDisabledButtonState) {
    return (
      <WelcomeDisabledButtonScreen
        onStartGuest={handleStartGuest}
        isStarting={
          guestMutation.isPending
        }
      />
    );
  }

  const showApiUnavailable =
    forceApiUnavailableState ||
    activeMatchQuery.isError ||
    guestMutation.isError;

  if (showApiUnavailable) {
    return (
      <WelcomeApiUnavailableScreen
        onStartGuest={handleStartGuest}
        onTryAgain={handleTryAgain}
        isStarting={
          guestMutation.isPending
        }
        isRetrying={
          activeMatchQuery.isFetching
        }
      />
    );
  }

  if (forceSignedInSessionState) {
    return (
      <WelcomeSignedInSessionScreen
        displayName="Alex"
        membershipLabel="Pro Member"
        match={{
          ...(visibleMatch ??
            FIGMA_PREVIEW_MATCH),
          name: "Tournament Practice",
          players: [
            {
              id: "signed-player-1",
              displayName: "Player 1",
              turnOrder: 1,
            },
            {
              id: "signed-player-2",
              displayName: "Player 2",
              turnOrder: 2,
            },
            {
              id: "signed-player-3",
              displayName: "Player 3",
              turnOrder: 3,
            },
            {
              id: "signed-player-4",
              displayName: "Player 4",
              turnOrder: 4,
            },
          ],
        }}
        currentRound={7}
        totalRounds={12}
        updatedLabel="2 hrs ago"
        recordedPlayers={[
          "Player 1 (You)",
          "Player 2",
        ]}
        onContinue={handleResume}
        onStartNew={handleStartGuest}
        isStartingNew={
          guestMutation.isPending
        }
      />
    );
  }

  if (forceGuestSessionState) {
    return (
      <WelcomeGuestSessionScreen
        match={
          visibleMatch ??
          FIGMA_PREVIEW_MATCH
        }
        onResume={handleResume}
        onOverwrite={handleStartGuest}
        isOverwriting={
          guestMutation.isPending
        }
      />
    );
  }

  return (
    <main
      className={styles.page}
    >
      <div
        className={styles.mobileView}
      >
        <Brand />

        <MobileWordArtwork />

        <section
          className={styles.mobileHero}
        >
          <h1>
            Track every word. Reveal at
            the end.
          </h1>

          <p>
            Scores stay hidden until the
            match is over — no peeking.
          </p>
        </section>

        <div
          className={styles.mobileActions}
        >
          {visibleMatch ? (
            <MatchCard
              match={visibleMatch}
              onResume={handleResume}
              variant="mobile"
            />
          ) : (
            <EmptyMatchCard
              variant="mobile"
            />
          )}

          <button
            type="button"
            className={styles.mobileGuestButton}
            disabled={
              guestMutation.isPending
            }
            onClick={handleStartGuest}
          >
            {guestMutation.isPending ? (
              <>
                <LoaderCircle
                  className={styles.spinner}
                />

                Starting…
              </>
            ) : (
              "Start as Guest"
            )}
          </button>
          <Link
            href="/quick-score"
            className={`${styles.mobileGuestButton} ${styles.quickScoreWelcomeButton}`}
          >
            Quick Score
          </Link>

          <AccountActions
            variant="mobile"
          />
        </div>
      </div>

      <div
        className={styles.desktopView}
      >
        <section
          className={styles.desktopLeft}
        >
          <Brand />

          <div
            className={styles.desktopHero}
          >
            <h1>
              Track every word.
              <br />
              Reveal at the end.
            </h1>

            <p>
              The premier companion for
              word game masters. Scores
              stay calculated in the
              background and remain
              completely hidden from
              opponents until the final
              tile is played. No peeking,
              just pure strategic
              wordplay.
            </p>
          </div>

          <div
            className={styles.savedSection}
          >
            <p
              className={styles.savedLabel}
            >
              Saved Session Detected
            </p>

            {visibleMatch ? (
              <MatchCard
                match={visibleMatch}
                onResume={handleResume}
                variant="desktop"
              />
            ) : (
              <EmptyMatchCard
                variant="desktop"
              />
            )}
          </div>

          <div
            className={styles.desktopActionRow}
          >
            <button
              type="button"
              className={styles.desktopGuestButton}
              disabled={
                guestMutation.isPending
              }
              onClick={handleStartGuest}
            >
              {guestMutation.isPending ? (
                <>
                  <LoaderCircle
                    className={styles.spinner}
                  />

                  Starting…
                </>
              ) : (
                "Start as Guest"
              )}
            </button>
            <Link
              href="/quick-score"
              className={`${styles.desktopGuestButton} ${styles.quickScoreWelcomeButton}`}
            >
              Quick Score
            </Link>

            <AccountActions
              variant="desktop"
            />
          </div>
        </section>

        <DesktopScoreArtwork />
      </div>
    </main>
  );
}
