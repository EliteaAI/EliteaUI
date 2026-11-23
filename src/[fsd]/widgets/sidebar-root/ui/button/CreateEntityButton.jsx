import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { Box, ClickAwayListener, Paper, Popper, useTheme } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { useIsOwnLLMsRestricted } from '@/[fsd]/shared/lib/hooks';
import { AppLink, Button } from '@/[fsd]/shared/ui';
import { CreateEntityConstants } from '@/[fsd]/widgets/sidebar-root/lib/constants';
import { useDisablePersonalSpace } from '@/[fsd]/widgets/sidebar-root/lib/hooks';
import PlusIcon from '@/assets/plus-icon.svg?react';
import { PERMISSIONS, SearchParams, ViewMode } from '@/common/constants';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';
import CheckIcon from '@/components/Icons/CheckIcon';
import useCheckPermission from '@/hooks/useCheckPermission';
import RouteDefinitions from '@/routes';
import { actions as artifactActions } from '@/slices/artifact';

const CreateEntityButton = memo(props => {
  const { tourId } = props;
  const dispatch = useDispatch();
  const theme = useTheme();
  const { checkPermission } = useCheckPermission();
  const isCreatingNewConversation = useSelector(state => state.chat.isCreatingNewConversation);

  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const [selectedOption, setSelectedOption] = useState(CreateEntityConstants.OptionsMap.Chat);
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

  const isSimpleCreateRoute = useMemo(() => {
    const lowerPathname = pathname.toLowerCase();
    const isSimple = CreateEntityConstants.SimpleCreateRoutes.some(route => lowerPathname.includes(route));

    const isKnownRoute =
      CreateEntityConstants.RouteToLabelMap.some(({ route }) => lowerPathname.includes(route)) ||
      CreateEntityConstants.SimpleCreateRoutes.some(route => lowerPathname.includes(route)) ||
      CreateEntityConstants.DropdownItems.some(item => pathname.includes(item.route));
    return isSimple || !isKnownRoute;
  }, [pathname]);

  const isOwnLLMsRestricted = useIsOwnLLMsRestricted();

  const shouldDisableOwnLLMs = useMemo(
    () =>
      !isSimpleCreateRoute &&
      selectedOption === CreateEntityConstants.OptionsMap.AIProvider &&
      isOwnLLMsRestricted,
    [isSimpleCreateRoute, selectedOption, isOwnLLMsRestricted],
  );

  const currentLabel = useMemo(() => {
    const lowerPathname = pathname.toLowerCase();
    const match = CreateEntityConstants.RouteToLabelMap.find(({ route }) => lowerPathname.includes(route));
    return match?.label || null;
  }, [pathname]);

  const currentDropdownItem = useMemo(() => {
    if (!currentLabel) return null;
    return CreateEntityConstants.DropdownItems.find(item => item.label === currentLabel) || null;
  }, [currentLabel]);

  // Resolves where a create option leads, so the same target drives both the link `href` and a plain click
  const getDestination = useCallback(
    option => {
      const settingsTabDestination = (tab, search) => ({
        to: { pathname: RouteDefinitions.SettingsWithTab.replace(':tab', tab), search },
        state: locationState,
        replace: false,
      });

      switch (option) {
        case CreateEntityConstants.OptionsMap.Secret:
          return settingsTabDestination('secrets', '?createSecret=1');
        case CreateEntityConstants.OptionsMap.User:
          return settingsTabDestination('users', '?inviteUsers=1');
        case CreateEntityConstants.OptionsMap.Application:
          return { to: RouteDefinitions.AppsCatalog, state: locationState };
        default: {
          const destUrl = CreateEntityConstants.CommandPathMap[option];
          if (!destUrl) return null;

          const isChat = option === CreateEntityConstants.OptionsMap.Chat;
          const breadCrumb = CreateEntityConstants.BreadCrumbMap[option];
          let search = isChat ? 'create=1' : `${SearchParams.ViewMode}=${ViewMode.Owner}`;
          if (option === CreateEntityConstants.OptionsMap.AIProvider) {
            search += '&from=ai-providers';
          }

          const routeStack = isChat
            ? [{ breadCrumb, viewMode: ViewMode.Owner, pagePath: destUrl }]
            : [
                {
                  breadCrumb: CreateEntityConstants.BreadCrumbMap[destUrl],
                  pagePath:
                    destUrl === RouteDefinitions.CreatePersonalToken
                      ? RouteDefinitions.SettingsWithTab.replace(':tab', 'tokens')
                      : `${CreateEntityConstants.PrevUrlPathMap[destUrl]}?${SearchParams.ViewMode}=${ViewMode.Owner}`,
                },
                { breadCrumb, viewMode: ViewMode.Owner, pagePath: `${destUrl}?${search}` },
              ];

          return {
            to: { pathname: destUrl, search },
            state: { routeStack },
            replace: shouldReplaceThePage,
            // Already on the create page: a plain click is a no-op (opening in a new tab still works)
            isCurrentPage: !isChat && destUrl === pathname,
          };
        }
      }
    },
    [locationState, pathname, shouldReplaceThePage],
  );

  const mainDestination = useMemo(
    () =>
      getDestination(
        isAppCatalogTab || pathname.startsWith(RouteDefinitions.AppsApplications)
          ? CreateEntityConstants.OptionsMap.Application
          : selectedOption,
      ),
    [isAppCatalogTab, pathname, getDestination, selectedOption],
  );

  // A real link (href) lets the browser offer "Open link in new tab"; a disabled or unresolved target stays
  // a plain element. Side effects run in `onClick`, which AppLink skips for a click that opens a new tab.
  const getLinkProps = (destination, isDisabled, onAfterClick) => {
    if (!destination || isDisabled) return {};

    return {
      component: AppLink,
      to: destination.to,
      state: destination.state,
      replace: destination.replace,
      onClick: event => {
        if (destination.isCurrentPage) event.preventDefault();
        else if (destination.to?.pathname === RouteDefinitions.CreateBucket) {
          dispatch(artifactActions.setBucket(null));
        }
        onAfterClick?.();
      },
    };
  };

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

  const getHasPermissionForDropdownItem = useCallback(
    option => {
      // IntegrationGuard redirects away from AI Provider creation under the same condition
      if (option === CreateEntityConstants.OptionsMap.AIProvider && isOwnLLMsRestricted) return false;

      const permissions = CreateEntityConstants.CreationPermissions[option];
      if (!permissions || !permissions.length) return true;
      return permissions.some(permission => checkPermission(permission));
    },
    [checkPermission, isOwnLLMsRestricted],
  );

  const handleClickAway = useCallback(() => {
    setOpenMenu(false);
  }, []);

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
                data-testid="sidebar-create-button"
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
                  {...getLinkProps(mainDestination, disableCreateButton)}
                  data-testid="sidebar-create-button"
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
                    style={styles.chevronIcon(openMenu)}
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
            {CreateEntityConstants.DropdownItems.map(item => {
              const isDisabled = !getHasPermissionForDropdownItem(item.option);
              const isSelected = currentDropdownItem?.label === item.label;
              return (
                <Box
                  key={item.label}
                  sx={styles.dropdownItem(isSelected, isDisabled)}
                  data-testid={`sidebar-create-option-${item.option}`}
                  {...getLinkProps(getDestination(item.option), isDisabled, handleClickAway)}
                >
                  {item.label}
                  {isSelected && (
                    <CheckIcon
                      fill={theme.palette.icon.secondary}
                      sx={styles.checkIcon}
                    />
                  )}
                </Box>
              );
            })}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
});

