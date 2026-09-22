import { SearchParams } from '@/common/constants';

/** Newest-first ordering for suite lists, falling back to created_at then epoch. */
export const sortSuitesByDate = (suites = []) =>
  [...suites].sort((a, b) => {
    const dateA = new Date(a.updated_at || a.created_at || 0);
    const dateB = new Date(b.updated_at || b.created_at || 0);
    return dateB - dateA;
  });

/**
 * Carry the originating suite into an evaluation child page (datasets, dimensions, history).
 * Those pages sit under Evaluation rather than under a suite, so the breadcrumb switcher has no
 * route param to read and needs the id in the query string instead.
 * @param {string} search - Search string to extend, typically the persistent params
 * @param {number | string | null} suiteId - Suite the navigation started from, if any
 * @returns {string} Search string including `suiteId` when one was given
 */
export const withSuiteSearchParam = (search, suiteId) => {
  const params = new URLSearchParams(search);
  if (suiteId != null) params.set(SearchParams.SuiteId, String(suiteId));

  return params.toString();
};

/**
 * Suites as the breadcrumb switcher lists them: newest first, but with the suite the current screen
 * came from lifted to the top so the way back is always the first entry.
 * @param {Array<{ id: number, name: string }>} suites - Suites of the agent
 * @param {number | null} activeSuiteId - Suite the screen belongs to, if any
 * @param {string | null} [activeBadge] - Badge for the active entry, e.g. 'Previous'
 * @returns {Array<{ id: number, label: string, badge?: string }>} Menu items
 */
export const buildSuiteMenuItems = (suites = [], activeSuiteId = null, activeBadge = null) => {
  const sorted = sortSuitesByDate(suites);
  const active = sorted.find(suite => suite.id === activeSuiteId);
  const ordered = active ? [active, ...sorted.filter(suite => suite.id !== activeSuiteId)] : sorted;

  return ordered.map(suite => ({
    id: suite.id,
    label: suite.name,
    ...(suite.id === activeSuiteId && activeBadge ? { badge: activeBadge } : {}),
  }));
};

/**
 * Suite an evaluation child page was opened from, read from the `suiteId` query param, or null when
 * the user did not arrive from a suite.
 * @param {URLSearchParams} searchParams - Current query string
 * @returns {number | null} Parsed suite id
 */
export const resolveActiveSuiteId = searchParams => {
  const raw = searchParams?.get(SearchParams.SuiteId);
  if (raw == null || raw === '') return null;

  const parsed = parseInt(raw, 10);

  return Number.isNaN(parsed) ? null : parsed;
};
