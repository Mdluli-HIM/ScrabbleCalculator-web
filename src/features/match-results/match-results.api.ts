import type {
  MatchResultsBundle,
} from "./match-results.types";

interface ApiSuccess<T> {
  success?: true;
  message?: string;
  data: T;
}

interface ApiErrorPayload {
  success?: false;
  message?: string;

  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

export class MatchResultsApiError
  extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    code: string,
    details?: unknown,
  ) {
    super(message);

    this.name =
      "MatchResultsApiError";

    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function guestHeaders(
  guestSessionToken: string,
): HeadersInit {
  return {
    Accept:
      "application/json",

    "Content-Type":
      "application/json",

    "x-guest-session-token":
      guestSessionToken,
  };
}

async function readResponse<T>(
  response: Response,
): Promise<T> {
  const payload =
    await response
      .json()
      .catch(() => null) as
        | ApiSuccess<T>
        | ApiErrorPayload
        | null;

  if (!response.ok) {
    const errorPayload =
      payload as
        ApiErrorPayload | null;

    throw new MatchResultsApiError(
      errorPayload?.error?.message ??
        errorPayload?.message ??
        "The match results could not be loaded.",

      response.status,

      errorPayload?.error?.code ??
        "MATCH_RESULTS_REQUEST_FAILED",

      errorPayload?.error?.details,
    );
  }

  const successPayload =
    payload as
      ApiSuccess<T> | null;

  if (!successPayload?.data) {
    throw new MatchResultsApiError(
      "The server returned an invalid results response.",
      response.status,
      "INVALID_MATCH_RESULTS_RESPONSE",
    );
  }

  return successPayload.data;
}

export async function getMatchResults(
  guestSessionToken: string,
  matchId: string,
): Promise<MatchResultsBundle> {
  const [
    matchResponse,
    resultsResponse,
  ] = await Promise.all([
    fetch(
      `/api/v1/matches/${matchId}`,
      {
        method: "GET",

        headers:
          guestHeaders(
            guestSessionToken,
          ),

        cache: "no-store",
      },
    ),

    fetch(
      `/api/v1/matches/${matchId}/results`,
      {
        method: "GET",

        headers:
          guestHeaders(
            guestSessionToken,
          ),

        cache: "no-store",
      },
    ),
  ]);

  const [
    matchData,
    resultsData,
  ] = await Promise.all([
    readResponse<{
      match:
        MatchResultsBundle["match"];
    }>(matchResponse),

    readResponse<{
      result:
        MatchResultsBundle["result"];
    }>(resultsResponse),
  ]);

  return {
    match:
      matchData.match,

    result:
      resultsData.result,
  };
}
