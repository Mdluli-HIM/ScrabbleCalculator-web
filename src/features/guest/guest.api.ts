import {
  apiRequest,
} from "@/lib/api/client";

export interface GuestSessionData {
  guestSessionToken: string;

  guestSession?: {
    id: string;
    status?: string;
  };
}

export interface MatchPlayerSummary {
  id: string;
  displayName?: string;
  turnOrder?: number;
}

export interface MatchSummary {
  id: string;
  name: string;
  status: string;
  currentTurnOrder?: number | null;
  players?: MatchPlayerSummary[];
  playerCount?: number;
  updatedAt?: string;
}

interface MatchListData {
  matches?: MatchSummary[];
  items?: MatchSummary[];
}

export async function createGuestSession():
  Promise<GuestSessionData> {
  return apiRequest<GuestSessionData>(
    "/guest/sessions",
    {
      method: "POST",
      body: {},
    },
  );
}

export async function listGuestMatches(
  guestSessionToken: string,
): Promise<MatchSummary[]> {
  const data =
    await apiRequest<MatchListData>(
      "/matches",
      {
        method: "GET",
        guestSessionToken,
        cache: "no-store",
      },
    );

  if (Array.isArray(data.matches)) {
    return data.matches;
  }

  if (Array.isArray(data.items)) {
    return data.items;
  }

  return [];
}
