import { useLocation, useMatch, useParams } from 'react-router-dom';

import { DEFAULT_ENTITY_TAB, PROJECT_ID_URL_PREFIX, replacePathParams } from '@/common/utils.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions from '@/routes';

export const usePageDetails = () => {
  const { pathname, search } = useLocation();

  const isApplicationDetailPage = useMatch({ path: RouteDefinitions.ApplicationsDetail });
  const isModerationSpaceApplicationDetailPage = useMatch({
    path: RouteDefinitions.ModerationSpaceApplication,
  });
  const isUserPublicApplicationDetailPage = useMatch({ path: RouteDefinitions.UserPublicApplicationDetail });
  const isApplicationsWithTab = useMatch({ path: RouteDefinitions.ApplicationsWithTab });

  const isApplicationVersionDetailPage = useMatch({
    path: `${RouteDefinitions.ApplicationsDetail}/:versionId`,
  });
  const isModerationSpaceApplicationVersionDetailPage = useMatch({
    path: `${RouteDefinitions.ModerationSpaceApplication}/:versionId`,
  });
  const isUserPublicApplicationVersionDetailPage = useMatch({
    path: `${RouteDefinitions.UserPublicApplicationDetail}/:versionId`,
  });

  const isPipelineDetailPage = useMatch({ path: RouteDefinitions.PipelineDetail });
  const isModerationSpacePipelineDetailPage = useMatch({ path: RouteDefinitions.ModerationSpacePipeline });
  const isUserPublicPipelineDetailPage = useMatch({ path: RouteDefinitions.UserPublicPipelineDetail });
  const isPipelinesWithTab = useMatch({ path: RouteDefinitions.PipelinesWithTab });

  const isPipelineVersionDetailPage = useMatch({ path: `${RouteDefinitions.PipelineDetail}/:versionId` });
  const isModerationSpacePipelineVersionDetailPage = useMatch({
    path: `${RouteDefinitions.ModerationSpacePipeline}/:versionId`,
  });
  const isUserPublicPipelineVersionDetailPage = useMatch({
    path: `${RouteDefinitions.UserPublicPipelineDetail}/:versionId`,
  });

  const isUserPublicToolkitDetailPage = useMatch({ path: RouteDefinitions.UserPublicToolkitDetail });
  const isToolkitDetailPage = useMatch({ path: RouteDefinitions.ToolkitDetail });
  const isToolkitCreatePage = useMatch({ path: RouteDefinitions.CreateToolkit });
  const isToolkitCreateTypePage = useMatch({ path: RouteDefinitions.CreateToolkitType });
  const isToolkitsWithTab = useMatch({ path: RouteDefinitions.ToolkitsWithTab });

  const isUserPublicMCPDetailPage = useMatch({ path: RouteDefinitions.UserPublicMCPDetail });
  const isMCPDetailPage = useMatch({ path: RouteDefinitions.MCPDetail });
  const isMCPCreatePage = useMatch({ path: RouteDefinitions.CreateMCP });
  const isMCPCreateTypePage = useMatch({ path: RouteDefinitions.CreateMCPType });
  const isMCPWithTab = useMatch({ path: RouteDefinitions.MCPsWithTab });

  const isCredentialDetailPage = useMatch({ path: RouteDefinitions.EditCredentialFromMain });
  const isCreateCredentialPage = useMatch({ path: RouteDefinitions.CreateCredentialFromMain });
  const isCreateCredentialTypePage = useMatch({ path: RouteDefinitions.CreateCredentialTypeFromMain });
  const isCredentialsWithTab = useMatch({ path: RouteDefinitions.CredentialsWithTab });

  const isUserPublicAppDetailPage = useMatch({ path: RouteDefinitions.UserPublicAppDetail });
  const isAppDetailPage = useMatch({ path: RouteDefinitions.AppDetail });
  const isCreateAppPage = useMatch({ path: RouteDefinitions.CreateApp });
  const isCreateAppTypePage = useMatch({ path: RouteDefinitions.CreateAppType });
  const isAppsWithTab = useMatch({ path: RouteDefinitions.AppsWithTab });

  const isChatPage = useMatch({ path: RouteDefinitions.Chat });

  const isApplicationPage =
    isApplicationDetailPage ||
    isModerationSpaceApplicationDetailPage ||
    isUserPublicApplicationDetailPage ||
    isApplicationVersionDetailPage ||
    isModerationSpaceApplicationVersionDetailPage ||
    isUserPublicApplicationVersionDetailPage ||
    isApplicationsWithTab;

  const isPipelinePage =
    isPipelineDetailPage ||
    isModerationSpacePipelineDetailPage ||
    isUserPublicPipelineDetailPage ||
    isPipelineVersionDetailPage ||
    isModerationSpacePipelineVersionDetailPage ||
    isUserPublicPipelineVersionDetailPage ||
    isPipelinesWithTab;

  const isToolkitPage =
    isUserPublicToolkitDetailPage ||
    isToolkitDetailPage ||
    isToolkitCreatePage ||
    isToolkitCreateTypePage ||
    isToolkitsWithTab;

  const isAppPage =
    isUserPublicAppDetailPage || isAppDetailPage || isCreateAppPage || isCreateAppTypePage || isAppsWithTab;

  const isMCPPage =
    isUserPublicMCPDetailPage || isMCPDetailPage || isMCPCreatePage || isMCPCreateTypePage || isMCPWithTab;

  const isCredentialPage =
    isCredentialDetailPage || isCreateCredentialPage || isCreateCredentialTypePage || isCredentialsWithTab;

  const projectId = useSelectedProjectId();
  const { agentId, toolkitId, credential_uid, mcpId, appId } = useParams();

  let pageType = null;
  // let details = {projectPath: ''}; //@todo: consider to add this || or add details for toolkits
  let details = null;

  if (isApplicationPage) {
    pageType = 'ApplicationDetails';
    details = {
      projectPath: agentId
        ? replacePathParams(PROJECT_ID_URL_PREFIX + RouteDefinitions.ApplicationsDetail, {
            projectId,
            tab: DEFAULT_ENTITY_TAB,
            agentId,
          })
        : replacePathParams(PROJECT_ID_URL_PREFIX + pathname, {
            projectId,
          }),
      search,
    };
  } else if (isPipelinePage) {
    pageType = 'PipelineDetails';
    details = {
      projectPath: agentId
        ? replacePathParams(PROJECT_ID_URL_PREFIX + RouteDefinitions.PipelineDetail, {
            projectId,
            tab: DEFAULT_ENTITY_TAB,
            agentId,
          })
        : replacePathParams(PROJECT_ID_URL_PREFIX + pathname, {
            projectId,
          }),
      search,
    };
  } else if (isToolkitPage) {
    pageType = 'ToolkitDetails';
    details = {
      projectPath: toolkitId
        ? replacePathParams(PROJECT_ID_URL_PREFIX + RouteDefinitions.ToolkitDetail, {
            projectId,
            tab: DEFAULT_ENTITY_TAB,
            toolkitId,
          })
        : replacePathParams(PROJECT_ID_URL_PREFIX + pathname, {
            projectId,
          }),
      search,
    };
  } else if (isMCPPage) {
    pageType = 'MCPDetails';
    details = {
      projectPath: mcpId
        ? replacePathParams(PROJECT_ID_URL_PREFIX + RouteDefinitions.MCPDetail, {
            projectId,
            tab: DEFAULT_ENTITY_TAB,
            mcpId,
          })
        : replacePathParams(PROJECT_ID_URL_PREFIX + pathname, {
            projectId,
          }),
      search,
    };
  } else if (isCredentialPage) {
    pageType = 'CredentialDetails';
    details = {
      projectPath: credential_uid
        ? replacePathParams(PROJECT_ID_URL_PREFIX + RouteDefinitions.CredentialDetail, {
            projectId,
            tab: DEFAULT_ENTITY_TAB,
            credential_uid,
          })
        : replacePathParams(PROJECT_ID_URL_PREFIX + pathname, {
            projectId,
          }),
      search,
    };
  } else if (isChatPage) {
    pageType = 'Chat';
    details = {
      projectPath: replacePathParams(PROJECT_ID_URL_PREFIX + RouteDefinitions.Chat, {
        projectId,
      }),
      search,
    };
  } else if (isAppPage) {
    pageType = 'AppDetails';
    details = {
      projectPath: replacePathParams(PROJECT_ID_URL_PREFIX + RouteDefinitions.AppDetail, {
        projectId,
        tab: DEFAULT_ENTITY_TAB,
        appId,
      }),
      search,
    };
  }

  return { pageType, details };
};
