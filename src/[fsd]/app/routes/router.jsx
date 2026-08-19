import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { AppLayout } from '@/[fsd]/app/layout';
import AuthCallbackPage from '@/[fsd]/pages/auth/index.jsx';
import SharedConversationPage from '@/[fsd]/pages/shared-conversation/index.jsx';
import Page404 from '@/pages/Page404.jsx';
import RouteDefinitions, { getBasename } from '@/routes';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route
        path={RouteDefinitions.AuthCallbackPage}
        element={<AuthCallbackPage />}
      />
      <Route
        path={RouteDefinitions.SharedConversation}
        element={<SharedConversationPage />}
      />
      <Route
        path="/*"
        element={<AppLayout />}
      >
        <Route
          path="*"
          element={<Page404 />}
        />
      </Route>
    </>,
  ),
  { basename: getBasename() },
);

export default router;
