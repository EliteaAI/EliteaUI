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
