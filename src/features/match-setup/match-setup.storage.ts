import type {
  MatchSetupDraft,
  MatchSetupPlayerCount,
  MatchSetupPlayerDraft,
} from "./match-setup.types";

const MATCH_SETUP_STORAGE_KEY =
  "scrabble-calculator-match-setup";

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !==
      "undefined"
  );
}

function isPlayerCount(
  value: unknown,
): value is MatchSetupPlayerCount {
  return (
    value === 2 ||
    value === 3 ||
    value === 4
  );
}

function readPlayers(
  value: unknown,
): MatchSetupPlayerDraft[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(
    (
      player,
      index,
    ) => {
      if (
        typeof player !== "object" ||
        player === null
      ) {
        return [];
      }

      const candidate =
        player as
          Partial<MatchSetupPlayerDraft>;

      if (
        typeof candidate.displayName !==
          "string"
      ) {
        return [];
      }

      return [
        {
          clientId:
            typeof candidate.clientId ===
              "string"
              ? candidate.clientId
              : `player-${index + 1}`,

          displayName:
            candidate.displayName.slice(
              0,
              40,
            ),

          serverPlayerId:
            typeof candidate.serverPlayerId ===
              "string"
              ? candidate.serverPlayerId
              : null,
        },
      ];
    },
  );
}

export function createEmptyMatchSetup():
  MatchSetupDraft {
  return {
    matchName: "",
    playerCount: null,
    dictionaryPolicy:
      "LOCAL_WORD_LIST",
    matchId: null,
    players: [],
    updatedAt:
      new Date().toISOString(),
  };
}

export function readMatchSetupDraft():
  MatchSetupDraft | null {
  if (!canUseStorage()) {
    return null;
  }

  const stored =
    window.localStorage.getItem(
      MATCH_SETUP_STORAGE_KEY,
    );

  if (!stored) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(stored) as
        Partial<MatchSetupDraft>;

    if (
      typeof parsed.matchName !==
        "string" ||
      !(
        parsed.playerCount === null ||
        isPlayerCount(
          parsed.playerCount,
        )
      ) ||
      parsed.dictionaryPolicy !==
        "LOCAL_WORD_LIST"
    ) {
      return null;
    }

    return {
      matchName:
        parsed.matchName.slice(
          0,
          60,
        ),

      playerCount:
        parsed.playerCount,

      dictionaryPolicy:
        "LOCAL_WORD_LIST",

      matchId:
        typeof parsed.matchId ===
          "string"
          ? parsed.matchId
          : null,

      players:
        readPlayers(
          parsed.players,
        ),

      updatedAt:
        typeof parsed.updatedAt ===
          "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveMatchSetupDraft(
  draft: MatchSetupDraft,
): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    MATCH_SETUP_STORAGE_KEY,
    JSON.stringify({
      ...draft,

      matchName:
        draft.matchName.slice(
          0,
          60,
        ),

      players:
        draft.players?.map(
          (player) => ({
            ...player,

            displayName:
              player.displayName.slice(
                0,
                40,
              ),
          }),
        ) ?? [],

      updatedAt:
        new Date().toISOString(),
    }),
  );
}

export function clearMatchSetupDraft():
  void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(
    MATCH_SETUP_STORAGE_KEY,
  );
}
