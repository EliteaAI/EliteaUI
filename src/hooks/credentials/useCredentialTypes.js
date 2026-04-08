import * as React from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { URL_PARAMS_KEY_TAGS } from '@/common/constants';

/**
 * Custom hook for managing credential type filtering
 * Following the same pattern as Toolkits useTypes hook
 */
const useCredentialTypes = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTypesFromUrl = React.useCallback(() => {
    const currentQueryParam = location.search ? new URLSearchParams(location.search) : new URLSearchParams();
    const typeNamesFromUrl = currentQueryParam.getAll(URL_PARAMS_KEY_TAGS)?.filter(type => type !== '');
    return [...new Set(typeNamesFromUrl)];
  }, [location.search]);

  const selectedTypes = React.useMemo(() => {
    return getTypesFromUrl();
  }, [getTypesFromUrl]);

  const navigateWithTypes = React.useCallback(
    types => {
      const currentQueryParam = location.search
        ? new URLSearchParams(location.search)
        : new URLSearchParams();
      currentQueryParam.delete(URL_PARAMS_KEY_TAGS);
      if (types.length > 0) {
        for (const type of types) {
          currentQueryParam.append(URL_PARAMS_KEY_TAGS, type);
        }
      }

      navigate(
        {
          pathname: location.pathname,
          search: currentQueryParam.toString(),
        },
        { replace: true, state: location.state },
      );
    },
    [location.pathname, location.search, location.state, navigate],
  );

  const updateTypeInUrl = React.useCallback(
    newType => {
      const isExistingType = selectedTypes.includes(newType);
      const types = isExistingType
        ? selectedTypes.filter(type => type !== newType)
        : [...selectedTypes, newType];

      navigateWithTypes(types);
    },
    [navigateWithTypes, selectedTypes],
  );

  const handleClickType = React.useCallback(
    (e, type) => {
      // Support both direct click (e.target.innerText) and type object parameter for compatibility with Categories component
      const newType = type ? type.name : e.target.innerText;
      updateTypeInUrl(newType);
    },
    [updateTypeInUrl],
  );

  const handleClear = React.useCallback(() => {
    navigateWithTypes([]);
  }, [navigateWithTypes]);

  return {
    selectedTypes,
    handleClickType,
    handleClear,
  };
};

export default useCredentialTypes;
