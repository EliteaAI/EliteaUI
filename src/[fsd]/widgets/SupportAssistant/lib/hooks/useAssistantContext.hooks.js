import { useMemo } from 'react';

import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { usePageDetails } from '@/hooks/usePageDetails';
import { useSelectedProjectId, useSelectedProjectName } from '@/hooks/useSelectedProject';

import {
  buildApplicationContext,
  buildSimpleEntityContext,
  cleanMeta,
  filterDefined,
  getBrowserInfo,
} from '../helpers';

export const useAssistantContext = () => {
  const { pageType, matchParams } = usePageDetails();
  const projectId = useSelectedProjectId();
  const projectName = useSelectedProjectName();
  const { pathname, search } = useLocation();

  const currentApplication = useSelector(state => state.applications?.currentApplication);
  const currentChatModel = useSelector(state => state.chat?.currentChatModel);

  return useMemo(() => {
    const baseContext = filterDefined({
      project_id: projectId,
      project_name: projectName,
      current_page: pathname,
      meta: cleanMeta({ browser: getBrowserInfo() }),
    });

    switch (pageType) {
      case 'ApplicationDetails':
        return buildApplicationContext(baseContext, currentApplication, matchParams, 'agent');
      case 'PipelineDetails':
        return buildApplicationContext(baseContext, currentApplication, matchParams, 'pipeline');
      case 'ToolkitDetails':
        return buildSimpleEntityContext(baseContext, matchParams, 'toolkit', 'toolkitId');
      case 'MCPDetails':
        return buildSimpleEntityContext(baseContext, matchParams, 'mcp', 'mcpId');
      case 'AppDetails':
        return buildSimpleEntityContext(baseContext, matchParams, 'app', 'appId');
      case 'CredentialDetails': {
        const { credential_uid, tab } = matchParams;
        if (!credential_uid) return baseContext;

        return filterDefined({
          ...baseContext,
          current_entity_type: 'credential',
          meta: cleanMeta({
            credential_uid: parseInt(credential_uid, 10),
            tab,
            browser: getBrowserInfo(),
          }),
        });
      }
      case 'Chat': {
        const { conversationId } = matchParams;
        const searchParams = new URLSearchParams(search);
        const conversationName = searchParams.get('name');

        return filterDefined({
          ...baseContext,
          current_entity_type: 'conversation',
          current_entity_id: conversationId ? parseInt(conversationId, 10) : undefined,
          current_entity_name: conversationName,
          selected_model: currentChatModel?.name,
          selected_provider: currentChatModel?.integration_name || currentChatModel?.provider || 'openai',
          meta: cleanMeta({ browser: getBrowserInfo() }),
        });
      }
      default:
        return baseContext;
    }
  }, [
    projectId,
    projectName,
    pathname,
    pageType,
    matchParams,
    currentApplication,
    search,
    currentChatModel?.name,
    currentChatModel?.integration_name,
    currentChatModel?.provider,
  ]);
};
