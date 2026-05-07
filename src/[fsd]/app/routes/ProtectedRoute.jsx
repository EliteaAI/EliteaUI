import { memo, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

import LoadingPage from '@/pages/LoadingPage';
import RouteDefinitions from '@/routes';

const ProtectedRoute = memo(props => {
  const { requiredPermissions, publicPage, children } = props;

  const user = useSelector(state => state.user);
  const { permissions, publicPermissions } = user;

  const targetPermissions = useMemo(
    () => (publicPage ? publicPermissions : permissions),
    [permissions, publicPage, publicPermissions],
  );

  if (!requiredPermissions) return children;
  if (!targetPermissions) return <LoadingPage />;

  const hasPermission = requiredPermissions.some(p => targetPermissions?.includes(p));

  if (!hasPermission) {
    return (
      <Navigate
        to={RouteDefinitions.Applications}
        replace
      />
    );
  }

  return children;
});

ProtectedRoute.displayName = 'ProtectedRoute';

export default ProtectedRoute;
