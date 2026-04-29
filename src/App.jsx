import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ReactGA from 'react-ga4';
import { useDispatch, useSelector } from 'react-redux';
import {
  Navigate,
  Route,
  RouterProvider,
  Routes,
  createBrowserRouter,
  createRoutesFromElements,
  useLocation,
} from 'react-router-dom';

import { Box, useTheme } from '@mui/material';

import { actions as importWizardActions } from '@/[fsd]/entities/import-wizard/model/importWizard.slice';
import { ImportWizardModal } from '@/[fsd]/entities/import-wizard/ui';
import { AnalyticsContainer } from '@/[fsd]/features/analytics/ui';
import { MaintenanceBanner } from '@/[fsd]/features/maintenance/ui';
import { AppDetail, Apps } from '@/[fsd]/pages/apps';
import AuthCallbackPage from '@/[fsd]/pages/auth/index.jsx';
import McpAuthPage from '@/[fsd]/pages/mcp/index.jsx';
import Settings from '@/[fsd]/pages/settings';
import AIConfiguration from '@/[fsd]/pages/settings/AIConfiguration';
import CreatePersonalToken from '@/[fsd]/pages/settings/CreatePersonalToken';
import EnvironmentSettings from '@/[fsd]/pages/settings/EnvironmentSettings';
import TokensSettings from '@/[fsd]/pages/settings/PersonalTokens';
import Secrets from '@/[fsd]/pages/settings/Secrets';
import ServicePromptsPage from '@/[fsd]/pages/settings/ServicePromptsPage';
import Users from '@/[fsd]/pages/settings/Users';
import { useIsOnboarding } from '@/[fsd]/shared/lib/hooks';
import { Sidebar } from '@/[fsd]/widgets/Sidebar/ui';
import { useLazyPermissionListQuery, useLazyPublicPermissionListQuery } from '@/api/auth';
import { useLazyAuthorDetailsQuery } from '@/api/social.js';
import {
  ALLOW_PROJECT_OWN_LLMS,
  ApplicationsTabs,
  COLLAPSED_SIDE_BAR_WIDTH,
  CredentialsTabs,
  ELITEA_ASSISTANT_ENABLED,
  MISSING_ENVS,
  ModerationTabs,
  PERMISSION_GROUPS,
  PERSONAL_SPACE_PERIOD_FOR_NEW_USER,
  PUBLIC_PROJECT_ID,
  SIDE_BAR_WIDTH,
  ToolkitsTabs,
  UserProfileTabs,
} from '@/common/constants';
import RouteChangeResetSearch from '@/components/RouteChangeResetSearch';
import UnsavedDialog from '@/components/UnsavedDialog';
import { PageTitleSetter } from '@/hooks/useBrowserPageTitle';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import AgentsStudio from '@/pages/AgentsStudio/AgentsStudio';
import Applications from '@/pages/Applications/Applications';
import CreateApplication from '@/pages/Applications/CreateApplication';
import EditApplication from '@/pages/Applications/EditApplication.jsx';
import Artifacts from '@/pages/Artifacts/Artifacts';
import CreateBucket from '@/pages/Artifacts/CreateBucket';
import CreateCredentialFromMain from '@/pages/Credentials/CreateCredential';
import { Credentials } from '@/pages/Credentials/Credentials';
import EditCredentialFromMain from '@/pages/Credentials/EditCredential';
import EnvMissingPage from '@/pages/EnvMissingPage';
import LoadingPage from '@/pages/LoadingPage';
import ModeSwitch from '@/pages/ModeSwitch';
import ModerationSpace from '@/pages/ModerationSpace/ModerationSpace';
import ChatWrapper from '@/pages/NewChat/index';
import NotificationCenter from '@/pages/NotificationCenter/NotificationCenter';
import Onboarding from '@/pages/Onboarding/Onboarding';
import Page404 from '@/pages/Page404.jsx';
import CreatePipeline from '@/pages/Pipelines/CreatePipeline';
import EditPipeline from '@/pages/Pipelines/EditPipeline';
import Pipelines from '@/pages/Pipelines/Pipelines';
import ProjectSwitcher from '@/pages/ProjectSwitcher.jsx';
import Tips from '@/pages/Tips/Tips';
import { CreateToolkit } from '@/pages/Toolkits/CreateToolkit';
import { EditToolkit } from '@/pages/Toolkits/EditToolkit';
import { Toolkits } from '@/pages/Toolkits/Toolkits';
import UserPublic from '@/pages/UserPublic/UserPublic';
import UserSettings from '@/pages/UserSettings/UserSettings';
import RouteDefinitions, { getBasename } from '@/routes';
import { actions as chatActions } from '@/slices/chat';
import { actions } from '@/slices/settings';
import { EliteaAssistant } from '@eliteaai/elitea-assistant';

