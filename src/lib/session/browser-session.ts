const GUEST_SESSION_TOKEN_KEY =
  "scrabble-calculator.guest-session-token";

const ACTIVE_MATCH_ID_KEY =
  "scrabble-calculator.active-match-id";

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function readGuestSessionToken():
  string | null {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(
    GUEST_SESSION_TOKEN_KEY,
  );
}

export function saveGuestSessionToken(
  token: string,
): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    GUEST_SESSION_TOKEN_KEY,
    token,
  );
}

export function clearGuestSessionToken():
  void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(
    GUEST_SESSION_TOKEN_KEY,
  );
}

export function saveActiveMatchId(
  matchId: string,
): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    ACTIVE_MATCH_ID_KEY,
    matchId,
  );
}

export function clearActiveMatchId():
  void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(
    ACTIVE_MATCH_ID_KEY,
  );
}
