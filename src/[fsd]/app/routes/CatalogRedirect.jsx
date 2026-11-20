import { memo, useMemo } from 'react';

import { Navigate, useLocation } from 'react-router-dom';

import { SECTION_MODES } from '@/[fsd]/widgets/section-page/lib/constants';
import RouteDefinitions from '@/routes';

const CATALOG_TAB_PARAM = 'tab';
const CATALOG_SKILLS_TAB = 'skills';

// The Catalog page became the Discover tab of Agents and Skills; old links (share links, tours) land there
const CatalogRedirect = memo(() => {
  const location = useLocation();

  const target = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const isSkills = params.get(CATALOG_TAB_PARAM) === CATALOG_SKILLS_TAB;
    params.delete(CATALOG_TAB_PARAM);
    const listRoute = isSkills ? RouteDefinitions.Skills : RouteDefinitions.Applications;
    const search = params.toString();
    return `${listRoute}/${SECTION_MODES.discover}${search ? `?${search}` : ''}`;
  }, [location.search]);

  return (
    <Navigate
      to={target}
      state={location.state}
      replace
    />
  );
});

CatalogRedirect.displayName = 'CatalogRedirect';

export default CatalogRedirect;
