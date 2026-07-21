import type {
  CompleteActiveMatchInput,
  ActiveMatch,
  SubmitActiveTurnInput,
  SubmitActiveTurnResult,
} from "./active-match.types";

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

export class ActiveMatchApiError
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
      "ActiveMatchApiError";

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

    throw new ActiveMatchApiError(
      errorPayload?.error?.message ??
        errorPayload?.message ??
        "The active match request could not be completed.",

      response.status,

      errorPayload?.error?.code ??
        "ACTIVE_MATCH_REQUEST_FAILED",

      errorPayload?.error?.details,
    );
  }

  const successPayload =
    payload as
      ApiSuccess<T> | null;

  if (!successPayload?.data) {
    throw new ActiveMatchApiError(
      "The server returned an invalid active match response.",
      response.status,
      "INVALID_ACTIVE_MATCH_RESPONSE",
    );
  }

  return successPayload.data;
}

export async function getActiveMatch(
  guestSessionToken: string,
  matchId: string,
): Promise<ActiveMatch> {
  const response =
    await fetch(
      `/api/v1/matches/${matchId}`,
      {
        method: "GET",

        headers:
          guestHeaders(
            guestSessionToken,
          ),

        cache: "no-store",
      },
    );

  const data =
    await readResponse<{
      match: ActiveMatch;
    }>(response);

  return data.match;
}

export async function submitActiveTurn(
  guestSessionToken: string,
  matchId: string,
  idempotencyKey: string,
  input: SubmitActiveTurnInput,
): Promise<SubmitActiveTurnResult> {
  const response =
    await fetch(
      `/api/v1/matches/${matchId}/turns`,
      {
        method: "POST",

        headers: {
          ...guestHeaders(
            guestSessionToken,
          ),

          "Idempotency-Key":
            idempotencyKey,
        },

        body:
          JSON.stringify(input),

        cache: "no-store",
      },
    );

  return readResponse<
    SubmitActiveTurnResult
  >(response);
}

export async function completeActiveMatch(
  guestSessionToken: string,
  matchId: string,
  input: CompleteActiveMatchInput,
): Promise<void> {
  const response =
    await fetch(
      `/api/v1/matches/${matchId}/complete`,
      {
        method: "POST",

        headers:
          guestHeaders(
            guestSessionToken,
          ),

        body:
          JSON.stringify(
            input,
          ),
      },
    );

  await readResponse<{
    result: unknown;
  }>(response);
}
