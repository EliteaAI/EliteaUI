import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { Box, IconButton, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { CreateEntityConstants } from '@/[fsd]/widgets/Sidebar/lib/constants';
import { useDisablePersonalSpace } from '@/[fsd]/widgets/Sidebar/lib/hooks';
import PlusIcon from '@/assets/plus-icon.svg?react';
import {
  ALLOW_PROJECT_OWN_LLMS,
  PERMISSIONS,
  PUBLIC_PROJECT_ID,
  SearchParams,
  ViewMode,
} from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions from '@/routes';
import { actions as artifactActions } from '@/slices/artifact';

const CreateEntityButton = memo(() => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { checkPermission } = useCheckPermission();
  const isCreatingNewConversation = useSelector(state => state.chat.isCreatingNewConversation);

  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const [selectedOption, setSelectedOption] = useState('Chat');
  const { pathname, state } = useLocation();
  const locationState = useMemo(() => state || { from: [], routeStack: [] }, [state]);
  const styles = createEntityButtonStyles(sideBarCollapsed);
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
      selectedOption === 'Integration' && ALLOW_PROJECT_OWN_LLMS === false && projectId != PUBLIC_PROJECT_ID,
    [selectedOption, projectId],
  );
  const handleCommand = useCallback(() => {
    // Special inline action for creating a Secret from Settings -> Secrets
    switch (selectedOption) {
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
      default: {
        const destUrl = CreateEntityConstants.CommandPathMap[selectedOption];
        const breadCrumb = CreateEntityConstants.BreadCrumbMap[selectedOption];
        let search =
          selectedOption === CreateEntityConstants.OptionsMap.Chat
            ? 'create=1'
            : `${SearchParams.ViewMode}=${ViewMode.Owner}`;

        // Add special parameter for Model creation from Model Configuration Settings
        if (selectedOption === 'Integration') {
          search += '&from=model-configuration';
        }

        if (destUrl !== pathname || selectedOption === CreateEntityConstants.OptionsMap.Chat) {
          let newRouteStack = [...locationState.routeStack];

          //For opening creating page from solo url or from Discover, we treat it as opening it from My Library
          newRouteStack =
            selectedOption === CreateEntityConstants.OptionsMap.Chat
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
  }, [dispatch, selectedOption, pathname, locationState, navigate, shouldReplaceThePage]);
  const handleClick = useCallback(() => {
    handleCommand();
  }, [handleCommand]);

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
  }, [selectedOption, checkPermission]);

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

  const tootip = useMemo(() => {
    if (isCreatingNewConversation) {
      return 'Creating conversation...';
    }
    if (isSettingsUsersPage) {
      return 'Invite users';
    }
    return `Create ${selectedOption || 'entity'}`;
  }, [isCreatingNewConversation, isSettingsUsersPage, selectedOption]);

  return (
    <StyledTooltip
      placement="right"
      title={tootip}
      enterDelay={500}
      enterNextDelay={500}
    >
      <Box
        component="span"
        style={styles.span}
      >
        <IconButton
          disabled={disableCreateButton}
          disableRipple
          sx={styles.button}
          onClick={handleClick}
        >
          <Box sx={styles.iconBox(disableCreateButton)}>
            <PlusIcon />
          </Box>
          {!sideBarCollapsed && (
            <Typography
              sx={styles.typography}
              variant="labelSmall"
            >
              Create
            </Typography>
          )}
        </IconButton>
      </Box>
    </StyledTooltip>
  );
});

CreateEntityButton.displayName = 'CreateEntityButton';

/** @type {MuiSx} */
const createEntityButtonStyles = sideBarCollapsed => ({
  span: {
    width: '100%',
  },
  button: ({ palette }) => ({
    boxSizing: 'border-box',
    display: 'flex',
    width: '100%',
    gap: '0.5rem',
    justifyContent: 'center',
    height: '1.75rem',
    color: palette.split.text.default,
    background: palette.split.default,
    borderRadius: '1.5rem',
    ...(sideBarCollapsed
      ? {
          maxWidth: '1.75rem !important',
          width: '1.75rem !important',
          borderRadius: '50%',
          alignSelf: 'center',
          '& span': {
            width: '0 !important',
          },
        }
      : {}),
    '&:hover': {
      background: palette.split.hover,
    },
    '&:active': {
      color: palette.split.text.pressed,
      backgroundColor: palette.split.pressed,
    },
    '&:disabled': {
      color: palette.split.text.disabled,
      backgroundColor: palette.split.disabled,
    },
  }),
  iconBox:
    disableCreateButton =>
    ({ palette }) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: disableCreateButton ? palette.text.disabled : palette.text.createButton,
    }),
  typography: ({ typography }) => ({
    color: 'inherit',
    fontFamily: typography.fontFamily,
    fontFeatureSettings: typography.fontFeatureSettings,
  }),
});

export default CreateEntityButton;
