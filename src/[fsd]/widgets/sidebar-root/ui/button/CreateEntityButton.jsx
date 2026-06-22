import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { Box, ClickAwayListener, Paper, Popper, useTheme } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { Button } from '@/[fsd]/shared/ui';
import { CreateEntityConstants } from '@/[fsd]/widgets/sidebar-root/lib/constants';
import { useDisablePersonalSpace } from '@/[fsd]/widgets/sidebar-root/lib/hooks';
import PlusIcon from '@/assets/plus-icon.svg?react';
import {
  ALLOW_PROJECT_OWN_LLMS,
  PERMISSIONS,
  PUBLIC_PROJECT_ID,
  SearchParams,
  ViewMode,
} from '@/common/constants';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';
import CheckIcon from '@/components/Icons/CheckIcon';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions from '@/routes';
import { actions as artifactActions } from '@/slices/artifact';

const CreateEntityButton = memo(props => {
  const { tourId } = props;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { checkPermission } = useCheckPermission();
  const isCreatingNewConversation = useSelector(state => state.chat.isCreatingNewConversation);

  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const [selectedOption, setSelectedOption] = useState('Chat');
  const [openMenu, setOpenMenu] = useState(false);
  const { pathname, state } = useLocation();
  const locationState = useMemo(() => ({ from: [], routeStack: [], ...state }), [state]);
  const styles = createEntityButtonStyles(sideBarCollapsed);
  const anchorRef = useRef(null);

  const isFromApplicationDetailPage = useMemo(() => !!pathname.match(/\/agents\/\d+/g), [pathname]);
  const isFromPipelineDetailPage = useMemo(() => !!pathname.match(/\/pipelines\/\d+/g), [pathname]);
  const isFromToolkitDetailPage = useMemo(() => !!pathname.match(/\/toolkits\/\d+/g), [pathname]);
  const isFromCredentialsDetailPage = useMemo(
    () => !!pathname.match(/\/credentials\/edit\/\d+/g),
    [pathname],
  );
  const isSystemPromptsPage = useMemo(() => pathname.includes('/settings/prompts'), [pathname]);
  const isSettingsUsersPage = useMemo(() => pathname.includes('/settings/users'), [pathname]);
  const shouldDisableCreatingChat = useMemo(
    () => selectedOption === CreateEntityConstants.OptionsMap.Chat && isCreatingNewConversation,
    [selectedOption, isCreatingNewConversation],
  );
  const shouldDisableInviteUser = useMemo(
    () => isSettingsUsersPage && !checkPermission(PERMISSIONS.users.create),
    [isSettingsUsersPage, checkPermission],
  );
  const isCreatingNow = useMemo(() => pathname.includes('/create'), [pathname]);
  const isAppCatalogTab = useMemo(() => pathname.startsWith(RouteDefinitions.AppsCatalog), [pathname]);
  const shouldReplaceThePage = useMemo(
    () =>
      isFromApplicationDetailPage ||
      isFromPipelineDetailPage ||
      isFromToolkitDetailPage ||
      isFromCredentialsDetailPage ||
      isCreatingNow,
    [
      isCreatingNow,
      isFromApplicationDetailPage,
      isFromPipelineDetailPage,
      isFromToolkitDetailPage,
      isFromCredentialsDetailPage,
    ],
  );
  const { shouldDisablePersonalSpace } = useDisablePersonalSpace();
  const projectId = useSelectedProjectId();
  const shouldDisableOwnLLMs = useMemo(
    () =>
      selectedOption === 'Configuration' &&
      ALLOW_PROJECT_OWN_LLMS === false &&
      projectId != PUBLIC_PROJECT_ID,
    [selectedOption, projectId],
  );

  const isSimpleCreateRoute = useMemo(() => {
    const lowerPathname = pathname.toLowerCase();
    const isSimple = CreateEntityConstants.SimpleCreateRoutes.some(route => lowerPathname.includes(route));

    const isKnownRoute =
      CreateEntityConstants.RouteToLabelMap.some(({ route }) => lowerPathname.includes(route)) ||
      CreateEntityConstants.SimpleCreateRoutes.some(route => lowerPathname.includes(route)) ||
      CreateEntityConstants.DropdownItems.some(item => pathname.includes(item.route));
    return isSimple || !isKnownRoute;
  }, [pathname]);

  const currentLabel = useMemo(() => {
    const lowerPathname = pathname.toLowerCase();
    const match = CreateEntityConstants.RouteToLabelMap.find(({ route }) => lowerPathname.includes(route));
    return match?.label || null;
  }, [pathname]);

  const currentDropdownItem = useMemo(() => {
    if (!currentLabel) return null;
    return CreateEntityConstants.DropdownItems.find(item => item.label === currentLabel) || null;
  }, [currentLabel]);

  const handleCommand = useCallback(
    (optionOverride = null) => {
      const stateOption = optionOverride ?? selectedOption;
      if (!optionOverride && pathname.startsWith(RouteDefinitions.AppsApplications)) {
        navigate(RouteDefinitions.AppsCatalog, { state: locationState });
        return;
      }

      switch (stateOption) {
        case 'Secret':
          {
            // Navigate to settings/secrets with a flag to trigger row creation
            const secretsPath = RouteDefinitions.SettingsWithTab.replace(':tab', 'secrets');
            const search = 'createSecret=1';
            navigate(
              { pathname: secretsPath, search: search ? `?${search}` : '' },
              {
                replace: false,
                state: locationState,
              },
            );
          }
          return;
        case 'User':
          {
            // Navigate to settings/users with a flag to trigger invite user dialog
            const usersPath = RouteDefinitions.SettingsWithTab.replace(':tab', 'users');
            const search = 'inviteUsers=1';
            navigate(
              { pathname: usersPath, search: search ? `?${search}` : '' },
              {
                replace: false,
                state: locationState,
              },
            );
          }
          return;
        case 'Application':
          navigate(RouteDefinitions.AppsCatalog, { state: locationState });
          return;
        default: {
          const destUrl = CreateEntityConstants.CommandPathMap[stateOption];
          const breadCrumb = CreateEntityConstants.BreadCrumbMap[stateOption];
          let search =
            stateOption === CreateEntityConstants.OptionsMap.Chat
              ? 'create=1'
              : `${SearchParams.ViewMode}=${ViewMode.Owner}`;

          if (stateOption === 'Configuration') {
            search += '&from=model-configuration';
          }

          if (destUrl !== pathname || stateOption === CreateEntityConstants.OptionsMap.Chat) {
            let newRouteStack = [...locationState.routeStack];

            newRouteStack =
              stateOption === CreateEntityConstants.OptionsMap.Chat
                ? [
                    {
                      breadCrumb,
                      viewMode: ViewMode.Owner,
                      pagePath: destUrl,
                    },
                  ]
                : [
                    {
                      breadCrumb: CreateEntityConstants.BreadCrumbMap[destUrl],
                      pagePath:
                        destUrl === RouteDefinitions.CreatePersonalToken
                          ? RouteDefinitions.SettingsWithTab.replace(':tab', 'tokens')
                          : `${CreateEntityConstants.PrevUrlPathMap[destUrl]}?${SearchParams.ViewMode}=${ViewMode.Owner}`,
                    },
                    {
                      breadCrumb,
                      viewMode: ViewMode.Owner,
                      pagePath: `${destUrl}${search ? `?${search}` : ''}`,
                    },
                  ];
            navigate(
              { pathname: destUrl, search },
              {
                replace: shouldReplaceThePage,
                state: { routeStack: newRouteStack },
              },
            );
            if (destUrl === RouteDefinitions.CreateBucket) {
              dispatch(artifactActions.setBucket(null));
            }
          }
        }
      }
    },
    [dispatch, selectedOption, pathname, locationState, navigate, shouldReplaceThePage],
  );

  const handleOpenMenu = useCallback(() => {
    setOpenMenu(prev => !prev);
  }, []);

  useEffect(() => {
    const lowerPathname = pathname.toLocaleLowerCase();

    const matchedPath = CreateEntityConstants.PathToOptionMap.find(({ path }) =>
      lowerPathname.includes(path),
    );
    if (matchedPath) {
      setSelectedOption(matchedPath.option);
    }
  }, [pathname]);

  const hasPermissionForSelectedOption = useMemo(() => {
    if (isSimpleCreateRoute) return true;

    const permissions = CreateEntityConstants.CreationPermissions[selectedOption];
    if (!permissions || !permissions.length) return true;

    // For buckets, if user can access the Artifacts page, they should be able to create buckets
    // This is a more practical approach since the user is already viewing the Artifacts page
    if (selectedOption === CreateEntityConstants.OptionsMap.Bucket) {
      // If user can access artifacts page, allow bucket creation
      return true;
    }

    // Check if user has any of the required permissions for other entities
    return permissions.some(permission => checkPermission(permission));
  }, [selectedOption, checkPermission, isSimpleCreateRoute]);

  const disableCreateButton = useMemo(
    () =>
      shouldDisablePersonalSpace ||
      !hasPermissionForSelectedOption ||
      isSystemPromptsPage ||
      shouldDisableInviteUser ||
      shouldDisableCreatingChat ||
      shouldDisableOwnLLMs,
    [
      shouldDisablePersonalSpace,
      hasPermissionForSelectedOption,
      isSystemPromptsPage,
      shouldDisableInviteUser,
      shouldDisableCreatingChat,
      shouldDisableOwnLLMs,
    ],
  );

  const handleDropdownItemClick = useCallback(
    item => {
      const permissions = CreateEntityConstants.CreationPermissions[item.option];
      if (permissions?.length && !permissions.some(p => checkPermission(p))) {
        return;
      }
      setOpenMenu(false);
      handleCommand(item.option);
    },
    [handleCommand, checkPermission],
  );

  const handleClickAway = useCallback(() => {
    setOpenMenu(false);
  }, []);

  const handleMainButtonClick = useCallback(() => {
    if (isAppCatalogTab) {
      navigate(RouteDefinitions.AppsCatalog, { state: locationState });
      return;
    }
    handleCommand();
  }, [isAppCatalogTab, navigate, locationState, handleCommand]);

  const showSimpleButton = sideBarCollapsed || isSimpleCreateRoute;

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box
        component="span"
        data-tour={tourId}
        sx={styles.wrapper}
        ref={anchorRef}
      >
        <StyledTooltip
          placement="right"
          title={sideBarCollapsed ? 'Create new...' : ''}
          enterDelay={500}
          enterNextDelay={500}
        >
          <Box sx={styles.span}>
            {showSimpleButton ? (
              <Button.BaseBtn
                variant="special"
                disabled={disableCreateButton}
                startIcon={<PlusIcon />}
                sx={styles.simpleButton}
                onClick={handleOpenMenu}
              >
                {!sideBarCollapsed ? 'Create' : null}
              </Button.BaseBtn>
            ) : (
              <>
                <Button.BaseBtn
                  variant="special"
                  disabled={disableCreateButton}
                  startIcon={<PlusIcon />}
                  sx={styles.mainButton}
                  onClick={handleMainButtonClick}
                >
                  {currentLabel}
                </Button.BaseBtn>
                <Button.BaseBtn
                  variant="special"
                  disabled={disableCreateButton}
                  sx={styles.chevronButton}
                  onClick={handleOpenMenu}
                >
                  <ArrowDownIcon
                    fill="currentColor"
                    style={{ transform: openMenu ? 'rotate(180deg)' : 'none' }}
                  />
                </Button.BaseBtn>
              </>
            )}
          </Box>
        </StyledTooltip>

        <Popper
          open={openMenu}
          anchorEl={anchorRef.current}
          placement={sideBarCollapsed ? 'right-start' : 'bottom-start'}
          sx={styles.popper}
        >
          <Paper sx={styles.dropdown}>
            {CreateEntityConstants.DropdownItems.map(item => (
              <Box
                key={item.label}
                sx={styles.dropdownItem(currentDropdownItem?.label === item.label)}
                onClick={() => handleDropdownItemClick(item)}
              >
                {item.label}
                {currentDropdownItem?.label === item.label && (
                  <CheckIcon
                    fill={theme.palette.text.secondary}
                    sx={styles.checkIcon}
                  />
                )}
              </Box>
            ))}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
});

