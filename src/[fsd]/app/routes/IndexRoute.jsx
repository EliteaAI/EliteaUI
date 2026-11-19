import { memo } from 'react';

import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

import LoadingPage from '@/pages/LoadingPage';
import RouteDefinitions from '@/routes';

const IndexRoute = memo(() => {
  const user = useSelector(state => state.user);

  // Show loading page while user info is being fetched
  if (!user.id) return <LoadingPage />;

  // The router keeps this screen while the next page's code loads (navigations run in a transition), so it
  // shows the loader instead of an empty page until the chat or onboarding page is ready
  return (
    <>
      <LoadingPage />
      <Navigate
        to={user.personal_project_id ? RouteDefinitions.Chat : RouteDefinitions.Onboarding}
        replace
      />
    </>
  );
});

IndexRoute.displayName = 'IndexRoute';

export default IndexRoute;
