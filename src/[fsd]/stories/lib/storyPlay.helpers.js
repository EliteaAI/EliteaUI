// a determinate CircularProgress is a progress ring that stays on the page, not loading
const LOADING_SELECTOR =
  '.MuiSkeleton-root, .MuiCircularProgress-root:not(.MuiCircularProgress-determinate), .MuiLinearProgress-root';

// Resolves once nothing loads, readySelector (if given) is on the page and the DOM has not changed for quietMs: lazy
// pages and sample answers come after the story's first render, and an element they re-render would lose a hover or
// an open list set up earlier
export const waitForQuietPage = ({ quietMs = 800, timeoutMs = 20000, readySelector } = {}) =>
  new Promise(resolve => {
    let quietTimer;
    const isBusy = () =>
      document.querySelector(LOADING_SELECTOR) || (readySelector && !document.querySelector(readySelector));
    const finish = () => {
      observer.disconnect();
      clearTimeout(quietTimer);
      clearTimeout(timeout);
      resolve();
    };
    const restart = () => {
      clearTimeout(quietTimer);
      quietTimer = setTimeout(() => (isBusy() ? restart() : finish()), quietMs);
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
