import { useCallback, useEffect, useMemo, useState } from 'react';

import { useTheme } from '@mui/material';

import { useToolkitsListQuery } from '@/api/toolkits';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { getToolIconByType } from '@/common/toolkitUtils';
import EntityIcon from '@/components/EntityIcon';
import { DROPDOWN_CONSTANTS } from '@/components/UnifiedDropdown';
import { useApplicationParticipants } from '@/hooks/chat/useApplicationParticipants';
import { usePublicApplicationParticipants } from '@/hooks/chat/usePublicApplicationParticipants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const pageSize = 20;
const emptyTagIds = []; // Stable reference to prevent infinite re-renders

/**
 * Custom hook to provide data for unified dropdowns (agents, pipelines, toolkits)
 */
export const useDropdownData = ({ agentQuery, pipelineQuery, toolkitQuery, mcpQuery }) => {
  const projectId = useSelectedProjectId();
  const theme = useTheme();
  const [isLoadingMoreToolkit, setIsLoadingMoreToolkit] = useState(false);
  const [isLoadingMoreMCP, setIsLoadingMoreMCP] = useState(false);

  // Load agents (applications) with type 'classic'
  const {
    data: agentsData,
    isApplicationsFetching: isAgentsLoading,
    refetchApplications: refetchAgents,
    onLoadMoreApplications: onLoadMoreAgents,
  } = useApplicationParticipants({
    sortBy: 'created_at',
    sortOrder: 'desc',
    query: agentQuery,
    pageSize,
    selectedTagIds: emptyTagIds,
    agents_type: 'classic',
  });

  // Load pipelines (applications) with type 'pipeline'
  const {
    data: pipelinesData,
    isApplicationsFetching: isPipelinesLoading,
    refetchApplications: refetchPipelines,
    onLoadMoreApplications: onLoadMorePipelines,
  } = useApplicationParticipants({
    sortBy: 'created_at',
    sortOrder: 'desc',
    query: pipelineQuery,
    pageSize,
    selectedTagIds: emptyTagIds,
    agents_type: 'pipeline',
  });

  // Load public agents (applications) with type 'classic'
  const {
    publicApplicationData: publicAgentsData,
    isPublicApplicationsFetching: isPublicAgentsLoading,
    refetchPublicApplications: refetchPublicAgents,
    onLoadMorePublicApplications: onLoadMorePublicAgents,
  } = usePublicApplicationParticipants({
    sortBy: 'created_at',
    sortOrder: 'desc',
    query: agentQuery,
    pageSize,
    selectedTagIds: emptyTagIds,
    agents_type: 'classic',
  });

  // Load public pipelines (applications) with type 'pipeline'
  const {
    publicApplicationData: publicPipelinesData,
    isPublicApplicationsFetching: isPublicPipelinesLoading,
    refetchPublicApplications: refetchPublicPipelines,
    onLoadMorePublicApplications: onLoadMorePublicPipelines,
  } = usePublicApplicationParticipants({
    sortBy: 'created_at',
    sortOrder: 'desc',
    query: pipelineQuery,
    pageSize,
    selectedTagIds: emptyTagIds,
    agents_type: 'pipeline',
  });

  // Load toolkits
  const [toolkitPage, setToolkitPage] = useState(0);
  const {
    data: toolkitsData,
    isFetching: isToolkitsLoading,
    isError: isToolkitsError,
    isSuccess: isToolkitsSuccess,
    refetch: refetchToolkits,
  } = useToolkitsListQuery(
    {
      projectId,
      page: toolkitPage,
      page_size: pageSize,
      params: {
        sort_by: 'created_at',
        sort_order: 'desc',
        query: toolkitQuery,
      },
    },
    {
      skip: !projectId,
    },
  );

  const onLoadMoreToolkits = useCallback(() => {
    if (isToolkitsLoading || isLoadingMoreToolkit || toolkitPage * pageSize >= (toolkitsData?.total || 0))
      return;
    setToolkitPage(prev => prev + 1);
    setIsLoadingMoreToolkit(true);
  }, [isToolkitsLoading, isLoadingMoreToolkit, toolkitPage, toolkitsData?.total]);

  useEffect(() => {
    if (isLoadingMoreToolkit && (isToolkitsSuccess || isToolkitsError)) {
      setIsLoadingMoreToolkit(false);
    }
  }, [isToolkitsSuccess, isToolkitsError, isLoadingMoreToolkit]);

  useEffect(() => {
    setToolkitPage(0);
  }, [toolkitQuery]);

  // Load mcps
  const [mcpPage, setMCPPage] = useState(0);
  const {
    data: mcpsData,
    isFetching: isMCPsLoading,
    isError: isMCPsError,
    isSuccess: isMCPsSuccess,
    refetch: refetchMCPs,
  } = useToolkitsListQuery(
    {
      projectId,
      page: mcpPage,
      page_size: pageSize,
      params: {
        sort_by: 'created_at',
        sort_order: 'desc',
        mcp: true,
        query: mcpQuery,
      },
    },
    {
      skip: !projectId,
    },
  );

  // Load public mcps
  const [publicMCPPage, setPublicMCPPage] = useState(0);
  const {
    data: publicMCPsData,
    isFetching: isPublicMCPsLoading,
    isError: isPublicMCPsError,
    isSuccess: isPublicMCPsSuccess,
    refetch: refetchPublicMCPs,
  } = useToolkitsListQuery(
    {
      projectId: PUBLIC_PROJECT_ID,
      page: publicMCPPage,
      page_size: pageSize,
      params: {
        sort_by: 'created_at',
        sort_order: 'desc',
        mcp: true,
        query: mcpQuery,
      },
    },
    {
      skip: !PUBLIC_PROJECT_ID,
    },
  );

  const onLoadMoreMCPs = useCallback(() => {
    if (isMCPsLoading || isLoadingMoreMCP || mcpPage * pageSize >= (mcpsData?.total || 0)) return;
    setMCPPage(prev => prev + 1);
    setIsLoadingMoreMCP(true);
  }, [isMCPsLoading, isLoadingMoreMCP, mcpPage, mcpsData?.total]);

  const onLoadMorePublicMCPs = useCallback(() => {
    if (isPublicMCPsLoading || isLoadingMoreMCP || publicMCPPage * pageSize >= (publicMCPsData?.total || 0))
      return;
    setPublicMCPPage(prev => prev + 1);
    setIsLoadingMoreMCP(true);
  }, [isPublicMCPsLoading, isLoadingMoreMCP, publicMCPPage, publicMCPsData?.total]);

  useEffect(() => {
    if (isLoadingMoreMCP && (isMCPsSuccess || isMCPsError || isPublicMCPsSuccess || isPublicMCPsError)) {
      setIsLoadingMoreMCP(false);
    }
  }, [isMCPsSuccess, isMCPsError, isPublicMCPsSuccess, isPublicMCPsError, isLoadingMoreMCP]);

  useEffect(() => {
    setMCPPage(0);
    setPublicMCPPage(0);
  }, [mcpQuery]);

  // Shared EntityIcon styles for dropdown items
  const entityIconSx = useMemo(
    () => ({
      minWidth: '1.25rem !important',
      width: '1.25rem !important',
      height: '1.25rem !important',
      '& > div': {
        width: '1.25rem',
        height: '1.25rem',
      },
      '& svg': {
        width: DROPDOWN_CONSTANTS.DIMENSIONS.ICON_SVG_SIZE,
        height: DROPDOWN_CONSTANTS.DIMENSIONS.ICON_SVG_SIZE,
        fontSize: DROPDOWN_CONSTANTS.DIMENSIONS.ICON_SVG_SIZE,
      },
    }),
    [],
  );
  const entityImageStyle = useMemo(
    () => ({
      width: '1.25rem',
      height: '1.25rem',
      borderRadius: '50%',
    }),
    [],
  );

  // Transform agents data for dropdown display (combine regular + public)
  const agentMenuItems = useMemo(() => {
    const regularAgents = (agentsData?.rows || []).map(item => ({
      ...item,
      project_id: projectId,
    }));
    const publicAgents = (publicAgentsData?.rows || []).map(item => ({
      ...item,
      project_id: PUBLIC_PROJECT_ID,
    }));
    const allAgents = [...regularAgents, ...publicAgents];

    return allAgents.map(agent => ({
      key: `agent-${agent.project_id}-${agent.id}`,
      label: agent.name,
      description: agent.description,
      data: agent,
      icon: (
        <EntityIcon
          sx={entityIconSx}
          imageStyle={entityImageStyle}
          icon={agent.icon_meta}
          entityType={'application'}
          projectId={agent.project_id}
          editable={false}
          specifiedFontSize={DROPDOWN_CONSTANTS.DIMENSIONS.ICON_SVG_SIZE}
        />
      ),
    }));
  }, [agentsData?.rows, projectId, publicAgentsData?.rows, entityIconSx, entityImageStyle]);

  // Transform pipelines data for dropdown display (combine regular + public)
  const pipelineMenuItems = useMemo(() => {
    const regularPipelines = (pipelinesData?.rows || []).map(item => ({
      ...item,
      project_id: projectId,
    }));
    const publicPipelines = (publicPipelinesData?.rows || []).map(item => ({
      ...item,
      project_id: PUBLIC_PROJECT_ID,
    }));
    const allPipelines = [...regularPipelines, ...publicPipelines];

    return allPipelines.map(pipeline => ({
      key: `pipeline-${pipeline.project_id}-${pipeline.id}`,
      label: pipeline.name,
      description: pipeline.description,
      data: pipeline,
      icon: (
        <EntityIcon
          sx={entityIconSx}
          imageStyle={entityImageStyle}
          icon={pipeline.icon_meta}
          entityType={'pipeline'}
          projectId={pipeline.project_id}
          editable={false}
          specifiedFontSize={DROPDOWN_CONSTANTS.DIMENSIONS.ICON_SVG_SIZE}
        />
      ),
    }));
  }, [pipelinesData?.rows, projectId, publicPipelinesData?.rows, entityIconSx, entityImageStyle]);

  // Transform toolkits data for dropdown display (combine regular + public)
  const toolkitMenuItems = useMemo(() => {
    const regularToolkits = (toolkitsData?.rows || []).map(item => ({
      ...item,
      project_id: projectId,
    }));

    return regularToolkits.map(toolkit => {
      // Get the preferred title following the hierarchy used in ToolkitsList
      const getToolkitTitle = item => {
        return (
          item.settings?.elitea_title ||
          item.settings?.configuration_title ||
          item.name ||
          item.toolkit_name ||
          item.type.charAt(0).toUpperCase() + item.type.slice(1)
        );
      };

      const title = getToolkitTitle(toolkit);

      return {
        key: `toolkit-${toolkit.project_id}-${toolkit.id}`,
        label: `${title} (${toolkit.type})`,
        description: toolkit.description,
        data: toolkit,
        icon: (
          <EntityIcon
            sx={entityIconSx}
            imageStyle={entityImageStyle}
            icon={{ component: getToolIconByType(toolkit.type, theme) }}
            editable={false}
            specifiedFontSize={DROPDOWN_CONSTANTS.DIMENSIONS.ICON_SVG_SIZE}
          />
        ),
      };
    });
  }, [toolkitsData?.rows, projectId, theme, entityIconSx, entityImageStyle]);

  // Transform MCPs data for dropdown display (combine regular + public)
  const mcpMenuItems = useMemo(() => {
    const regularMCPs = (mcpsData?.rows || []).map(item => ({
      ...item,
      project_id: projectId,
    }));
    const publicMCPs = (publicMCPsData?.rows || []).map(item => ({
      ...item,
      project_id: PUBLIC_PROJECT_ID,
    }));
    const allMCPs = [...regularMCPs, ...publicMCPs];

    return allMCPs.map(mcp => {
      // Get the preferred title following the hierarchy used in MCPsList
      const getMCPTitle = item => {
        return (
          item.settings?.elitea_title ||
          item.settings?.configuration_title ||
          item.name ||
          item.toolkit_name ||
          item.type.charAt(0).toUpperCase() + item.type.slice(1)
        );
      };

      const title = getMCPTitle(mcp);

      return {
        key: `mcp-${mcp.project_id}-${mcp.id}`,
        label: `${title} (${mcp.type})`,
        description: mcp.description,
        data: mcp,
        icon: (
          <EntityIcon
            sx={entityIconSx}
            imageStyle={entityImageStyle}
            icon={{ component: getToolIconByType(mcp.type, theme, { isMCP: true }) }}
            editable={false}
            specifiedFontSize={DROPDOWN_CONSTANTS.DIMENSIONS.ICON_SVG_SIZE}
          />
        ),
      };
    });
  }, [mcpsData?.rows, publicMCPsData?.rows, projectId, theme, entityIconSx, entityImageStyle]);

  // Refresh callback functions - wrapped in useCallback with query state guards
  const refreshAgents = useCallback(async () => {
    // Refresh both regular and public agents
    const promises = [];
    if (projectId && refetchAgents && agentsData !== undefined) {
      promises.push(refetchAgents());
    }
    if (refetchPublicAgents && publicAgentsData !== undefined) {
      promises.push(refetchPublicAgents());
    }
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }, [projectId, refetchAgents, agentsData, refetchPublicAgents, publicAgentsData]);

  const refreshPipelines = useCallback(async () => {
    // Refresh both regular and public pipelines
    const promises = [];
    if (projectId && refetchPipelines && pipelinesData !== undefined) {
      promises.push(refetchPipelines());
    }
    if (refetchPublicPipelines && publicPipelinesData !== undefined) {
      promises.push(refetchPublicPipelines());
    }
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }, [projectId, refetchPipelines, pipelinesData, refetchPublicPipelines, publicPipelinesData]);

  const refreshToolkits = useCallback(async () => {
    // Refresh regular toolkits
    const promises = [];
    if (projectId && refetchToolkits && toolkitsData !== undefined) {
      promises.push(refetchToolkits());
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }, [projectId, refetchToolkits, toolkitsData]);

  const refreshMCPs = useCallback(async () => {
    // Refresh both regular and public MCPs
    const promises = [];
    if (projectId && refetchMCPs && mcpsData !== undefined) {
      promises.push(refetchMCPs());
    }
    if (refetchPublicMCPs && publicMCPsData !== undefined) {
      promises.push(refetchPublicMCPs());
    }
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }, [projectId, refetchMCPs, mcpsData, refetchPublicMCPs, publicMCPsData]);

  // Refresh all data sources - also wrapped in useCallback with proper guards
  const refreshAll = useCallback(async () => {
    if (projectId) {
      const refreshPromises = [];

      // Only include refetch calls for queries that have been executed
      if (refetchAgents && agentsData !== undefined) {
        refreshPromises.push(refetchAgents());
      }
      if (refetchPublicAgents && publicAgentsData !== undefined) {
        refreshPromises.push(refetchPublicAgents());
      }
      if (refetchPipelines && pipelinesData !== undefined) {
        refreshPromises.push(refetchPipelines());
      }
      if (refetchPublicPipelines && publicPipelinesData !== undefined) {
        refreshPromises.push(refetchPublicPipelines());
      }
      if (refetchToolkits && toolkitsData !== undefined) {
        refreshPromises.push(refetchToolkits());
      }
      if (refetchMCPs && mcpsData !== undefined) {
        refreshPromises.push(refetchMCPs());
      }
      if (refetchPublicMCPs && publicMCPsData !== undefined) {
        refreshPromises.push(refetchPublicMCPs());
      }

      // Only execute if we have at least one query to refresh
      if (refreshPromises.length > 0) {
        await Promise.all(refreshPromises);
      }
    }
  }, [
    projectId,
    refetchAgents,
    agentsData,
    refetchPublicAgents,
    publicAgentsData,
    refetchPipelines,
    pipelinesData,
    refetchPublicPipelines,
    publicPipelinesData,
    refetchToolkits,
    toolkitsData,
    refetchMCPs,
    mcpsData,
    refetchPublicMCPs,
    publicMCPsData,
  ]);

  // Combined load more functions
  const handleLoadMoreAgents = useCallback(() => {
    onLoadMoreAgents();
    onLoadMorePublicAgents();
  }, [onLoadMoreAgents, onLoadMorePublicAgents]);

  const handleLoadMorePipelines = useCallback(() => {
    onLoadMorePipelines();
    onLoadMorePublicPipelines();
  }, [onLoadMorePipelines, onLoadMorePublicPipelines]);

  const handleLoadMoreToolkits = useCallback(() => {
    onLoadMoreToolkits();
  }, [onLoadMoreToolkits]);

  const handleLoadMoreMCPs = useCallback(() => {
    onLoadMoreMCPs();
    onLoadMorePublicMCPs();
  }, [onLoadMoreMCPs, onLoadMorePublicMCPs]);

  return {
    // Agents (combined regular + public)
    agentMenuItems,
    isAgentsLoading: isAgentsLoading || isPublicAgentsLoading,

    // Pipelines (combined regular + public)
    pipelineMenuItems,
    isPipelinesLoading: isPipelinesLoading || isPublicPipelinesLoading,

    // Toolkits (combined regular)
    toolkitMenuItems,
    isToolkitsLoading: isToolkitsLoading || isLoadingMoreToolkit,

    // MCPs (combined regular + public)
    mcpMenuItems,
    isMCPsLoading: isMCPsLoading || isPublicMCPsLoading || isLoadingMoreMCP,

    // Refresh callbacks
    refreshAgents,
    refreshPipelines,
    refreshToolkits,
    refreshMCPs,
    refreshAll,

    onLoadMoreAgents: handleLoadMoreAgents,
    onLoadMorePipelines: handleLoadMorePipelines,
    onLoadMoreToolkits: handleLoadMoreToolkits,
    onLoadMoreMCPs: handleLoadMoreMCPs,

    // General
    projectId,
  };
};
