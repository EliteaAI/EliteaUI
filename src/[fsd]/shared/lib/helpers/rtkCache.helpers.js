/**
 * Regex to parse RTK Query cache keys.
 * Cache keys follow the format: "endpointName{\"arg1\":\"value1\",...}"
 * Example: "applicationList{\"projectId\":123,\"page\":0}"
 */
const CACHE_KEY_REGEX = /^([a-zA-Z]+)(\{.+\})$/;

/**
 * Parses an RTK Query cache key into endpoint name and arguments.
 * Used to identify which cached queries contain a specific entity.
 *
 * @param {string} cacheKey - The RTK Query cache key
 * @returns {{ endpointName: string, args: object } | null} Parsed result or null if invalid
 */
export const parseCacheKey = cacheKey => {
  const match = cacheKey.match(CACHE_KEY_REGEX);
  if (!match) return null;
  try {
    const args = JSON.parse(match[2]);
    return { endpointName: match[1], args };
  } catch {
    return null;
  }
};

/**
 * Iterates through RTK Query caches and patches list entries matching a condition.
 *
 * @param {object} state - Redux state
 * @param {Function} dispatch - Redux dispatch
 * @param {Function} matchFn - Predicate to match items: (item) => boolean
 * @param {Function} patchFn - Mutation to apply to matched items: (item) => void
 * @param {object} eliteaApi - The eliteaApi slice for updateQueryData
 * @returns {Array} Array of patch results that can be undone on failure
 */
export const patchListCaches = (state, dispatch, matchFn, patchFn, eliteaApi) => {
  const patchResults = [];
  Object.entries(state.eliteaApi.queries).forEach(([cacheKey, cacheEntry]) => {
    if (!cacheEntry?.data?.rows && !cacheEntry?.data?.items) return;
    const data = cacheEntry.data;
    const hasMatch = data.rows?.some(matchFn) || data.items?.some(matchFn);
    if (!hasMatch) return;
    const parsed = parseCacheKey(cacheKey);
    if (!parsed) return;
    try {
      const patchResult = dispatch(
        eliteaApi.util.updateQueryData(parsed.endpointName, parsed.args, draft => {
          const list = draft?.rows || draft?.items;
          if (!list) return;
          list.forEach(item => {
            if (matchFn(item)) patchFn(item);
          });
        }),
      );
      patchResults.push(patchResult);
    } catch {
      // Skip if updateQueryData fails
    }
  });
  return patchResults;
};
