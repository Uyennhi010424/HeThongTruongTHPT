const LOCK_STORAGE_KEY = "admin_score_locks_v1";

const normalize = (value) => String(value || "").trim();

export const buildScoreLockKey = ({ subjectId, semester, column }) =>
  `${normalize(subjectId)}:${normalize(semester)}:${normalize(column)}`;

export const readScoreLocks = () => {
  try {
    const raw = window.localStorage.getItem(LOCK_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const writeScoreLocks = (locks) => {
  try {
    window.localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(locks || {}));
    window.dispatchEvent(new CustomEvent("score_locks_changed", { detail: locks || {} }));
  } catch {
    // ignore storage errors
  }
};

export const isScoreColumnLocked = (locks, subjectId, semester, column) =>
  Boolean(locks?.[buildScoreLockKey({ subjectId, semester, column })]);

export const toggleScoreColumnLock = (locks, subjectId, semester, column) => {
  const key = buildScoreLockKey({ subjectId, semester, column });
  const next = { ...(locks || {}) };

  if (next[key]) {
    delete next[key];
  } else {
    next[key] = true;
  }

  writeScoreLocks(next);
  return next;
};

export const getScoreLockStorageKey = () => LOCK_STORAGE_KEY;
