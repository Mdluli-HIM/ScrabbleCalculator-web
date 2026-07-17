import type {
  MatchSetupApiMatch,
  MatchSetupDraft,
} from "./match-setup.types";

interface ApiSuccess<T> {
  data: T;
  message?: string;
}

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  message?: string;
}

export class MatchSetupApiError
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
      "MatchSetupApiError";

    this.status = status;
    this.code = code;
    this.details = details;
  }
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

    throw new MatchSetupApiError(
      errorPayload?.error?.message ??
        errorPayload?.message ??
        "Unable to update the match.",
      response.status,
      errorPayload?.error?.code ??
        "MATCH_SETUP_REQUEST_FAILED",
      errorPayload?.error?.details,
    );
  }

  const successPayload =
    payload as ApiSuccess<T> | null;

  if (!successPayload?.data) {
    throw new MatchSetupApiError(
      "The server returned an invalid match response.",
      response.status,
      "INVALID_MATCH_SETUP_RESPONSE",
    );
  }

  return successPayload.data;
}

function guestHeaders(
  guestSessionToken: string,
): HeadersInit {
  return {
    Accept: "application/json",
    "Content-Type":
      "application/json",
    "x-guest-session-token":
      guestSessionToken,
  };
}

async function requestMatch(
  url: string,
  guestSessionToken: string,
  options: RequestInit = {},
): Promise<MatchSetupApiMatch> {
  const response =
    await fetch(
      url,
      {
        ...options,

        headers: {
          ...guestHeaders(
            guestSessionToken,
          ),
          ...options.headers,
        },

        cache: "no-store",
      },
    );

  const data =
    await readResponse<{
      match: MatchSetupApiMatch;
    }>(response);

  return data.match;
}

export async function saveGuestMatchDraft(
  guestSessionToken: string,
  draft: MatchSetupDraft,
): Promise<MatchSetupApiMatch> {
  const matchName =
    draft.matchName
      .trim()
      .replace(/\s+/g, " ");

  const body =
    JSON.stringify({
      name: matchName,
      dictionaryPolicy:
        "LOCAL_WORD_LIST",
    });

  if (draft.matchId) {
    return requestMatch(
      `/api/v1/matches/${draft.matchId}`,
      guestSessionToken,
      {
        method: "PATCH",
        body,
      },
    );
  }

  return requestMatch(
    "/api/v1/matches",
    guestSessionToken,
    {
      method: "POST",
      body,
    },
  );
}

export async function getGuestMatch(
  guestSessionToken: string,
  matchId: string,
): Promise<MatchSetupApiMatch> {
  return requestMatch(
    `/api/v1/matches/${matchId}`,
    guestSessionToken,
  );
}

async function removeExistingPlayers(
  guestSessionToken: string,
  match: MatchSetupApiMatch,
): Promise<void> {
  for (
    const player
    of match.players
  ) {
    await requestMatch(
      `/api/v1/matches/${match.id}/players/${player.id}`,
      guestSessionToken,
      {
        method: "DELETE",
      },
    );
  }
}

export async function saveGuestMatchPlayers(
  guestSessionToken: string,
  matchId: string,
  playerNames: string[],
): Promise<MatchSetupApiMatch> {
  let match =
    await getGuestMatch(
      guestSessionToken,
      matchId,
    );

  if (match.status !== "DRAFT") {
    throw new MatchSetupApiError(
      "Only a draft match can be edited.",
      409,
      "MATCH_NOT_EDITABLE",
    );
  }

  if (match.players.length > 0) {
    await removeExistingPlayers(
      guestSessionToken,
      match,
    );
  }

  const playerIds: string[] = [];

  for (
    const displayName
    of playerNames
  ) {
    match =
      await requestMatch(
        `/api/v1/matches/${matchId}/players`,
        guestSessionToken,
        {
          method: "POST",

          body:
            JSON.stringify({
              source: "LOCAL",
              displayName,
            }),
        },
      );

    const addedPlayer =
      [...match.players]
        .sort(
          (
            first,
            second,
          ) =>
            second.createdAt?.localeCompare?.(
              first.createdAt ?? "",
            ) ?? 0,
        )
        .find(
          (player) =>
            player.displayName
              .trim()
              .toLocaleLowerCase() ===
            displayName
              .trim()
              .toLocaleLowerCase(),
        );

    if (!addedPlayer) {
      throw new MatchSetupApiError(
        `The server did not return ${displayName}.`,
        500,
        "MATCH_PLAYER_RESPONSE_INVALID",
      );
    }

    playerIds.push(
      addedPlayer.id,
    );
  }

  return requestMatch(
    `/api/v1/matches/${matchId}/players/order`,
    guestSessionToken,
    {
      method: "PUT",

      body:
        JSON.stringify({
          seatOrder:
            playerIds,

          turnOrder:
            playerIds,
        }),
    },
  );
}