CreateEntityButton.displayName = 'CreateEntityButton';

/** @type {MuiSx} */
const createEntityButtonStyles = sideBarCollapsed => ({
  // Legacy SvgIcon wrapper: rotation goes through `style`.
  chevronIcon: isOpen => ({
    transform: isOpen ? 'rotate(180deg)' : 'none',
  }),
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
    background: palette.background.default.secondary,
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    padding: '0.5rem 0',
    minWidth: '11.5rem',
    boxShadow: '0 0.5rem 0.75rem rgba(0, 0, 0, 0.30)',
    marginTop: sideBarCollapsed ? 0 : '0.25rem',
    marginLeft: sideBarCollapsed ? '0.25rem' : 0,
  }),
  dropdownItem:
    (isSelected, isDisabled) =>
    ({ palette, spacing }) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing(1, 2),
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      color: isDisabled ? palette.text.primary : palette.text.secondary,
      fontSize: '0.875rem',
      '&:hover': !isDisabled && {
        backgroundColor: palette.action.hover,
      },
      ...(isSelected &&
        !isDisabled && {
          backgroundColor: palette.components.button.background.drawerMenu.selected,
        }),
    }),
  checkIcon: {
    width: '1rem',
    height: '1rem',
  },
});

export default CreateEntityButton;