CreateEntityButton.displayName = 'CreateEntityButton';

const createEntityButtonStyles = sideBarCollapsed => ({
  wrapper: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    boxSizing: 'border-box',
  },
  span: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    boxSizing: 'border-box',
    gap: '0.0625rem',
  },
  simpleButton: {
    width: '100%',
    ...(sideBarCollapsed && {
      width: '1.75rem !important',
      minWidth: '1.75rem !important',
    }),
  },
  mainButton: {
    flex: '1 1 auto',
    borderRadius: '0.875rem 0.125rem 0.125rem 0.875rem',
  },
  chevronButton: {
    borderRadius: '0.125rem 0.875rem 0.875rem 0.125rem',
    padding: '0 0.5rem',
    minWidth: 'unset',
    width: 'fit-content',
  },
  popper: {
    zIndex: 1300,
  },
  dropdown: ({ palette }) => ({
    backgroundColor: palette.background.secondary,
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    padding: '0.5rem 0',
    minWidth: '11.5rem',
    boxShadow: '0 0.5rem 0.75rem rgba(0, 0, 0, 0.30)',
    marginTop: sideBarCollapsed ? 0 : '0.25rem',
    marginLeft: sideBarCollapsed ? '0.25rem' : 0,
  }),
  dropdownItem:
    isSelected =>
    ({ palette, spacing }) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing(1, 2),
      cursor: 'pointer',
      color: palette.text.secondary,
      fontSize: '0.875rem',
      '&:hover': {
        backgroundColor: palette.action.hover,
      },
      ...(isSelected && {
        backgroundColor: palette.split.pressed,
      }),
    }),
  checkIcon: {
    width: '1rem',
    height: '1rem',
  },
});

export default CreateEntityButton;
