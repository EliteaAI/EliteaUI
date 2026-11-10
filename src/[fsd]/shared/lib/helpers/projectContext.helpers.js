import { ProjectIdStorageKey, ProjectNameStorageKey, SearchParams } from '@/common/constants';

/**
 * A tab opened from "Open link in new tab" has no per-tab (session) project, and the shared local
 * storage may hold whichever project another tab selected last. Links therefore carry `project_id`.
 *
 * Applies it to this tab only (session storage, never local storage, so other tabs' default project is not
 * changed) and removes it from the address bar. Not trusted: the project list response still resets a
 * project the user is not a member of, so this cannot be used to read another project.
 *
 * @returns {boolean} true when a project id from the URL was applied
 */
export const applyProjectFromUrl = () => {
  try {
    if (typeof window === 'undefined') return false;

    const url = new URL(window.location.href);
    const rawProjectId = url.searchParams.get(SearchParams.ProjectId);
    if (rawProjectId === null) return false;

    url.searchParams.delete(SearchParams.ProjectId);
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);

    const projectId = Number(rawProjectId);
    if (!Number.isInteger(projectId) || projectId <= 0) return false;

    if (sessionStorage.getItem(ProjectIdStorageKey) !== String(projectId)) {
      sessionStorage.setItem(ProjectIdStorageKey, String(projectId));
      // The name is filled in from the project list once it loads
      sessionStorage.removeItem(ProjectNameStorageKey);
    }
    return true;
  } catch {
    return false;
  }
};
