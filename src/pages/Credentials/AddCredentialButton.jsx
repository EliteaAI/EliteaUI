import React, { useCallback, useMemo } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { Box, ClickAwayListener, IconButton } from '@mui/material';

import { CredentialsTabs, ViewMode } from '@/common/constants';
import PlusIcon from '@/components/Icons/PlusIcon';
import RouteDefinitions from '@/routes';
import { useTheme } from '@emotion/react';

const AddCredentialButton = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const { state: locationState } = useLocation();
  const { routeStack = [] } = useMemo(() => locationState || { routeStack: [] }, [locationState]);

  const onClickAdd = useCallback(() => {
    const newRouteStack = [...routeStack];
    if (newRouteStack.length) {
      newRouteStack[newRouteStack.length - 1].pagePath =
        `${RouteDefinitions.Credentials}/${CredentialsTabs[0]}`;
    }
    newRouteStack.push({
      breadCrumb: 'New Credentials',
      viewMode: ViewMode.Owner,
      pagePath: RouteDefinitions.CreateCredentialFromMain,
    });
    navigate(
      {
        pathname: RouteDefinitions.CreateCredentialFromMain,
      },
      {
        replace: true,
        state: {
          routeStack: newRouteStack,
        },
      },
    );
  }, [navigate, routeStack]);

  const handleClickAway = useCallback(() => {
    // No-op for click away
  }, []);

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box>
        <IconButton
          variant="alita"
          color="primary"
          onClick={onClickAdd}
        >
          <PlusIcon fill={theme.palette.icon.fill.send} />
        </IconButton>
      </Box>
    </ClickAwayListener>
  );
};

export default AddCredentialButton;
