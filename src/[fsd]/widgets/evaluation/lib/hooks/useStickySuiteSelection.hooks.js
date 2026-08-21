import { useCallback, useState } from 'react';

const STORAGE_PREFIX = 'elitea.eval.selectedSuite';

// The Suite config view is unmounted whenever the author leaves the tab (the
// platform tab container renders `null` for inactive tabs), so component state
// alone cannot survive a tab switch. Persist the choice per project + agent.
const storageKey = (projectId, applicationId) => `${STORAGE_PREFIX}.${projectId}.${applicationId}`;

export const readStickySuiteId = (projectId, applicationId) => {
  if (!projectId || !applicationId) return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(projectId, applicationId));
    if (raw === null) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const writeStickySuiteId = (projectId, applicationId, suiteId) => {
  if (!projectId || !applicationId) return;
  try {
    const key = storageKey(projectId, applicationId);
    if (suiteId == null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, String(suiteId));
  } catch {
    // Storage may be unavailable (private mode / quota) — selection then just
    // falls back to the default suite, which is acceptable.
  }
};

/**
 * Selected-suite state that survives unmount of the Suite config view.
 * Returns `[selectedSuiteId, setSelectedSuiteId]` with the same contract as
 * `useState`, including functional updates.
 */
export const useStickySuiteSelection = (projectId, applicationId) => {
  const [suiteId, setSuiteId] = useState(() => readStickySuiteId(projectId, applicationId));

  const setStickySuiteId = useCallback(
    next => {
      setSuiteId(prev => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        writeStickySuiteId(projectId, applicationId, resolved);
        return resolved;
      });
    },
    [projectId, applicationId],
  );

  return [suiteId, setStickySuiteId];
};
