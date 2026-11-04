/**
 * Returns a state-setter callback that toggles the given id in/out of a Set.
 * @param {Function} setter - React state setter for a Set<*>
 * @returns {Function} id => void
 */
export const toggleSet = setter => id => {
  setter(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
};
