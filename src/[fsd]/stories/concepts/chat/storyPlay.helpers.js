// Not waitForQuietPage: it treats every CircularProgress as loading, and the concept's context ring is a determinate one that stays
const SPINNER = '.MuiCircularProgress-root:not(.MuiCircularProgress-determinate)';

// The chat page mounts the field twice (shell, then the page after its spinner): act once the element is there and no spinner shows,
// 0.3 s after the spinner went, 2 s when none came yet; performance.now, as screenshots freeze Date.now
export const pageSettled = async (doc, readySelector) => {
  const started = performance.now();
  let quietSince = null;
  let spinnerSeen = false;
  while (performance.now() - started < 30000) {
    const spinner = doc.querySelector(SPINNER);
    spinnerSeen ||= Boolean(spinner);
    const busy = spinner || !doc.querySelector(readySelector);
    quietSince = busy ? null : (quietSince ?? performance.now());
    if (quietSince && performance.now() - quietSince >= (spinnerSeen ? 300 : 2000)) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
};

export const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
