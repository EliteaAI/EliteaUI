// Story helper for whole EliteaUI screens: the app's full Redux store, sample answers instead of the backend, a data
// router (useBlocker works) and a frame of the Figma size. Copied to src/[fsd]/stories/lib/storyApi.jsx of a working branch from the design
// kit's templates/stories/storyApi.jsx; change it there. Nothing leaves the browser.
//
//   export default {
//     decorators: [withStoryApi({
//       routes: [['/public_applications/prompt_lib', { rows: [...], total: 2 }], ['/chat_templates/', []]],
//       state: { user: { name: 'George Smith', personal_project_id: 7 }, settings: { project: { id: 42 } } },
//       width: 894, height: 736,
//       path: '/chat',  // optional: the router's start address, for a story of a whole page with its routes
//     })],
//   };
//
// A route is [substring of the URL path, answer or (url, request) => answer]; `request.method` tells a POST; an answer may be
// a Promise (new Promise(() => {}) keeps the request pending). The first match wins, so put the longer path
// first ('/public_applications/' before '/applications/'). Any other /api/v2/ request gets FALLBACK and its path is
// printed as "[story api] no route: ..." in the browser console: a list hook that calls .find or .map on it needs a
// route with [].
// The files page lists buckets and files with a plain fetch of /artifacts/s3/ (src/api/artifacts.js), outside /api/v2/;
// it is answered the same way: ['/artifacts/s3/reports', { contents: [...] }] before ['/artifacts/s3/', { buckets: [...] }].
// All RTK Query endpoints must be injected before the reducers that match on them are imported
import { useState } from 'react';

import { Provider } from 'react-redux';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { Box } from '@mui/material';

// Slices that register themselves (import wizard, skill hub, indexes), as the app does at startup
import '@/[fsd]/app/store/registerReducers';
import { getRegisteredReducers } from '@/[fsd]/shared/config/reducerRegistry';
// The app's root wraps every page in it (src/[fsd]/app/root.jsx); the Artifacts page throws without it
import { FilePreviewNavigationProvider } from '@/[fsd]/shared/ui';
import '@/api';
import {
  middleware as eliteaMiddleware,
  reducer as eliteaReducer,
  reducerPath as eliteaReducerName,
} from '@/api/eliteaApi';
import agentHubReducer, { name as agentHubReducerName } from '@/slices/agentHub';
import applicationsReducer, { name as applicationsReducerName } from '@/slices/applications';
import artifactReducer, { name as artifactReducerName } from '@/slices/artifact';
import chatReducer, { name as chatReducerName } from '@/slices/chat';
import fileTypesReducer, { name as fileTypesReducerName } from '@/slices/fileTypes';
import pipelineReducer, { name as pipelineReducerName } from '@/slices/pipeline';
import pipelineEditorReducer, { name as pipelineEditorReducerName } from '@/slices/pipelineEditor';
import searchReducer, { name as searchReducerName } from '@/slices/search';
import settingsReducer, { name as settingsReducerName } from '@/slices/settings';
import tagsReducer, { name as tagsReducerName } from '@/slices/tags';
import authorReducer, { name as authorReducerName } from '@/slices/trendingAuthors';
import uploadReducer, { name as uploadReducerName } from '@/slices/upload';
import userReducer, { name as userReducerName } from '@/slices/user';
import { configureStore } from '@reduxjs/toolkit';

// Same list as src/[fsd]/shared/config/store.js plus the registered slices; a slice missing here shows up as
// "Cannot read properties of undefined" or "Cannot destructure property ... as it is undefined".
const REDUCERS = {
  ...getRegisteredReducers(),
  [eliteaReducerName]: eliteaReducer,
  [agentHubReducerName]: agentHubReducer,
  [applicationsReducerName]: applicationsReducer,
  [artifactReducerName]: artifactReducer,
  [authorReducerName]: authorReducer,
  [chatReducerName]: chatReducer,
  [fileTypesReducerName]: fileTypesReducer,
  [pipelineEditorReducerName]: pipelineEditorReducer,
  [pipelineReducerName]: pipelineReducer,
  [searchReducerName]: searchReducer,
  [settingsReducerName]: settingsReducer,
  [tagsReducerName]: tagsReducer,
  [uploadReducerName]: uploadReducer,
  [userReducerName]: userReducer,
};

const INIT_ACTION = { type: '@@storybook/INIT' };

export const FALLBACK = { rows: [], items: [], total: 0 };

// Backend addresses the stories answer; everything else (Storybook's own files) goes to the network
const MOCKED = ['/api/v2/', '/artifacts/s3/'];

// state: { sliceName: fields } — each slice starts from its own initial state, the given fields go on top.
export const createStoryStore = (state = {}) =>
  configureStore({
    reducer: REDUCERS,
    preloadedState: Object.fromEntries(
      Object.entries(state).map(([name, fields]) => [
        name,
        { ...REDUCERS[name](undefined, INIT_ACTION), ...fields },
      ]),
    ),
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }).concat([eliteaMiddleware]),
  });

// The routes of the story on screen; the fetch patch is installed once per page and reads them on every request.
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
    // RTK Query passes a Request; a plain fetch passes (url, init): the answer function gets whichever has the method
    const request = typeof input === 'string' ? { method: 'GET', ...init } : input;
    const body = route ? (typeof route[1] === 'function' ? route[1](url, request) : route[1]) : FALLBACK;
    // An answer may be a Promise: one that never settles keeps a request (and its spinner) pending
    return Promise.resolve(body).then(
      answer => new Response(JSON.stringify(answer), { headers: { 'Content-Type': 'application/json' } }),
    );
  };
};

// The team's .storybook/preview.jsx pads every story by 16 px; a fixed frame at the window's corner ignores that, so a
// shot of width × height shows exactly the frame, as Figma does.
const FRAME_SX = { position: 'fixed', top: 0, left: 0, display: 'flex', bgcolor: 'background.default' };

// Store and router are made once per story mount, so a re-render keeps the screen's state.
const StoryFrame = ({ Story, state, width, height, path }) => {
  const [store] = useState(() => createStoryStore(state));
  const [router] = useState(() =>
    createMemoryRouter(
      [
        {
          path: '*',
          element: (
            <FilePreviewNavigationProvider>
              <Box sx={{ ...FRAME_SX, width: `${width}px`, height: `${height}px` }}>
                <Story />
              </Box>
            </FilePreviewNavigationProvider>
          ),
        },
      ],
      { initialEntries: [path] },
    ),
  );
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
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
