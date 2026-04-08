import { useEffect, useRef } from 'react';

import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { actions } from '@/slices/search';

/**
 * Component that listens for route changes and resets search state
 * This is a more direct approach to ensure search is cleared on navigation
 */
const RouteChangeResetSearch = () => {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    // Get the first two parts of the path (e.g., /toolkits/all -> toolkits/all)
    const getPathParts = path => {
      const parts = path
        .split('/')
        .filter(p => p)
        .slice(0, 2);
      return parts.join('/');
    };

    const currentPathKey = getPathParts(pathname);
    const prevPathKey = getPathParts(prevPathRef.current);

    // Only reset if we're moving between different sections
    if (currentPathKey !== prevPathKey) {
      // Directly reset Redux search state
      dispatch(actions.resetQuery());

      // Update reference to current path
      prevPathRef.current = pathname;
    }
  }, [pathname, dispatch]);

  return null; // This component doesn't render anything
};

export default RouteChangeResetSearch;