import { gaInit } from './GA';

gaInit();

let userInfoTimer = undefined;

const ProtectedRoute = ({ requiredPermissions, publicPage, children }) => {
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
};

const IntegrationGuard = ({ children }) => {
  const projectId = useSelectedProjectId();
  if (ALLOW_PROJECT_OWN_LLMS === false && projectId != PUBLIC_PROJECT_ID) {
    return (
      <Navigate
        to={RouteDefinitions.SettingsWithTab.replace(':tab', 'model-configuration')}
        replace
      />
    );
  }
  return children;
};

const IndexRoute = () => {
  const user = useSelector(state => state.user);

  // Show loading page while user info is being fetched
  if (!user.id) {
    return <LoadingPage />;
  }

  if (!user.personal_project_id) {
    return (
      <Navigate
        to={RouteDefinitions.Onboarding}
        replace
      />
    );
  }

  return (
    <Navigate
      to={RouteDefinitions.Chat}
      replace
    />
  );
};

const ProtectedRoutes = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  useEffect(() => {
    ReactGA.isInitialized &&
      ReactGA.send({ hitType: 'pageview', page: decodeURI(location.pathname) + location.search });
    // eslint-disable-next-line no-console
    console.debug('Google analytics init:', ReactGA.isInitialized);
  }, [location]);

  const user = useSelector(state => state.user);
  const [getUserDetails] = useLazyAuthorDetailsQuery();
  const projectId = useSelectedProjectId();
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [getUserPermissions] = useLazyPermissionListQuery();
  const [getPublicUserPermissions] = useLazyPublicPermissionListQuery();
  useEffect(() => {
    if (!MISSING_ENVS.length) {
      if (!user.id) {
        getUserDetails();
      }
      if (currentProjectId !== projectId && projectId) {
        getUserPermissions(projectId);
        setCurrentProjectId(projectId);
      }
      if (!user.publicPermissions || !user.publicPermissions.length) {
        getPublicUserPermissions();
      }
    }
  }, [getPublicUserPermissions, user, getUserDetails, projectId, getUserPermissions, currentProjectId]);

  useEffect(() => {
    getPublicUserPermissions();
    dispatch(chatActions.resetStreamingInfo());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!MISSING_ENVS.length && !user.personal_project_id) {
      getUserDetails();
    }
  }, [location, user.personal_project_id, getUserDetails]);

  useEffect(() => {
    if (!MISSING_ENVS.length && !user.personal_project_id && !userInfoTimer) {
      userInfoTimer = setTimeout(() => {
        getUserDetails();
      }, PERSONAL_SPACE_PERIOD_FOR_NEW_USER);
    }
  }, [user.personal_project_id, getUserDetails]);

  useEffect(() => {
    if (user.personal_project_id && userInfoTimer) {
      clearTimeout(userInfoTimer);
      userInfoTimer = undefined;
    }
  }, [user.personal_project_id]);

  const getIndexElement = useCallback(
    relativePath => {
      return (
        <Navigate
          to={relativePath + location.search}
          state={location.state}
          replace
        />
      );
    },
    [location.search, location.state],
  );

  const routes = useMemo(
    () => [
      /* onboarding */
      { path: RouteDefinitions.Onboarding, element: <Onboarding /> },
      { path: RouteDefinitions.Tips, element: <Tips /> },
      { path: RouteDefinitions.AgentStudio, element: <AgentsStudio /> },
      /* chat */
      { path: RouteDefinitions.Chat, element: <ChatWrapper /> },
      { path: RouteDefinitions.ChatConversation, element: <ChatWrapper /> },
      /* applications */
      { path: RouteDefinitions.Applications, element: getIndexElement(ApplicationsTabs[0]) },
      { path: RouteDefinitions.CreateApplication, element: <CreateApplication /> },
      { path: RouteDefinitions.ApplicationsWithTab, element: <Applications /> },
      { path: RouteDefinitions.ApplicationsDetail, element: <EditApplication /> },
      /* pipelines */
      { path: RouteDefinitions.Pipelines, element: getIndexElement(ApplicationsTabs[0]) },
      { path: RouteDefinitions.CreatePipeline, element: <CreatePipeline /> },
      { path: RouteDefinitions.PipelinesWithTab, element: <Pipelines /> },
      { path: RouteDefinitions.PipelineDetail, element: <EditPipeline /> },
      /* credentials */
      { path: RouteDefinitions.Credentials, element: getIndexElement(CredentialsTabs[0]) },
      { path: RouteDefinitions.CredentialsWithTab, element: <Credentials /> },
      { path: RouteDefinitions.CreateCredentialFromMain, element: <CreateCredentialFromMain /> },
      { path: RouteDefinitions.CreateCredentialTypeFromMain, element: <CreateCredentialFromMain /> },
      { path: RouteDefinitions.EditCredentialFromMain, element: <EditCredentialFromMain /> },
      /* tools */
      { path: RouteDefinitions.Toolkits, element: getIndexElement(ToolkitsTabs[0]) },
      { path: RouteDefinitions.CreateToolkit, element: <CreateToolkit /> },
      { path: RouteDefinitions.CreateToolkitType, element: <CreateToolkit /> },
      { path: RouteDefinitions.ToolkitsWithTab, element: <Toolkits /> },
      { path: RouteDefinitions.ToolkitDetail, element: <EditToolkit /> },
      /* mcp */
      { path: RouteDefinitions.MCPs, element: getIndexElement(ToolkitsTabs[0]) },
      { path: RouteDefinitions.CreateMCP, element: <CreateToolkit isMCP={true} /> },
      { path: RouteDefinitions.CreateMCPType, element: <CreateToolkit isMCP={true} /> },
      { path: RouteDefinitions.MCPsWithTab, element: <Toolkits isMCP={true} /> },
      { path: RouteDefinitions.MCPDetail, element: <EditToolkit isMCP={true} /> },
      /* apps */
      { path: RouteDefinitions.Apps, element: getIndexElement(ToolkitsTabs[0]) },
      { path: RouteDefinitions.CreateApp, element: <CreateToolkit isApplication={true} /> },
      { path: RouteDefinitions.CreateAppType, element: <CreateToolkit isApplication={true} /> },
      { path: RouteDefinitions.AppsWithTab, element: <Apps /> },
      { path: RouteDefinitions.AppDetail, element: <AppDetail /> },
      // user public
      { path: RouteDefinitions.UserPublicWithTab, element: <UserPublic /> },
      { path: RouteDefinitions.UserPublicApplicationDetail, element: <EditApplication /> },
      { path: RouteDefinitions.UserPublicPipelineDetail, element: <EditPipeline /> },
      { path: RouteDefinitions.UserPublicToolkitDetail, element: <EditToolkit /> },
      { path: RouteDefinitions.UserPublicMCPDetail, element: <EditToolkit isMCP /> },
      { path: RouteDefinitions.UserPublicAppDetail, element: <AppDetail /> },

      { path: RouteDefinitions.ModeSwitch, element: <ModeSwitch /> },

      { path: RouteDefinitions.UserSettings, element: getIndexElement(UserProfileTabs[0]) },
      { path: RouteDefinitions.UserSettingsWithTab, element: <UserSettings /> },

      // moderation application:
      {
        path: RouteDefinitions.ModerationSpaceApplication,
        element: <EditApplication />,
        publicPage: true,
        requiredPermissions: PERMISSION_GROUPS.moderation,
      },

      {
        path: RouteDefinitions.ModerationSpace,
        element: getIndexElement(ModerationTabs[0]),
        publicPage: true,
        requiredPermissions: PERMISSION_GROUPS.moderation,
      },
      {
        path: RouteDefinitions.ModerationSpaceWithTab,
        element: <ModerationSpace />,
        publicPage: true,
        requiredPermissions: PERMISSION_GROUPS.moderation,
      },

      // notification center
      { path: RouteDefinitions.NotificationCenter, element: <NotificationCenter /> },

      // artifacts
      { path: RouteDefinitions.Artifacts, element: <Artifacts /> },
      { path: RouteDefinitions.CreateBucket, element: <CreateBucket /> },
      // MCP OAuth callback
      { path: RouteDefinitions.McpAuthPage, element: <McpAuthPage /> },
    ],
    [getIndexElement],
  );

  return (
    <>
      <PageTitleSetter />
      <Routes>
        <Route
          index
          element={<IndexRoute />}
        />
        {routes.map(({ path, element, requiredPermissions }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute requiredPermissions={requiredPermissions}>
                <>
                  <RouteChangeResetSearch />
                  {element}
                </>
              </ProtectedRoute>
            }
          >
            {/*{path.endsWith('/:promptId') && <Route path=':version' element={<></>} />}*/}
            {path.endsWith('/:agentId') && (
              <Route
                path=":version"
                element={<></>}
              />
            )}
          </Route>
        ))}
        <Route
          path={RouteDefinitions.Settings}
          element={<Settings />}
        >
          <Route
            index
            element={
              <Navigate
                to="model-configuration"
                replace
              />
            }
          />
          <Route
            path="model-configuration"
            element={<AIConfiguration />}
          />
          <Route
            path="environment"
            element={<EnvironmentSettings />}
          />
          <Route
            path="prompts"
            element={<ServicePromptsPage />}
          />
          <Route
            path="tokens"
            element={<TokensSettings />}
          />
          <Route
            path="secrets"
            element={<Secrets />}
          />
          <Route
            path="users"
            element={<Users />}
          />
          <Route
            path="analytics"
            element={<AnalyticsContainer />}
          />
          <Route
            path={'create-integration'}
            element={
              <IntegrationGuard>
                <CreateCredentialFromMain
                  title="New Integration"
                  typeSelectorTitle="Select the integration Type"
                  showCategory={false}
                  searchPlaceholder="Search integrations"
                  forceShowTitle
                />
              </IntegrationGuard>
            }
          />
          <Route
            path={'create-integration/:credentialType'}
            element={
              <IntegrationGuard>
                <CreateCredentialFromMain
                  title="New Integration"
                  typeSelectorTitle="Select the integration Type"
                  showCategory={false}
                  searchPlaceholder="Search integrations"
                  forceShowTitle
                />
              </IntegrationGuard>
            }
          />
          <Route
            path={'edit-integration/:credential_uid'}
            element={
              <EditCredentialFromMain
                title="Integration"
                forceShowTitle
              />
            }
          />
          <Route
            path={'create-personal-token'}
            element={<CreatePersonalToken />}
          />
        </Route>
        <Route
          path="/:projectId/*"
          element={<ProjectSwitcher />}
        />
        <Route
          path="*"
          element={<Page404 />}
        />
      </Routes>
    </>
  );
};

