import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import ReactGA from 'react-ga4';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';

import IndexRoute from '@/[fsd]/app/routes/IndexRoute';
import IntegrationGuard from '@/[fsd]/app/routes/IntegrationGuard';
import ProtectedRoute from '@/[fsd]/app/routes/ProtectedRoute';
import SkillsGuard from '@/[fsd]/app/routes/SkillsGuard';
import { ChunkHelpers } from '@/[fsd]/shared/lib/helpers';
import { useLazyPermissionListQuery, useLazyPublicPermissionListQuery } from '@/api/auth';
import { useLazyAuthorDetailsQuery } from '@/api/social.js';
import {
  ApplicationsTabs,
  CredentialsTabs,
  MISSING_ENVS,
  PERSONAL_SPACE_PERIOD_FOR_NEW_USER,
  SkillsTabs,
  ToolkitsTabs,
} from '@/common/constants';
import RouteChangeResetSearch from '@/components/RouteChangeResetSearch';
import { PageTitleSetter } from '@/hooks/useBrowserPageTitle';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import LoadingPage from '@/pages/LoadingPage';
import Page404 from '@/pages/Page404.jsx';
import RouteDefinitions from '@/routes';
import { actions as chatActions } from '@/slices/chat';

const AnalyticsContainer = ChunkHelpers.lazyWithRetry(
  () => import('@/[fsd]/features/analytics/ui/AnalyticsContainer'),
);
const AppDetail = ChunkHelpers.lazyWithRetry(() => import('@/[fsd]/pages/apps/AppDetail'));
const Apps = ChunkHelpers.lazyWithRetry(() => import('@/[fsd]/pages/apps/Apps'));
const McpAuthPage = ChunkHelpers.lazyWithRetry(() => import('@/[fsd]/pages/mcp/index.jsx'));
const Resources = ChunkHelpers.lazyWithRetry(() => import('@/[fsd]/pages/resources'));
const Settings = ChunkHelpers.lazyWithRetry(() => import('@/[fsd]/pages/settings'));
const AIConfiguration = ChunkHelpers.lazyWithRetry(() => import('@/[fsd]/pages/settings/AIConfiguration'));
const CreatePersonalToken = ChunkHelpers.lazyWithRetry(
  () => import('@/[fsd]/pages/settings/CreatePersonalToken'),
);
const EnvironmentSettings = ChunkHelpers.lazyWithRetry(
  () => import('@/[fsd]/pages/settings/EnvironmentSettings'),
);
const TokensSettings = ChunkHelpers.lazyWithRetry(() => import('@/[fsd]/pages/settings/PersonalTokens'));
const Secrets = ChunkHelpers.lazyWithRetry(() => import('@/[fsd]/pages/settings/Secrets'));
const ProjectContextSettings = ChunkHelpers.lazyWithRetry(
  () => import('@/[fsd]/pages/settings/ProjectContext'),
);
const ServicePromptsPage = ChunkHelpers.lazyWithRetry(
  () => import('@/[fsd]/pages/settings/ServicePromptsPage'),
);
const Users = ChunkHelpers.lazyWithRetry(() => import('@/[fsd]/pages/settings/Users'));
const AgentHub = ChunkHelpers.lazyWithRetry(() => import('@/[fsd]/pages/agent-hub'));
const Applications = ChunkHelpers.lazyWithRetry(() => import('@/pages/Applications/Applications'));
const CreateApplication = ChunkHelpers.lazyWithRetry(() => import('@/pages/Applications/CreateApplication'));
const EditApplication = ChunkHelpers.lazyWithRetry(() => import('@/pages/Applications/EditApplication.jsx'));
const Skills = ChunkHelpers.lazyWithRetry(() => import('@/[fsd]/pages/skills/Skills'));
const CreateSkill = ChunkHelpers.lazyWithRetry(() => import('@/[fsd]/pages/skills/CreateSkill'));
const EditSkill = ChunkHelpers.lazyWithRetry(() => import('@/[fsd]/pages/skills/EditSkill'));
const Artifacts = ChunkHelpers.lazyWithRetry(() => import('@/pages/Artifacts/Artifacts'));
const CreateBucket = ChunkHelpers.lazyWithRetry(() => import('@/pages/Artifacts/CreateBucket'));
const CreateCredentialFromMain = ChunkHelpers.lazyWithRetry(
  () => import('@/pages/Credentials/CreateCredential'),
);
const Credentials = ChunkHelpers.lazyWithRetry(() => import('@/pages/Credentials/Credentials'));
const EditCredentialFromMain = ChunkHelpers.lazyWithRetry(() => import('@/pages/Credentials/EditCredential'));
const ModeSwitch = ChunkHelpers.lazyWithRetry(() => import('@/pages/ModeSwitch'));
const ChatWrapper = ChunkHelpers.lazyWithRetry(() => import('@/pages/NewChat/index'));
const NotificationCenter = ChunkHelpers.lazyWithRetry(
  () => import('@/pages/NotificationCenter/NotificationCenter'),
);
const Onboarding = ChunkHelpers.lazyWithRetry(() => import('@/pages/Onboarding/Onboarding'));
const CreatePipeline = ChunkHelpers.lazyWithRetry(() => import('@/pages/Pipelines/CreatePipeline'));
const EditPipeline = ChunkHelpers.lazyWithRetry(() => import('@/pages/Pipelines/EditPipeline'));
const Pipelines = ChunkHelpers.lazyWithRetry(() => import('@/pages/Pipelines/Pipelines'));
const ProjectSwitcher = ChunkHelpers.lazyWithRetry(() => import('@/pages/ProjectSwitcher.jsx'));
const CreateToolkit = ChunkHelpers.lazyWithRetry(() => import('@/pages/Toolkits/CreateToolkit'));
const EditToolkit = ChunkHelpers.lazyWithRetry(() => import('@/pages/Toolkits/EditToolkit'));
const Toolkits = ChunkHelpers.lazyWithRetry(() => import('@/pages/Toolkits/Toolkits'));
const UserPublic = ChunkHelpers.lazyWithRetry(() => import('@/pages/UserPublic/UserPublic'));
const UserSettings = ChunkHelpers.lazyWithRetry(() => import('@/pages/UserSettings/UserSettings'));

