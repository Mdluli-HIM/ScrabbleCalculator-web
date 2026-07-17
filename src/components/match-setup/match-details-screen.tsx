"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  useMutation,
} from "@tanstack/react-query";

import {
  toast,
} from "sonner";

import {
  ArrowLeft,
  BookOpen,
  Check,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";

import {
  saveGuestMatchDraft,
} from "@/features/match-setup/match-setup.api";

import {
  readMatchSetupDraft,
  saveMatchSetupDraft,
} from "@/features/match-setup/match-setup.storage";

import type {
  MatchSetupDraft,
} from "@/features/match-setup/match-setup.types";

import {
  readGuestSessionToken,
  saveActiveMatchId,
} from "@/lib/session/browser-session";

import styles from "./match-details-screen.module.css";

type PlayerCount =
  | 2
  | 3
  | 4;

interface MatchDetailsScreenProps {
  initialFilled?: boolean;
  showValidationError?: boolean;
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

interface PlayerCountSelectorProps {
  value: PlayerCount | null;
  onChange: (
    value: PlayerCount,
  ) => void;
}

function PlayerCountSelector({
  value,
  onChange,
}: PlayerCountSelectorProps) {
  const options: PlayerCount[] = [
    2,
    3,
    4,
  ];

  return (
    <fieldset
      className={styles.playerFieldset}
    >
      <legend>
        Number of Players
      </legend>

      <div
        className={styles.playerOptions}
      >
        {options.map(
          (option) => {
            const isSelected =
              value === option;

            return (
              <button
                key={option}
                type="button"
                className={`${styles.playerOption} ${
                  isSelected
                    ? styles.playerOptionSelected
                    : ""
                }`}
                aria-pressed={isSelected}
                onClick={() => {
                  onChange(option);
                }}
              >
                {option} Players
              </button>
            );
          },
        )}
      </div>
    </fieldset>
  );
}

function DictionaryCard() {
  return (
    <article
      className={styles.dictionaryCard}
    >
      <div
        className={styles.dictionaryTopRow}
      >
        <span
          className={styles.cardEyebrow}
        >
          Dictionary
        </span>

        <span
          className={styles.selectedIcon}
          aria-label="Dictionary selected"
        >
          <Check
            aria-hidden="true"
          />
        </span>
      </div>

      <h2>
        Local Starter Dictionary
      </h2>

      <p>
        Available offline and locked once
        the match starts.
      </p>

      <div
        className={styles.dictionaryDivider}
      />

      <small>
        More dictionary providers will be
        added later.
      </small>
    </article>
  );
}

function ConcealedScoreCard() {
  return (
    <article
      className={styles.concealedCard}
    >
      <span
        className={styles.concealedIcon}
        aria-hidden="true"
      >
        <LockKeyhole />
      </span>

      <span
        className={styles.concealedCopy}
      >
        <strong>
          Scores stay concealed
        </strong>

        <small>
          Players can see points earned
          during the current turn, but
          cumulative totals remain hidden
          until the match ends.
        </small>
      </span>
    </article>
  );
}

interface MatchPreviewProps {
  matchName: string;
  playerCount: PlayerCount | null;
}

function MatchPreview({
  matchName,
  playerCount,
}: MatchPreviewProps) {
  const previewName =
    matchName.trim() ||
    "Your Match";

  const playerText =
    playerCount
      ? `${playerCount} players active`
      : "Select number of players";

  return (
    <aside
      className={styles.previewCard}
      aria-label="Match preview"
    >
      <span
        className={styles.previewEyebrow}
      >
        Match Preview
      </span>

      <h2>
        {previewName}
      </h2>

      <p>
        {playerText}
      </p>

      <div
        className={styles.previewDivider}
      />

      <div
        className={styles.previewItem}
      >
        <BookOpen
          aria-hidden="true"
        />

        <span>
          Local Starter Dictionary
        </span>
      </div>

      <div
        className={styles.previewItem}
      >
        <LockKeyhole
          aria-hidden="true"
        />

        <span>
          Scores Concealed
        </span>
      </div>
    </aside>
  );
}

export function MatchDetailsScreen({
  initialFilled = false,
  showValidationError = false,
}: MatchDetailsScreenProps) {
  const router =
    useRouter();

  const [
    matchName,
    setMatchName,
  ] = useState(
    initialFilled
      ? "Sunday Game Night"
      : "",
  );

  const [
    playerCount,
    setPlayerCount,
  ] = useState<PlayerCount | null>(
    initialFilled
      ? 3
      : null,
  );

  const [
    matchId,
    setMatchId,
  ] = useState<string | null>(
    null,
  );

  const [
    hasSubmitted,
    setHasSubmitted,
  ] = useState(
    showValidationError,
  );

  const [
    hasRestored,
    setHasRestored,
  ] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      if (
        !initialFilled &&
        !showValidationError
      ) {
        const stored =
          readMatchSetupDraft();

        if (stored) {
          setMatchName(
            stored.matchName,
          );

          setPlayerCount(
            stored.playerCount,
          );

          setMatchId(
            stored.matchId,
          );
        }
      }

      setHasRestored(true);
    });

    return () => {
      cancelled = true;
    };
  }, [
    initialFilled,
    showValidationError,
  ]);

  useEffect(() => {
    if (!hasRestored) {
      return;
    }

    const draft: MatchSetupDraft = {
      matchName,
      playerCount,
      dictionaryPolicy:
        "LOCAL_WORD_LIST",
      matchId,
      updatedAt:
        new Date().toISOString(),
    };

    saveMatchSetupDraft(draft);
  }, [
    hasRestored,
    matchId,
    matchName,
    playerCount,
  ]);

  const normalizedName =
    matchName
      .trim()
      .replace(/\s+/g, " ");

  const hasMatchNameError =
    (
      showValidationError ||
      hasSubmitted
    ) &&
    normalizedName.length < 2;

  const hasPlayerCountError =
    hasSubmitted &&
    playerCount === null;

  const matchNameErrorMessage =
    normalizedName.length === 0
      ? "Match name is required."
      : "Match name must contain at least 2 characters.";

  const isFormValid =
    normalizedName.length >= 2 &&
    normalizedName.length <= 60 &&
    playerCount !== null;

  const saveMutation =
    useMutation({
      mutationFn: async () => {
        const guestSessionToken =
          readGuestSessionToken();

        if (!guestSessionToken) {
          throw new Error(
            "Start a guest session before creating a match.",
          );
        }

        const draft: MatchSetupDraft = {
          matchName:
            normalizedName,
          playerCount,
          dictionaryPolicy:
            "LOCAL_WORD_LIST",
          matchId,
          updatedAt:
            new Date().toISOString(),
        };

        saveMatchSetupDraft(draft);

        return saveGuestMatchDraft(
          guestSessionToken,
          draft,
        );
      },

      onSuccess: (match) => {
        const savedDraft:
          MatchSetupDraft = {
          matchName:
            match.name ??
            normalizedName,

          playerCount,

          dictionaryPolicy:
            "LOCAL_WORD_LIST",

          matchId:
            match.id,

          updatedAt:
            new Date().toISOString(),
        };

        setMatchId(match.id);

        saveMatchSetupDraft(
          savedDraft,
        );

        saveActiveMatchId(
          match.id,
        );

        toast.success(
          "Match details saved.",
        );

        router.push(
          "/matches/new/players",
        );
      },

      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to save the match details.",
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
        <header
          className={styles.header}
        >
          <Link
            href="/"
            className={styles.backLink}
          >
            <ArrowLeft
              aria-hidden="true"
            />

            <span>
              Back
            </span>
          </Link>

          <Brand />
        </header>

        <div
          className={styles.progressRow}
        >
          <span>
            Step 1 of 3
          </span>

          <div
            className={styles.progressTrack}
            aria-label="Step 1 of 3"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={1}
          >
            <div
              className={styles.progressValue}
            />
          </div>
        </div>

        <div
          className={styles.desktopGrid}
        >
          <section
            className={styles.formColumn}
          >
            <div
              className={styles.introduction}
            >
              <h1>
                Set up your match
              </h1>

              <p>
                Choose the basic settings
                for your Scrabble game.
              </p>
            </div>

            <form
              className={styles.form}
              onSubmit={(event) => {
                event.preventDefault();

                setHasSubmitted(true);

                if (
                  !isFormValid ||
                  saveMutation.isPending
                ) {
                  return;
                }

                saveMutation.mutate();
              }}
            >
              <div
                className={styles.nameField}
              >
                <div
                  className={styles.labelRow}
                >
                  <label
                    htmlFor="match-name"
                  >
                    Match Name
                    <span aria-hidden="true">
                      *
                    </span>
                  </label>

                  <span
                    className={`${styles.characterCount} ${
                      hasMatchNameError
                        ? styles.characterCountError
                        : ""
                    }`}
                  >
                    {matchName.length}/60
                  </span>
                </div>

                <input
                  id="match-name"
                  name="matchName"
                  type="text"
                  className={
                    hasMatchNameError
                      ? styles.inputError
                      : undefined
                  }
                  aria-invalid={
                    hasMatchNameError
                  }
                  aria-describedby={
                    hasMatchNameError
                      ? "match-name-error"
                      : undefined
                  }
                  maxLength={60}
                  value={matchName}
                  placeholder="e.g. Sunday Game Night"
                  autoComplete="off"
                  onChange={(event) => {
                    setMatchName(
                      event.target.value,
                    );
                  }}
                />

                {hasMatchNameError ? (
                  <p
                    id="match-name-error"
                    className={styles.fieldError}
                    role="alert"
                  >
                    {matchNameErrorMessage}
                  </p>
                ) : null}
              </div>

              <div
                className={styles.playerFieldGroup}
              >
                <PlayerCountSelector
                  value={playerCount}
                  onChange={setPlayerCount}
                />

                {hasPlayerCountError ? (
                  <p
                    className={styles.fieldError}
                    role="alert"
                  >
                    Choose the number of players.
                  </p>
                ) : null}
              </div>

              <DictionaryCard />

              <ConcealedScoreCard />

              <div
                className={styles.formActions}
              >
                <button
                  type="submit"
                  className={styles.continueButton}
                  disabled={
                    !isFormValid ||
                    saveMutation.isPending
                  }
                >
                  {saveMutation.isPending ? (
                    <>
                      <LoaderCircle
                        className={styles.spinner}
                        aria-hidden="true"
                      />

                      Saving Match…
                    </>
                  ) : (
                    "Continue to Players"
                  )}
                </button>

                <Link
                  href="/"
                  className={styles.cancelLink}
                >
                  Cancel Setup
                </Link>

                {saveMutation.isError ? (
                  <p
                    className={styles.requestError}
                    role="alert"
                  >
                    The match could not be
                    saved. Check that the API
                    is running and try again.
                  </p>
                ) : null}
              </div>
            </form>
          </section>

          <div
            className={styles.previewColumn}
          >
            <MatchPreview
              matchName={matchName}
              playerCount={playerCount}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
