import type {
  QuickScoreGame,
} from "./quick-score.types";

const QUICK_SCORE_STORAGE_KEY =
  "scrabble-calculator.quick-score";

const QUICK_SCORE_EVENT =
  "scrabble-calculator:quick-score-change";

let cachedRaw:
  | string
  | null
  | undefined;

let cachedGame:
  | QuickScoreGame
  | null = null;

function canUseStorage():
  boolean {
  return typeof window !==
    "undefined";
}

export function makeQuickScoreId(
  prefix: string,
): string {
  if (
    typeof crypto !==
      "undefined" &&
    "randomUUID" in crypto
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return [
    prefix,
    Date.now().toString(36),
    Math.random()
      .toString(36)
      .slice(2),
  ].join("-");
}

function isQuickScoreGame(
  value: unknown,
): value is QuickScoreGame {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const game =
    value as Partial<QuickScoreGame>;

  return (
    typeof game.id === "string" &&
    (
      game.status ===
        "IN_PROGRESS" ||
      game.status ===
        "COMPLETED"
    ) &&
    Array.isArray(game.players) &&
    game.players.length >= 2 &&
    typeof game.currentPlayerIndex ===
      "number" &&
    Array.isArray(game.turns) &&
    typeof game.createdAt ===
      "string"
  );
}

function parseGame(
  raw: string | null,
): QuickScoreGame | null {
  if (!raw) {
    return null;
  }

  try {
    const value:
      unknown = JSON.parse(raw);

    return isQuickScoreGame(value)
      ? value
      : null;
  } catch {
    return null;
  }
}

export function getQuickScoreGameSnapshot():
  QuickScoreGame | null {
  if (!canUseStorage()) {
    return null;
  }

  const raw =
    window.localStorage.getItem(
      QUICK_SCORE_STORAGE_KEY,
    );

  if (raw === cachedRaw) {
    return cachedGame;
  }

  cachedRaw = raw;
  cachedGame = parseGame(raw);

  return cachedGame;
}

export function getQuickScoreServerSnapshot():
  QuickScoreGame | null {
  return null;
}

export function subscribeQuickScoreGame(
  listener: () => void,
): () => void {
  if (!canUseStorage()) {
    return () => undefined;
  }

  function handleStorage(
    event: StorageEvent,
  ): void {
    if (
      event.key ===
      QUICK_SCORE_STORAGE_KEY
    ) {
      cachedRaw = undefined;
      listener();
    }
  }

  window.addEventListener(
    "storage",
    handleStorage,
  );

  window.addEventListener(
    QUICK_SCORE_EVENT,
    listener,
  );

  return () => {
    window.removeEventListener(
      "storage",
      handleStorage,
    );

    window.removeEventListener(
      QUICK_SCORE_EVENT,
      listener,
    );
  };
}

export function saveQuickScoreGame(
  game: QuickScoreGame,
): void {
  if (!canUseStorage()) {
    return;
  }

  const raw =
    JSON.stringify(game);

  cachedRaw = raw;
  cachedGame = game;

  window.localStorage.setItem(
    QUICK_SCORE_STORAGE_KEY,
    raw,
  );

  window.dispatchEvent(
    new Event(
      QUICK_SCORE_EVENT,
    ),
  );
}

export function clearQuickScoreGame():
  void {
  if (!canUseStorage()) {
    return;
  }

  cachedRaw = null;
  cachedGame = null;

  window.localStorage.removeItem(
    QUICK_SCORE_STORAGE_KEY,
  );

  window.dispatchEvent(
    new Event(
      QUICK_SCORE_EVENT,
    ),
  );
}

export function createQuickScoreGame(
  names: string[],
): QuickScoreGame {
  const createdAt =
    new Date().toISOString();

  return {
    id:
      makeQuickScoreId(
        "quick-game",
      ),

    status:
      "IN_PROGRESS",

    currentPlayerIndex: 0,

    players:
      names.map(
        (
          name,
          index,
        ) => ({
          id:
            makeQuickScoreId(
              "quick-player",
            ),

          name,
          score: 0,
          turnOrder:
            index + 1,
        }),
      ),

    turns: [],
    createdAt,
    completedAt: null,
  };
}
