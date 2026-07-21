"use client";

import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Crown,
  LoaderCircle,
  Medal,
  RotateCcw,
  Share2,
  Sparkles,
  Trophy,
} from "lucide-react";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  getMatchResults,
} from "@/features/match-results/match-results.api";

import type {
  MatchResultHighlights,
  MatchResultStanding,
  MatchResultsBundle,
} from "@/features/match-results/match-results.types";

import {
  readGuestSessionToken,
} from "@/lib/session/browser-session";

import styles from "./match-results-screen.module.css";

interface MatchResultsScreenProps {
  matchId: string;
}

const EMPTY_HIGHLIGHTS:
  MatchResultHighlights = {
    totalTurns: 0,
    totalWords: 0,
    bingoCount: 0,

    highestScoringTurn:
      null,

    highestScoringWord:
      null,

    experienceEvents: {
      total: 0,
      leadChanges: 0,
      sharedLeads: 0,
      rankRises: 0,
      comebacks: 0,
      momentumShifts: 0,
    },
  };

function formatDate(
  value: string,
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-ZA",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

function formatDuration(
  startedAt: string | null,
  completedAt: string,
): string {
  if (!startedAt) {
    return "Not available";
  }

  const start =
    new Date(startedAt);

  const end =
    new Date(completedAt);

  const milliseconds =
    end.getTime() -
    start.getTime();

  if (
    !Number.isFinite(
      milliseconds,
    ) ||
    milliseconds < 0
  ) {
    return "Not available";
  }

  const totalMinutes =
    Math.max(
      1,
      Math.round(
        milliseconds /
          60000,
      ),
    );

  const hours =
    Math.floor(
      totalMinutes / 60,
    );

  const minutes =
    totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

function getRackText(
  standing:
    MatchResultStanding,
): string {
  if (
    standing
      .remainingRack
      .length === 0
  ) {
    return "No tiles";
  }

  return standing
    .remainingRack
    .map(
      (tile) =>
        tile.isBlank
          ? "Blank"
          : tile.letter,
    )
    .join(", ");
}

function PodiumPlayer({
  standing,
}: {
  standing:
    MatchResultStanding;
}) {
  return (
    <article
      className={`${styles.podiumPlayer} ${
        standing.rank === 1
          ? styles.podiumWinner
          : ""
      }`}
    >
      <div
        className={
          styles.podiumIdentity
        }
      >
        {standing.rank === 1 ? (
          <Crown
            aria-hidden="true"
          />
        ) : (
          <Medal
            aria-hidden="true"
          />
        )}

        <strong>
          {standing.displayName}
        </strong>

        <span>
          {standing.finalScore}
          {" "}pts
        </span>
      </div>

      <div
        className={
          styles.podiumBlock
        }
      >
        {standing.rank}
      </div>
    </article>
  );
}

function ResultsError({
  matchId,
  message,
}: {
  matchId: string;
  message: string;
}) {
  return (
    <main
      className={
        styles.statePage
      }
    >
      <section
        className={
          styles.stateCard
        }
      >
        <Trophy
          aria-hidden="true"
        />

        <h1>
          Results unavailable
        </h1>

        <p>{message}</p>

        <Link
          href={`/matches/${matchId}`}
        >
          Return to Match
        </Link>
      </section>
    </main>
  );
}

export function MatchResultsScreen({
  matchId,
}: MatchResultsScreenProps) {
  const [
    bundle,
    setBundle,
  ] = useState<
    MatchResultsBundle | null
  >(null);

  const [
    loadError,
    setLoadError,
  ] = useState<
    string | null
  >(null);

  const [
    shareMessage,
    setShareMessage,
  ] = useState<
    string | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    const token =
      readGuestSessionToken();

    const request =
      token
        ? getMatchResults(
            token,
            matchId,
          )
        : Promise.reject(
            new Error(
              "Your guest session has expired.",
            ),
          );

    request
      .then(
        (
          resultsBundle,
        ) => {
          if (cancelled) {
            return;
          }

          setBundle(
            resultsBundle,
          );

          setLoadError(null);
        },
      )
      .catch(
        (
          error: unknown,
        ) => {
          if (cancelled) {
            return;
          }

          setLoadError(
            error instanceof Error
              ? error.message
              : "The final results could not be loaded.",
          );
        },
      );

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  if (loadError) {
    return (
      <ResultsError
        matchId={matchId}
        message={loadError}
      />
    );
  }

  if (!bundle) {
    return (
      <main
        className={
          styles.statePage
        }
      >
        <div
          className={
            styles.loadingState
          }
        >
          <LoaderCircle
            className={
              styles.spinner
            }
            aria-hidden="true"
          />

          Preparing final results…
        </div>
      </main>
    );
  }

  const {
    match,
    result,
  } = bundle;

  const standings =
    [...result.standings]
      .sort(
        (
          first,
          second,
        ) =>
          first.rank -
            second.rank ||
          first.turnOrder -
            second.turnOrder,
      );

  const podium =
    [...result.podium]
      .sort(
        (
          first,
          second,
        ) =>
          first.rank -
          second.rank ||
          first.turnOrder -
            second.turnOrder,
      )
      .slice(0, 3);

  const winnerNames =
    result.winners
      .map(
        (winner) =>
          winner.displayName,
      )
      .join(" & ");

  const winnerText =
    result.hasSharedWin
      ? `${winnerNames} Share the Win`
      : `${winnerNames || "Winner"} Wins`;

  const winnerScore =
    standings.find(
      (standing) =>
        standing.isWinner,
    )?.finalScore ?? 0;

  const highlights =
    result.highlights ??
    EMPTY_HIGHLIGHTS;

  const matchName =
    match.name ??
    "Scrabble Match";

  const leaderScore =
    standings[0]
      ?.finalScore ?? 0;

  const totalRounds =
    highlights.totalTurns === 0
      ? 0
      : Math.ceil(
          highlights.totalTurns /
            Math.max(
              match.playerCount,
              1,
            ),
        );

  async function shareResults():
    Promise<void> {
    const text =
      `${winnerText} with ${winnerScore} points in ${matchName}.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title:
            `${matchName} Results`,

          text,
        });

        setShareMessage(
          "Results shared.",
        );

        return;
      }

      await navigator.clipboard
        .writeText(text);

      setShareMessage(
        "Results copied.",
      );
    } catch (error) {
      if (
        error instanceof
          DOMException &&
        error.name ===
          "AbortError"
      ) {
        return;
      }

      setShareMessage(
        "The results could not be shared.",
      );
    }
  }

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
            href={`/matches/${matchId}`}
            className={
              styles.backLink
            }
          >
            <ArrowLeft
              aria-hidden="true"
            />

            Back
          </Link>

          <Link
            href="/"
            className={styles.brand}
          >
            <span>S</span>
            <span>C</span>

            <strong>
              Scrabble Calculator
            </strong>
          </Link>

          <span
            className={
              styles.completedBadge
            }
          >
            Completed
          </span>
        </header>

        <div
          className={
            styles.resultsGrid
          }
        >
          <div
            className={
              styles.leftColumn
            }
          >
            <section
              className={
                styles.matchTitle
              }
            >
              <h1>{matchName}</h1>
              <p>Match Finished</p>
            </section>

            <section
              className={styles.hero}
            >
              <div
                className={
                  styles.trophyCircle
                }
              >
                <Trophy
                  aria-hidden="true"
                />
              </div>

              <h2>{winnerText}</h2>

              <strong>
                {winnerScore}
                {" "}points
              </strong>

              <p>
                A brilliant game from
                start to finish.
              </p>
            </section>

            <section
              className={styles.card}
            >
              <div
                className={
                  styles.cardTitle
                }
              >
                <span>
                  Match Podium
                </span>

                <Crown
                  aria-hidden="true"
                />
              </div>

              <div
                className={
                  styles.podium
                }
              >
                {podium.map(
                  (standing) => (
                    <PodiumPlayer
                      key={
                        standing.playerId
                      }
                      standing={
                        standing
                      }
                    />
                  ),
                )}
              </div>
            </section>

            <section
              className={styles.card}
            >
              <div
                className={
                  styles.cardTitle
                }
              >
                <span>
                  Final Standings
                </span>

                <Medal
                  aria-hidden="true"
                />
              </div>

              <div
                className={
                  styles.standings
                }
              >
                {standings.map(
                  (standing) => {
                    const behind =
                      leaderScore -
                      standing.finalScore;

                    return (
                      <article
                        key={
                          standing.playerId
                        }
                        className={
                          styles.standingRow
                        }
                      >
                        <span
                          className={
                            styles.rank
                          }
                        >
                          {standing.rank}
                        </span>

                        <div>
                          <strong>
                            {
                              standing.displayName
                            }
                          </strong>

                          <small>
                            {standing.isWinner
                              ? "Winner"
                              : `${behind} pts behind`}
                          </small>
                        </div>

                        <strong>
                          {
                            standing.finalScore
                          }
                          {" "}pts
                        </strong>
                      </article>
                    );
                  },
                )}
              </div>
            </section>

            <section
              className={
                styles.desktopActions
              }
            >
              <Link
                href="/matches/new"
                className={
                  styles.playAgain
                }
              >
                <RotateCcw
                  aria-hidden="true"
                />

                Play Again
              </Link>

              <Link href="/">
                Return to Welcome
              </Link>
            </section>
          </div>

          <div
            className={
              styles.rightColumn
            }
          >
            <section
              className={styles.card}
            >
              <div
                className={
                  styles.cardTitle
                }
              >
                <span>
                  Match Highlights
                </span>

                <Sparkles
                  aria-hidden="true"
                />
              </div>

              <div
                className={
                  styles.highlightGrid
                }
              >
                <article>
                  <span>
                    Highest Word
                  </span>

                  <strong>
                    {highlights
                      .highestScoringWord
                      ?.word ??
                      "—"}
                  </strong>

                  <small>
                    {highlights
                      .highestScoringWord
                      ? `${highlights.highestScoringWord.points} points`
                      : "No scored words"}
                  </small>
                </article>

                <article>
                  <span>
                    Highest Turn
                  </span>

                  <strong>
                    {highlights
                     .highestScoringTurn
                      ?.points ??
                      0}
                  </strong>

                  <small>
                    {highlights
                      .highestScoringTurn
                      ?.displayName ??
                      "No turns"}
                  </small>
                </article>

                <article>
                  <span>
                    Seven-Tile Plays
                  </span>

                  <strong>
                    {
                      highlights
                        .bingoCount
                    }
                  </strong>

                  <small>
                    Bingo bonuses
                  </small>
                </article>

                <article>
                  <span>
                    Total Words
                  </span>

                  <strong>
                    {
                      highlights
                        .totalWords
                    }
                  </strong>

                  <small>
                    Across all turns
                  </small>
                </article>
              </div>
            </section>

            <section>
              <div
                className={
                  styles.outsideTitle
                }
              >
                Player Performance
              </div>

              <div
                className={
                  styles.performanceGrid
                }
              >
                {standings.map(
                  (standing) => (
                    <article
                      key={
                        standing.playerId
                      }
                      className={
                        styles.performanceCard
                      }
                    >
                      <header>
                        <strong>
                          {
                            standing.displayName
                          }
                        </strong>

                        <span>
                          Rank{" "}
                          {standing.rank}
                        </span>
                      </header>

                      <dl>
                        <div>
                          <dt>
                            Final Score
                          </dt>

                          <dd>
                            {
                              standing.finalScore
                            }{" "}
                            pts
                          </dd>
                        </div>

                        <div>
                          <dt>
                            Before Rack
                          </dt>

                          <dd>
                            {
                              standing.baseScore
                            }{" "}
                            pts
                          </dd>
                        </div>

                        <div>
                          <dt>
                            Rack Deduction
                          </dt>

                          <dd>
                            -
                            {
                              standing.rackDeduction
                            }
                          </dd>
                        </div>

                        <div>
                          <dt>
                            Finishing Bonus
                          </dt>

                          <dd>
                            +
                            {
                              standing.finishingBonus
                            }
                          </dd>
                        </div>

                        <div>
                          <dt>
                            Remaining Tiles
                          </dt>

                          <dd>
                            {getRackText(
                              standing,
                            )}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ),
                )}
              </div>
            </section>

            <section
              className={styles.card}
            >
              <div
                className={
                  styles.cardTitle
                }
              >
                <span>
                  Match Summary
                </span>
              </div>

              <dl
                className={
                  styles.summaryList
                }
              >
                <div>
                  <dt>Match</dt>
                  <dd>{matchName}</dd>
                </div>

                <div>
                  <dt>Players</dt>
                  <dd>
                    {match.playerCount}
                  </dd>
                </div>

                <div>
                  <dt>Rounds</dt>
                  <dd>{totalRounds}</dd>
                </div>

                <div>
                  <dt>Total Turns</dt>
                  <dd>
                    {
                      highlights
                        .totalTurns
                    }
                  </dd>
                </div>

                <div>
                  <dt>Words Formed</dt>
                  <dd>
                    {
                      highlights
                        .totalWords
                    }
                  </dd>
                </div>

                <div>
                  <dt>Finished By</dt>
                  <dd>
                    {result.reason ===
                    "PLAYER_EMPTIED_RACK"
                      ? "Player used all tiles"
                      : "No more moves"}
                  </dd>
                </div>

                <div>
                  <dt>Game Duration</dt>
                  <dd>
                    {formatDuration(
                      match.startedAt,
                      result.completedAt,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Completed</dt>
                  <dd>
                    {formatDate(
                      result.completedAt,
                    )}
                  </dd>
                </div>
              </dl>
            </section>

            <details
              className={
                styles.historyCard
              }
            >
              <summary>
                <BookOpen
                  aria-hidden="true"
                />

                <div>
                  <strong>
                    Word History
                  </strong>

                  <span>
                    {
                      highlights
                        .totalWords
                    }{" "}
                    words recorded
                  </span>
                </div>

                <ChevronDown
                  aria-hidden="true"
                />
              </summary>

              <div
                className={
                  styles.historyContent
                }
              >
                {highlights
                  .highestScoringWord ? (
                  <>
                    <span>
                      Highest-scoring
                      word
                    </span>

                    <strong>
                      {
                        highlights
                          .highestScoringWord
                          .word
                      }
                    </strong>

                    <p>
                      Played by{" "}
                      {
                        highlights
                          .highestScoringWord
                          .displayName
                      }{" "}
                      for{" "}
                      {
                        highlights
                          .highestScoringWord
                          .points
                      }{" "}
                      points.
                    </p>
                  </>
                ) : (
                  <p>
                    No words were scored
                    in this match.
                  </p>
                )}
              </div>
            </details>
          </div>
        </div>

        <section
          className={
            styles.mobileActions
          }
        >
          <Link
            href="/matches/new"
            className={
              styles.playAgain
            }
          >
            <RotateCcw
              aria-hidden="true"
            />

            Play Again
          </Link>

          <div>
            <Link href="/">
              Return to Welcome
            </Link>

            <button
              type="button"
              onClick={() => {
                void shareResults();
              }}
            >
              <Share2
                aria-hidden="true"
              />

              Share Results
            </button>
          </div>

          {shareMessage ? (
            <p role="status">
              {shareMessage}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
