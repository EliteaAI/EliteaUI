// Shared by the concept stories' play(): the chat screen loads in two steps (the app's shell, then the page with its own
// spinner for ~1-2.5 s, which mounts the field again), so a story acts once the element it needs is there and no spinner
// shows. Once the page's spinner has come and gone the field stands in its place at once (measured 2026-11-24), so a
// short quiet is enough; with no spinner seen yet, the story still waits 2 s in a row, as before, in case it comes late.
// The fixed 2 s after the spinner made every story ~1.7 s slower, and a click on another story in that time reloads
// the whole frame (Storybook reloads it when the story it leaves is still playing). performance.now, not Date.now: a
// frozen clock (screenshots) would keep Date.now still.
const SPINNER = '.MuiCircularProgress-root:not(.MuiCircularProgress-determinate)';

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