const LeftSideBar = props => {
  const { onToggleAssistant } = props;
  const dispatch = useDispatch();
  const isOnboardingPage = useIsOnboarding();
  const user = useSelector(state => state.user);

  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);

  const { openWizard, data, isForking } = useSelector(state => state.importWizard);

  const styles = appStyles(sideBarCollapsed);

  const onSideCollapsed = useCallback(
    collapsed => {
      dispatch(actions.setSideBarCollapsed(collapsed));
    },
    [dispatch],
  );

  const onCloseImportWizard = useCallback(
    event => {
      event?.stopPropagation?.();
      dispatch(importWizardActions.closeImportWizard());
    },
    [dispatch],
  );

  if (isOnboardingPage && !user.personal_project_id) {
    return null;
  }

  return (
    <Box
      component="nav"
      sx={styles.leftSideBar}
      aria-label="side-bar"
    >
      <Sidebar
        onCollapsed={onSideCollapsed}
        onToggleAssistant={onToggleAssistant}
      />
      <ImportWizardModal
        open={openWizard}
        onClose={onCloseImportWizard}
        data={data}
        isForking={isForking}
      />
    </Box>
  );
};

// Add comment to test workflow

const MainPanel = () => {
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const isOnboardingPage = useIsOnboarding();

  // Check if on Onboarding page
  const sidebarWidth = isOnboardingPage ? 0 : sideBarCollapsed ? COLLAPSED_SIDE_BAR_WIDTH : SIDE_BAR_WIDTH;
  const styles = appStyles(sideBarCollapsed, sidebarWidth);

  return (
    <Box
      component="main"
      display={'block'}
      flexGrow={1}
      sx={styles.mainPanel}
    >
      <MaintenanceBanner />
      <ProtectedRoutes />
      <UnsavedDialog />
    </Box>
  );
};

