import { memo } from 'react';

import { Navigate, useLocation } from 'react-router-dom';

import RouteDefinitions from '@/routes';

const LegacyCatalogRedirect = memo(() => {
  const location = useLocation();
  return (
    <Navigate
      to={RouteDefinitions.EliteaCatalog + location.search}
      state={location.state}
      replace
    />
  );
});

LegacyCatalogRedirect.displayName = 'LegacyCatalogRedirect';

export default LegacyCatalogRedirect;
