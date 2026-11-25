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

// Resolves once readySelector is on the page and no spinner shows: 0.3 s after a spinner went, 2 s when none came yet, so
// a page that mounts its content twice (a shell, then the page after its own spinner) is not caught between the two;
// performance.now, as screenshots freeze Date.now
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
