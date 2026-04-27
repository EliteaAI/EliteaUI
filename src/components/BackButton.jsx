import * as React from 'react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { IconButton } from '@mui/material';

import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { SearchParams } from '@/common/constants';
import ArrowBackIcon from '@/components/Icons/ArrowBackIcon';
import useBackPath from '@/hooks/useBackPath';
import { usePageDetails } from '@/hooks/usePageDetails';
import RouteDefinitions from '@/routes';

const BackButton = memo(() => {
  const firstRender = useRef(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { pageType } = usePageDetails();
  const [navigateBackUrl, setNavigateBackUrl] = useState('');
  const { prevPath, prevState } = useBackPath();
  const styles = backButtonStyles();

  const gotoListPage = useCallback(() => {
    const listRoute = NavigationHelpers.getListRouteByPageType(pageType, RouteDefinitions.Chat);
    if (listRoute) {
      navigate(listRoute, { replace: true });
    } else {
      navigate(-1);
    }
  }, [navigate, pageType]);

  useEffect(() => {
    const viewForkedEntityBackUrl = localStorage.getItem('viewForkedEntityBackUrl');
    if (firstRender.current && viewForkedEntityBackUrl) {
      setNavigateBackUrl(viewForkedEntityBackUrl);
    }
    firstRender.current = false;
    localStorage.setItem('viewForkedEntityBackUrl', '');
  }, []);

  // Helper function to check if current route matches credential creation patterns
  const isCredentialCreateRoute = useCallback(() => {
    const { pathname } = location;
    return (
      pathname === RouteDefinitions.CreateCredentialFromMain ||
      pathname.startsWith(RouteDefinitions.CreateCredentialTypeFromMain.replace(':credentialType', ''))
    );
  }, [location]);

  const onBack = useCallback(() => {
    if (!navigateBackUrl) {
      // Special handling for CreateCredential pages - check for from=model-configuration parameter
      if (pageType === 'CredentialDetails' || isCredentialCreateRoute()) {
        const fromParam = searchParams.get('from');
        if (fromParam === 'information') {
          // Navigate back to Model Configuration Settings page (handle both new and legacy parameter)
          navigate(
            {
              pathname: RouteDefinitions.SettingsWithTab.replace(':tab', 'model-configuration'),
            },
            { replace: true },
          );
          return;
        }
      }

      // Special handling for CreateToolkit pages - check for ReturnUrl parameter first
      if (pageType === 'ToolkitDetails' || pageType === 'MCPDetails') {
        const returnUrl = searchParams.get(SearchParams.ReturnUrl);
        if (returnUrl) {
          // Return to the source application page
          const decodedReturnUrl = decodeURIComponent(returnUrl);
          const url = new URL(decodedReturnUrl, window.location.origin);
          navigate(
            {
              pathname: url.pathname,
              search: url.search,
            },
            { replace: true },
          );
          return;
        }
      }

      if (prevPath) {
        // Use a base URL to create a full URL
        const url = new URL(prevPath, 'http://example.com'); // Base URL is required for relative paths
        // Extract pathname and search
        const pathname = url.pathname;
        const search = url.search;
        navigate(
          {
            pathname,
            search,
          },
          {
            replace: true,
            state: prevState,
          },
        );
      } else {
        gotoListPage();
      }
    } else {
      window.location.replace(navigateBackUrl);
      setNavigateBackUrl('');
    }
  }, [
    navigateBackUrl,
    prevPath,
    navigate,
    prevState,
    gotoListPage,
    pageType,
    searchParams,
    isCredentialCreateRoute,
  ]);
  return (
    <IconButton
      variant="alita"
      color={'tertiary'}
      onClick={onBack}
      sx={styles.iconButton}
    >
      <ArrowBackIcon />
    </IconButton>
  );
});

const backButtonStyles = () => ({
  iconButton: ({ palette }) => ({
    margin: '0',
    '&:hover svg path': {
      fill: palette.icon.fill.secondary,
    },
  }),
});

BackButton.displayName = 'BackButton';

export default BackButton;
