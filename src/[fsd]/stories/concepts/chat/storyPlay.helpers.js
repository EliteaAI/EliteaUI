// Not waitForQuietPage: it treats every CircularProgress as loading, and the concept's context ring is a determinate one that stays
const SPINNER = '.MuiCircularProgress-root:not(.MuiCircularProgress-determinate)';

// The chat page mounts the field twice (shell, then the page after its own spinner), so wait for 2 s with no spinner and the element there
export const pageSettled = async (doc, readySelector) => {
  const started = performance.now();
  let quietSince = null;
  while (performance.now() - started < 30000) {
    const busy = doc.querySelector(SPINNER) || !doc.querySelector(readySelector);
    quietSince = busy ? null : (quietSince ?? performance.now());
    if (quietSince && performance.now() - quietSince >= 2000) return;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
};
