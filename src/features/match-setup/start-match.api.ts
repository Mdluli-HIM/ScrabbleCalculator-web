import type {
  MatchSetupApiMatch,
} from "./match-setup.types";

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  message?: string;
}

interface ApiSuccessPayload {
  data?:
    | MatchSetupApiMatch
    | {
        match?: MatchSetupApiMatch;
      };
}

export class StartMatchApiError
  extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    code: string,
    details?: unknown,
  ) {
    super(message);

    this.name =
      "StartMatchApiError";

    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function startGuestMatch(
  guestSessionToken: string,
  matchId: string,
): Promise<MatchSetupApiMatch> {
  const response =
    await fetch(
      `/api/v1/matches/${matchId}/start`,
      {
        method: "POST",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",

          "x-guest-session-token":
            guestSessionToken,
        },

        cache: "no-store",
      },
    );

  const payload =
    await response
      .json()
      .catch(() => null) as
        | (
            ApiSuccessPayload &
            ApiErrorPayload
          )
        | null;

  if (!response.ok) {
    throw new StartMatchApiError(
      payload?.error?.message ??
        payload?.message ??
        "The match could not be started.",

      response.status,

      payload?.error?.code ??
        "START_MATCH_REQUEST_FAILED",

      payload?.error?.details,
    );
  }

  const data =
    payload?.data;

  if (!data) {
    throw new StartMatchApiError(
      "The server returned an invalid match response.",
      response.status,
      "INVALID_START_MATCH_RESPONSE",
    );
  }

  if (
    "match" in data &&
    data.match
  ) {
    return data.match;
  }

  if ("id" in data) {
    return data;
  }

  throw new StartMatchApiError(
    "The server did not return the started match.",
    response.status,
    "INVALID_START_MATCH_RESPONSE",
  );
}
