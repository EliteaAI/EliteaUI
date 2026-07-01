import { useEffect, useMemo } from 'react';

import { useLocation, useParams } from 'react-router-dom';

import { useSelectedProjectName } from '@/hooks/useSelectedProject';

// Custom Hook to Set Title
function useBrowserPageTitle() {
  const location = useLocation();
  const params = useParams();
  const projectName = useSelectedProjectName();
  const name = useMemo(() => {
    const searchParams = new URLSearchParams(location.search || '');
    return searchParams.get('name') || '';
  }, [location.search]);

  const title = useMemo(() => {
    if (location.pathname.startsWith('/chat')) {
      if (params.conversationId) {
        return `Chat: ${name || params.conversationId} - ${projectName}`;
      }
      return `Chat - ${projectName}`;
    } else if (location.pathname.startsWith('/agents-hub')) {
      return `Agent HUB - ${projectName}`;
    } else if (location.pathname.startsWith('/agents')) {
      if (params.agentId) {
        return `Agent: ${name || params.agentId} - ${projectName}`;
      } else if (params.tab) {
        return `Agents: ${params.tab} - ${projectName}`;
      }
      return `Agents - ${projectName}`;
    } else if (location.pathname.startsWith('/pipelines')) {
      if (params.agentId) {
        return `Pipeline: ${name || params.agentId} - ${projectName}`;
      } else if (params.tab) {
        return `Pipelines: ${params.tab} - ${projectName}`;
      }
      return `Pipelines - ${projectName}`;
    } else if (location.pathname.startsWith('/toolkits')) {
      if (params.toolkitId) {
        return `Toolkit: ${name || params.toolkitId} - ${projectName}`;
      } else if (params.tab) {
        return `Toolkits: ${params.tab} - ${projectName}`;
      }
      return `Toolkits - ${projectName}`;
    } else if (location.pathname.startsWith('/mcps')) {
      if (params.mcpId) {
        return `MCP: ${name || params.mcpId} - ${projectName}`;
      } else if (params.tab) {
        return `MCPs: ${params.tab} - ${projectName}`;
      }
      return `MCPs - ${projectName}`;
    } else if (location.pathname.startsWith('/credentials')) {
      if (params.credential_uid) {
        return `Credential: ${name || params.credential_uid} - ${projectName}`;
      } else if (params.tab) {
        return `Credentials: ${params.tab} - ${projectName}`;
      }
      return `Credentials - ${projectName}`;
    } else if (location.pathname.startsWith('/artifacts')) {
      return `Artifacts - ${projectName}`;
    } else if (location.pathname.startsWith('/user-public')) {
      if (params.toolkitId) {
        return `User public toolkit: ${name || params.toolkitId} - ${projectName}`;
      } else if (params.agentId) {
        return `User public agent: ${name || params.agentId} - ${projectName}`;
      } else if (params.tab) {
        return `User public: ${params.tab} - ${projectName}`;
      }
      return `User public - ${projectName}`;
    } else if (location.pathname.startsWith('/settings')) {
      const settingsTab = params.tab || location.pathname.replace(/^\/settings\/?/, '').split('/')[0] || '';
      if (settingsTab === 'personalization') {
        return `Settings: Personalization - ${projectName}`;
      }
      if (settingsTab === 'notifications') {
        return `Settings: Notifications - ${projectName}`;
      }
      if (settingsTab) {
        return `Settings: ${settingsTab} - ${projectName}`;
      }
      return `Settings - ${projectName}`;
    } else if (location.pathname.startsWith('/skills')) {
      if (params.skillId) {
        return `Skill: ${name || params.skillId} - ${projectName}`;
      } else if (params.tab) {
        return `Skills: ${params.tab} - ${projectName}`;
      }
      return `Skills - ${projectName}`;
    } else if (location.pathname.startsWith('/apps')) {
      if (params.appId) {
        return `Application: ${name || params.appId} - ${projectName}`;
      } else if (params.tab) {
        return `Applications: ${params.tab} - ${projectName}`;
      }
      return `Applications - ${projectName}`;
    } else if (location.pathname.startsWith('/help-center')) {
      return `Help Center - ${projectName}`;
    } else {
      return projectName;
    }
  }, [
    location.pathname,
    params.conversationId,
    params.agentId,
    params.tab,
    params.toolkitId,
    params.mcpId,
    params.credential_uid,
    params.skillId,
    params.appId,
    projectName,
    name,
  ]);

  useEffect(() => {
    document.title = title;
  }, [location, params, title]);
}

// Component to Set Title
export function PageTitleSetter() {
  useBrowserPageTitle(); // Custom hook to set title
  return null; // This component doesn't render anything
}
