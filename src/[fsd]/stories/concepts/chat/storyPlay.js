// Shared by the concept stories' play(): the chat screen loads in two steps (the app's shell, then the page with its own
// spinner for ~1.5 s, which mounts the field again), so a story acts once no spinner has shown for 2 s in a row and the
// element it needs is there. performance.now, not Date.now: a frozen clock (screenshots) would keep Date.now still.
const SPINNER = '.MuiCircularProgress-root:not(.MuiCircularProgress-determinate)';

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

export const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
