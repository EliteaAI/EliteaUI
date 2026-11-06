import StoryFrame from './StoryFrame';

export const FALLBACK = { rows: [], items: [], total: 0 };

const MOCKED = ['/api/v2/', '/artifacts/s3/'];

// Routes are [url path substring, answer | (url, request) => answer]; the first match wins
export const mockApi = routes => {
  window.__storyApiRoutes = routes;
  if (window.__storyApiInstalled) return;
  window.__storyApiInstalled = true;
  const realFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    if (!MOCKED.some(part => url.includes(part))) return realFetch(input, init);
    const path = new URL(url, window.location.origin).pathname;
    const route = window.__storyApiRoutes.find(([part]) => path.includes(part));
    // eslint-disable-next-line no-console
    if (!route) console.info('[story api] no route:', path);
    const request = typeof input === 'string' ? { method: 'GET', ...init } : input;
    const body = route ? (typeof route[1] === 'function' ? route[1](url, request) : route[1]) : FALLBACK;
    return Promise.resolve(body).then(
      answer => new Response(JSON.stringify(answer), { headers: { 'Content-Type': 'application/json' } }),
    );
  };
};

export const withStoryApi = ({ routes = [], state = {}, width, height, path = '/' }) => {
  const StoryApiDecorator = Story => {
    mockApi(routes);
    return (
      <StoryFrame
        Story={Story}
        state={state}
        width={width}
        height={height}
        path={path}
      />
    );
  };
  return StoryApiDecorator;
};
