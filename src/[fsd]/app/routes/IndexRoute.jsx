import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

import LoadingPage from '@/pages/LoadingPage';
import RouteDefinitions from '@/routes';

const IndexRoute = () => {
  const user = useSelector(state => state.user);

  // Show loading page while user info is being fetched
  if (!user.id) return <LoadingPage />;

  if (!user.personal_project_id)
    return (
      <Navigate
        to={RouteDefinitions.Onboarding}
        replace
      />
    );

  return (
    <Navigate
      to={RouteDefinitions.Chat}
      replace
    />
  );
};

IndexRoute.displayName = 'IndexRoute';

export default IndexRoute;