const AppLayout = () => {
  const styles = appStyles();
  const theme = useTheme();
  const assistantRef = useRef(null);

  const onToggleAssistant = useCallback(() => {
    assistantRef.current?.toggle();
  }, []);

  const showEliteaAssistant = useMemo(() => {
    if (typeof ELITEA_ASSISTANT_ENABLED === 'string') {
      return (
        ELITEA_ASSISTANT_ENABLED.toLowerCase() === '1' || ELITEA_ASSISTANT_ENABLED.toLowerCase() === 'true'
      );
    }

    return Boolean(ELITEA_ASSISTANT_ENABLED);
  }, []);

  return (
    <Box sx={styles.appContainer}>
      <LeftSideBar onToggleAssistant={showEliteaAssistant ? onToggleAssistant : undefined} />
      <MainPanel />
      {showEliteaAssistant && (
        <EliteaAssistant
          ref={assistantRef}
          apiUrl="https://dev.elitea.ai"
          token="test-token"
          position="bottom-left"
          theme={theme.palette.mode}
        />
      )}
    </Box>
  );
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route
        path={RouteDefinitions.AuthCallbackPage}
        element={<AuthCallbackPage />}
      />
      <Route
        path="/*"
        element={<AppLayout />}
      >
        <Route
          path="*"
          element={<Page404 />}
        />
      </Route>
    </>,
  ),
  { basename: getBasename() },
);

const App = () => {
  return MISSING_ENVS.length > 0 ? <EnvMissingPage /> : <RouterProvider router={router} />;
};

/** @type {MuiSx} */
const appStyles = (sideBarCollapsed, sidebarWidth) => ({
  appContainer: {
    display: 'flex',
  },
  leftSideBar: {
    width: `${(sideBarCollapsed ? COLLAPSED_SIDE_BAR_WIDTH : SIDE_BAR_WIDTH) / 16}rem`,
    flexShrink: 0,
    overflowX: 'hidden',
  },
  mainPanel: {
    width: `calc(100% - ${sidebarWidth / 16}rem)`,
    maxWidth: `calc(100% - ${sidebarWidth / 16}rem)`,
    height: '100vh',
    boxSizing: 'border-box',
    padding: 0,
    position: 'relative',
  },
});

export default App;