let userInfoTimer = undefined;

const ProtectedRoutes = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  const [getUserDetails] = useLazyAuthorDetailsQuery();
  const projectId = useSelectedProjectId();

  const user = useSelector(state => state.user);

  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [getUserPermissions] = useLazyPermissionListQuery();
  const [getPublicUserPermissions] = useLazyPublicPermissionListQuery();

  useEffect(() => {
    ReactGA.isInitialized &&
      ReactGA.send({ hitType: 'pageview', page: decodeURI(location.pathname) + location.search });

    // eslint-disable-next-line no-console
    console.debug('Google analytics init:', ReactGA.isInitialized);
  }, [location]);

  useEffect(() => {
    if (!MISSING_ENVS.length) {
      if (!user.id) getUserDetails();

      if (currentProjectId !== projectId && projectId) {
        getUserPermissions(projectId);
        setCurrentProjectId(projectId);
      }

      if (!user.publicPermissions || !user.publicPermissions.length) getPublicUserPermissions();
    }
  }, [getPublicUserPermissions, user, getUserDetails, projectId, getUserPermissions, currentProjectId]);

  useEffect(() => {
    getPublicUserPermissions();
    dispatch(chatActions.resetStreamingInfo());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!MISSING_ENVS.length && !user.personal_project_id) getUserDetails();
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
    relativePath => (
      <Navigate
        to={relativePath + location.search}
        state={location.state}
        replace
      />
    ),
    [location.search, location.state],
  );

  const routes = useMemo(
    () => [
      /* onboarding */
      { path: RouteDefinitions.Onboarding, element: <Onboarding /> },
      { path: RouteDefinitions.HelpCenter, element: <Resources /> },
      { path: RouteDefinitions.AgentHub, element: <AgentHub /> },

      /* chat */
      { path: RouteDefinitions.Chat, element: <ChatWrapper /> },
      { path: RouteDefinitions.ChatConversation, element: <ChatWrapper /> },

      /* applications */
      { path: RouteDefinitions.Applications, element: getIndexElement(ApplicationsTabs[0]) },
      { path: RouteDefinitions.CreateApplication, element: <CreateApplication /> },
      { path: RouteDefinitions.ApplicationsWithTab, element: <Applications /> },
      { path: RouteDefinitions.ApplicationsDetail, element: <EditApplication /> },

      /* skills — hidden for public projects */
      { path: RouteDefinitions.Skills, element: <SkillsGuard>{getIndexElement(SkillsTabs[0])}</SkillsGuard> },
      {
        path: RouteDefinitions.CreateSkill,
        element: (
          <SkillsGuard>
            <CreateSkill />
          </SkillsGuard>
        ),
      },
      {
        path: RouteDefinitions.SkillsWithTab,
        element: (
          <SkillsGuard>
            <Skills />
          </SkillsGuard>
        ),
      },
      {
        path: RouteDefinitions.SkillsDetail,
        element: (
          <SkillsGuard>
            <EditSkill />
          </SkillsGuard>
        ),
      },

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
      { path: RouteDefinitions.Apps, element: <Apps /> },
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

      // artifacts
      { path: RouteDefinitions.Artifacts, element: <Artifacts /> },
      { path: RouteDefinitions.CreateBucket, element: <CreateBucket /> },

      // MCP OAuth callback
      { path: RouteDefinitions.McpAuthPage, element: <McpAuthPage /> },
    ],
    [getIndexElement],
  );

  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes>
        <Route
          element={
            <>
              <PageTitleSetter />
              <Outlet />
            </>
          }
        >
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
              {(path.endsWith('/:agentId') || path.endsWith('/:skillId')) && (
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
              path="project-params"
              element={<ProjectContextSettings />}
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
              path="personalization"
              element={<UserSettings />}
            />
            <Route
              path="notifications"
              element={<NotificationCenter />}
            />
            <Route
              path={'create-configuration'}
              element={
                <IntegrationGuard>
                  <CreateCredentialFromMain
                    title="New Configuration"
                    typeSelectorTitle="Select the Configuration Type"
                    showCategory={false}
                    searchPlaceholder="Search configurations"
                    forceShowTitle
                  />
                </IntegrationGuard>
              }
            />
            <Route
              path={'create-configuration/:credentialType'}
              element={
                <IntegrationGuard>
                  <CreateCredentialFromMain
                    title="New Configuration"
                    typeSelectorTitle="Select the Configuration Type"
                    showCategory={false}
                    searchPlaceholder="Search configurations"
                    forceShowTitle
                  />
                </IntegrationGuard>
              }
            />
            <Route
              path={'edit-configuration/:credential_uid'}
              element={
                <EditCredentialFromMain
                  title="Configuration"
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
        </Route>
      </Routes>
    </Suspense>
  );
};

ProtectedRoutes.displayName = 'ProtectedRoutes';

export default ProtectedRoutes;
