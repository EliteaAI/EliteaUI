const LOADING_SELECTOR = '.MuiSkeleton-root, .MuiCircularProgress-root, .MuiLinearProgress-root';

// Resolves once nothing loads and the DOM has not changed for quietMs: lazy pages and sample answers come after the
// story's first render, and an element they re-render would lose a hover or an open list set up earlier
export const waitForQuietPage = ({ quietMs = 800, timeoutMs = 20000 } = {}) =>
  new Promise(resolve => {
    let quietTimer;
    const finish = () => {
      observer.disconnect();
      clearTimeout(quietTimer);
      clearTimeout(timeout);
      resolve();
    };
    const restart = () => {
      clearTimeout(quietTimer);
      quietTimer = setTimeout(
        () => (document.querySelector(LOADING_SELECTOR) ? restart() : finish()),
        quietMs,
      );
    };
    const observer = new MutationObserver(restart);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    });
    const timeout = setTimeout(finish, timeoutMs);
    restart();
  });

// waitForQuietPage counts every CircularProgress as loading; a determinate one (a progress ring) stays on the page
const SPINNER = '.MuiCircularProgress-root:not(.MuiCircularProgress-determinate)';

// Resolves once no spinner shows and readySelector has been on the page for 2 s: a page that mounts its content twice
// (a shell, then the page after its own spinner) would otherwise be caught between the two
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
