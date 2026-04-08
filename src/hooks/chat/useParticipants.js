import * as React from 'react';

import { useSelector } from 'react-redux';

import { useLoadToolkits } from '@/[fsd]/features/toolkits/lib/hooks';
import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';
import { sortByName } from '@/common/utils';
import useDebounceValue from '@/hooks/useDebounceValue';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { useCanListThisPublicEntity } from '@/hooks/users/usePermissions';

import { useUserList } from '../useUserList';
import { useApplicationParticipants } from './useApplicationParticipants';
import { usePublicApplicationParticipants } from './usePublicApplicationParticipants';

const useParticipants = ({
  sortBy,
  sortOrder,
  pageSize,
  query,
  selectedTagIds,
  types = [],
  projectFilter = 'all', // 'all', 'public', 'teamProject',
  forceSkip = false,
}) => {
  const { id: userId } = useSelector(state => state.user);
  const projectId = useSelectedProjectId();
  const canListPublicAgents = useCanListThisPublicEntity('agents');
  const debouncedQuery = useDebounceValue(query, 200);

  const {
    onLoadMoreUsers,
    data: usersData,
    isUsersError,
    isUsersFetching,
    isUsersLoading,
    usersError,
  } = useUserList({
    sortBy,
    sortOrder,
    query: debouncedQuery,
    pageSize,
    selectedTagIds,
    forceSkip: !types.includes(ChatParticipantType.Users) || forceSkip,
  });
  const { rows: users = [], total: usersTotal = 0 } = usersData || {};

  const loadMoreUsers = React.useCallback(() => {
    if (usersTotal <= users.length) {
      return;
    }
    onLoadMoreUsers();
  }, [usersTotal, users.length, onLoadMoreUsers]);

  const {
    onLoadMoreApplications,
    data: applicationData,
    isApplicationsError,
    isApplicationsFetching,
    isApplicationsLoading,
    applicationsError,
  } = useApplicationParticipants({
    sortBy,
    sortOrder,
    query: debouncedQuery,
    pageSize,
    selectedTagIds,
    agents_type: 'classic',
    forceSkip:
      (types.length && !types.includes(ChatParticipantType.Applications)) ||
      (projectFilter === 'public' && !canListPublicAgents) ||
      forceSkip,
  });
  const { rows: applications = [], total: applicationsTotal = 0 } = applicationData || { rows: [] };

  const loadMoreApplications = React.useCallback(() => {
    if (applicationsTotal <= applications.length) {
      return;
    }
    onLoadMoreApplications();
  }, [applicationsTotal, applications.length, onLoadMoreApplications]);

  const {
    onLoadMorePublicApplications,
    publicApplicationData,
    isPublicApplicationsError,
    isPublicApplicationsFetching,
    isPublicApplicationsLoading,
    publicApplicationsError,
  } = usePublicApplicationParticipants({
    sortBy,
    sortOrder,
    query: debouncedQuery,
    pageSize,
    selectedTagIds,
    agents_type: 'classic',
    forceSkip:
      (types.length && !types.includes(ChatParticipantType.Applications)) ||
      projectFilter === 'teamProject' ||
      canListPublicAgents ||
      forceSkip,
  });
  const { rows: publicApplications = [], total: publicApplicationsTotal = 0 } = publicApplicationData || {
    rows: [],
  };

  const loadMorePublicApplications = React.useCallback(() => {
    if (publicApplicationsTotal <= publicApplications.length) {
      return;
    }
    onLoadMorePublicApplications();
  }, [publicApplicationsTotal, publicApplications.length, onLoadMorePublicApplications]);

  const {
    onLoadMoreApplications: onLoadMorePipelines,
    data: pipelineData,
    isApplicationsError: isPipelinesError,
    isApplicationsFetching: isPipelinesFetching,
    isApplicationsLoading: isPipelinesLoading,
    applicationsError: pipelinesError,
  } = useApplicationParticipants({
    sortBy,
    sortOrder,
    query: debouncedQuery,
    pageSize,
    selectedTagIds,
    agents_type: 'pipeline',
    forceSkip:
      (types.length && !types.includes(ChatParticipantType.Applications)) ||
      (projectFilter === 'public' && !canListPublicAgents) ||
      forceSkip,
  });
  const { rows: pipelines = [], total: pipelinesTotal = 0 } = pipelineData || { rows: [] };

  const loadMorePipelines = React.useCallback(() => {
    if (pipelinesTotal <= pipelines.length) {
      return;
    }
    onLoadMorePipelines();
  }, [pipelinesTotal, pipelines.length, onLoadMorePipelines]);

  const {
    onLoadMorePublicApplications: onLoadMorePublicPipelines,
    publicApplicationData: publicPipelineData,
    isPublicApplicationsError: isPublicPipelinesError,
    isPublicApplicationsFetching: isPublicPipelinesFetching,
    isPublicApplicationsLoading: isPublicPipelinesLoading,
    publicApplicationsError: publicPipelinesError,
  } = usePublicApplicationParticipants({
    sortBy,
    sortOrder,
    query: debouncedQuery,
    pageSize,
    selectedTagIds,
    agents_type: 'pipeline',
    forceSkip:
      (types.length && !types.includes(ChatParticipantType.Applications)) ||
      projectFilter === 'teamProject' ||
      canListPublicAgents ||
      forceSkip,
  });
  const { rows: publicPipelines = [], total: publicPipelinesTotal = 0 } = publicPipelineData || { rows: [] };

  const loadMorePublicPipelines = React.useCallback(() => {
    if (publicPipelinesTotal <= publicPipelines.length) {
      return;
    }
    onLoadMorePublicPipelines();
  }, [publicPipelinesTotal, publicPipelines.length, onLoadMorePublicPipelines]);

  // Toolkits
  const {
    onLoadMoreToolkits,
    data: toolkits,
    isToolkitsError,
    isToolkitsLoading,
    isToolkitsFetching,
    toolkitsError,
    totalCount: totalToolkitsCount,
  } = useLoadToolkits({
    specifiedQuery: debouncedQuery,
    forceSkip: !types.includes(ChatParticipantType.Toolkits),
  });

  const {
    onLoadMoreToolkits: onLoadMorePublicToolkits,
    data: publicToolkits,
    isToolkitsError: isPublicToolkitsError,
    isToolkitsLoading: isPublicToolkitsLoading,
    isToolkitsFetching: isPublicToolkitsFetching,
    toolkitsError: publicToolkitsError,
    totalCount: totalPublicToolkitsCount,
  } = useLoadToolkits({
    specifiedProjectId: PUBLIC_PROJECT_ID,
    forceSkip: projectId == PUBLIC_PROJECT_ID || !types.includes(ChatParticipantType.Toolkits),
  });

  //MCPs
  const {
    onLoadMoreToolkits: onLoadMoreMCPs,
    data: mcps,
    isToolkitsError: isMCPsError,
    isToolkitsLoading: isMCPsLoading,
    isToolkitsFetching: isMCPsFetching,
    toolkitsError: mcpsError,
    totalCount: totalMCPsCount,
  } = useLoadToolkits({
    isMCP: true,
    specifiedQuery: debouncedQuery,
    forceSkip: !types.includes(ChatParticipantType.Toolkits),
  });

  const {
    onLoadMoreToolkits: onLoadMorePublicMCPs,
    data: publicMCPs,
    isToolkitsError: isPublicMCPsError,
    isToolkitsLoading: isPublicMCPsLoading,
    isToolkitsFetching: isPublicMCPsFetching,
    toolkitsError: publicMCPsError,
    totalCount: totalPublicMCPsCount,
  } = useLoadToolkits({
    isMCP: true,
    specifiedProjectId: PUBLIC_PROJECT_ID,
    forceSkip: projectId == PUBLIC_PROJECT_ID || !types.includes(ChatParticipantType.Toolkits),
  });

  const isFetching = React.useMemo(
    () =>
      isApplicationsFetching ||
      isPipelinesFetching ||
      isPublicPipelinesFetching ||
      isPublicApplicationsFetching ||
      isUsersFetching ||
      isToolkitsFetching ||
      isPublicToolkitsFetching ||
      isMCPsFetching ||
      isPublicMCPsFetching,
    [
      isApplicationsFetching,
      isPipelinesFetching,
      isPublicApplicationsFetching,
      isPublicPipelinesFetching,
      isPublicToolkitsFetching,
      isToolkitsFetching,
      isUsersFetching,
      isMCPsFetching,
      isPublicMCPsFetching,
    ],
  );

  const onLoadMore = React.useCallback(() => {
    if (!isFetching) {
      (!types.length || types.includes(ChatParticipantType.Applications)) && loadMoreApplications();
      (!types.length || types.includes(ChatParticipantType.Applications)) && loadMorePublicApplications();
      (!types.length || types.includes(ChatParticipantType.Applications)) && loadMorePipelines();
      (!types.length || types.includes(ChatParticipantType.Applications)) && loadMorePublicPipelines();
      (!types.length || types.includes(ChatParticipantType.Users)) && loadMoreUsers();
      (!types.length || types.includes(ChatParticipantType.Toolkits)) && onLoadMoreToolkits();
      (!types.length || types.includes(ChatParticipantType.Toolkits)) && onLoadMorePublicToolkits();
      (!types.length || types.includes(ChatParticipantType.Toolkits)) && onLoadMoreMCPs();
      (!types.length || types.includes(ChatParticipantType.Toolkits)) && onLoadMorePublicMCPs();
    }
  }, [
    types,
    isFetching,
    loadMoreApplications,
    loadMorePublicApplications,
    loadMoreUsers,
    onLoadMoreToolkits,
    onLoadMorePublicToolkits,
    loadMorePipelines,
    loadMorePublicPipelines,
    onLoadMoreMCPs,
    onLoadMorePublicMCPs,
  ]);

  const realDataList = React.useMemo(() => {
    const applicationList =
      !types.length || types.includes(ChatParticipantType.Applications)
        ? [
            ...applications.map(application => ({
              ...application,
              participantType: ChatParticipantType.Applications,
            })),
            ...publicApplications.map(application => ({
              ...application,
              participantType: ChatParticipantType.Applications,
            })),
          ]
        : [];
    const pipelineList =
      !types.length || types.includes(ChatParticipantType.Applications)
        ? [
            ...pipelines.map(pipeline => ({
              ...pipeline,
              participantType: ChatParticipantType.Applications,
              agent_type: 'pipeline',
            })),
            ...publicPipelines.map(pipeline => ({
              ...pipeline,
              participantType: ChatParticipantType.Applications,
              agent_type: 'pipeline',
            })),
          ]
        : [];
    // const llmModelList = (!types.length || types.includes(ChatParticipantType.Models)) && !selectedTagIds?.length ?
    //   modelList :
    //   [];
    const userList =
      types.includes(ChatParticipantType.Users) && !selectedTagIds?.length
        ? users
            .map(user => ({
              ...user,
              name: user.name || user.email || '',
              participantType: ChatParticipantType.Users,
            }))
            .filter(user => user.id != userId)
        : [];
    const toolkitList =
      !types.length || types.includes(ChatParticipantType.Toolkits)
        ? [
            ...(toolkits?.map(toolkit => ({
              ...toolkit,
              project_id: projectId,
              participantType: ChatParticipantType.Toolkits,
            })) || []),
            ...(publicToolkits?.map(toolkit => ({
              ...toolkit,
              project_id: PUBLIC_PROJECT_ID,
              participantType: ChatParticipantType.Toolkits,
            })) || []),
          ].map(toolkit => ({
            ...toolkit,
            name: toolkit.name || toolkit.toolkit_name || toolkit.type || '',
          }))
        : [];

    // MCPs
    const mcpList =
      !types.length || types.includes(ChatParticipantType.Toolkits)
        ? [
            ...(mcps?.map(mcp => ({
              ...mcp,
              project_id: projectId,
              participantType: ChatParticipantType.Toolkits,
            })) || []),
            ...(publicMCPs?.map(mcp => ({
              ...mcp,
              project_id: PUBLIC_PROJECT_ID,
              participantType: ChatParticipantType.Toolkits,
            })) || []),
          ].map(mcp => ({
            ...mcp,
            name: mcp.name || mcp.toolkit_name || mcp.type || '',
          }))
        : [];

    // const filterLLMModelList = debouncedQuery ? llmModelList.filter(({ name }) => name.toLowerCase().includes(debouncedQuery.toLowerCase())) : llmModelList
    const filterUserList = debouncedQuery
      ? userList.filter(
          ({ name, email }) =>
            name?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            email?.toLowerCase().includes(debouncedQuery.toLowerCase()),
        )
      : userList;
    const filterToolkitList = debouncedQuery
      ? toolkitList.filter(
          ({ name, toolkit_name, type }) =>
            name?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            toolkit_name?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            type?.toLowerCase().includes(debouncedQuery.toLowerCase()),
        )
      : toolkitList;
    const filterMCPList = debouncedQuery
      ? mcpList.filter(
          ({ name, toolkit_name, type }) =>
            name?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            toolkit_name?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            type?.toLowerCase().includes(debouncedQuery.toLowerCase()),
        )
      : mcpList;
    return [
      ...applicationList,
      ...pipelineList,
      ...filterToolkitList,
      ...filterUserList,
      ...filterMCPList,
    ].sort(sortByName);
  }, [
    types,
    applications,
    publicApplications,
    pipelines,
    publicPipelines,
    selectedTagIds?.length,
    users,
    toolkits,
    publicToolkits,
    mcps,
    publicMCPs,
    debouncedQuery,
    userId,
    projectId,
  ]);

  const realDataTotal = React.useMemo(() => {
    const applicationTotal =
      !types.length || types.includes(ChatParticipantType.Applications)
        ? applicationsTotal + publicApplicationsTotal
        : 0;
    const pipelineTotal =
      !types.length || types.includes(ChatParticipantType.Applications)
        ? pipelinesTotal + publicPipelinesTotal
        : 0;
    const userTotal = types.includes(ChatParticipantType.Users) ? usersTotal : 0;
    const toolkitTotal = types.includes(ChatParticipantType.Toolkits)
      ? totalToolkitsCount + totalPublicToolkitsCount
      : 0;
    const mcpTotal = types.includes(ChatParticipantType.Toolkits) ? totalMCPsCount + totalPublicMCPsCount : 0;
    return applicationTotal + userTotal + toolkitTotal + pipelineTotal + mcpTotal;
  }, [
    applicationsTotal,
    pipelinesTotal,
    publicApplicationsTotal,
    publicPipelinesTotal,
    totalMCPsCount,
    totalPublicMCPsCount,
    totalPublicToolkitsCount,
    totalToolkitsCount,
    types,
    usersTotal,
  ]);

  return {
    participants: realDataList,
    total: realDataTotal,
    isFetching,
    isLoading:
      isApplicationsLoading ||
      isPublicApplicationsLoading ||
      isUsersLoading ||
      isToolkitsLoading ||
      isPublicToolkitsLoading ||
      isPipelinesLoading ||
      isPublicPipelinesLoading ||
      isMCPsLoading ||
      isPublicMCPsLoading,
    isError:
      isApplicationsError ||
      isPublicApplicationsError ||
      isUsersError ||
      isToolkitsError ||
      isPublicToolkitsError ||
      isPipelinesError ||
      isPublicPipelinesError ||
      isMCPsError ||
      isPublicMCPsError,
    error:
      applicationsError ||
      publicApplicationsError ||
      usersError ||
      toolkitsError ||
      publicToolkitsError ||
      pipelinesError ||
      publicPipelinesError ||
      mcpsError ||
      publicMCPsError,
    onLoadMore,
  };
};

export default useParticipants;
