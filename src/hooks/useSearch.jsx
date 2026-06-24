import { useCallback, useEffect, useMemo } from 'react';

import { useLazyAutoSuggestQuery } from '@/api/search';
import { useLazyToolkitsListQuery } from '@/api/toolkits';
import { PAGE_SIZE, SortFields, SortOrderOptions } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import useToast from './useToast';

const getErrorMessage = error => {
  return error?.data?.message || error?.data?.error;
};
export default function useSearch() {
  const projectId = useSelectedProjectId();
  const toastProps = useMemo(() => ({ topPosition: '10px' }), []);
  const { toastError } = useToast(toastProps);
  const [getMCPs, { data: mcps = {}, isFetching: isFetchingMCPs, error: mcpError }] =
    useLazyToolkitsListQuery();

  useEffect(() => {
    if (!isFetchingMCPs && mcpError) {
      toastError('Get Auto Suggestion Error: ' + getErrorMessage(mcpError));
    }
  }, [isFetchingMCPs, mcpError, toastError]);

  const [getSuggestions, { data: suggestion = {}, isFetching, error: suggestionError }] =
    useLazyAutoSuggestQuery();
  const {
    tag = {},
    application = {},
    pipeline = {},
    credential = {},
    toolkit = {},
    skill = {},
  } = suggestion || {};

  const { rows: tagResult = [], total: tagTotal } = tag || {};
  const { rows: agentResult = [], total: agentTotal } = application || {};
  const { rows: pipelineResult = [], total: pipelineTotal } = pipeline || {};
  const { rows: toolkitResult = [], total: toolkitTotal } = toolkit || {};
  const { rows: mcpResults = [], total: mcpTotal } = mcps || {};
  const { rows: credentialResult = [], total: credentialTotal } = credential || {};
  const { rows: skillResult = [], total: skillTotal } = skill || {};
  const sortedTags = useMemo(
    () => [...tagResult].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
    [tagResult],
  );
  const sortedAgents = useMemo(
    () => [...agentResult].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
    [agentResult],
  );
  const sortedPipelines = useMemo(
    () => [...pipelineResult].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
    [pipelineResult],
  );
  const sortedToolkits = useMemo(
    () =>
      [...toolkitResult]
        .map(item => ({
          ...item,
          displayName: item.name || 'Toolkit ' + item.id || '',
        }))
        .sort((a, b) => a.displayName?.toLowerCase().localeCompare(b.displayName?.toLowerCase())),
    [toolkitResult],
  );
  const sortedMCPs = useMemo(
    () =>
      [...mcpResults]
        .map(item => ({
          ...item,
          displayName:
            item.name ||
            item.toolkit_name ||
            item.settings?.elitea_title ||
            item.type ||
            'MCP ' + item.id ||
            '',
        }))
        .sort((a, b) => a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase())),
    [mcpResults],
  );
  const sortedCredentials = useMemo(
    () => [...credentialResult].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
    [credentialResult],
  );
  const sortedSkills = useMemo(
    () => [...skillResult].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
    [skillResult],
  );

  useEffect(() => {
    if (isFetching) return;
    if (suggestionError) {
      toastError('Get Auto Suggestion Error: ' + getErrorMessage(suggestionError));
    }
  }, [isFetching, suggestionError, toastError]);

  const getSuggestion = useCallback(
    ({
      projectId: specifiedProjectId = projectId,
      page,
      params: {
        query = '',
        sort = SortFields.Id,
        order = SortOrderOptions.DESC,
        author_id = undefined,
        entities = [],
        statuses = [],
        tags = [],
      } = {},
    }) => {
      if (entities?.includes('mcp')) {
        getMCPs({
          projectId: specifiedProjectId || projectId,
          page: page || 0,
          page_size: PAGE_SIZE,
          params: {
            query,
            sort_by: sort,
            sort_order: order,
            mcp: true,
          },
        });
      }
      getSuggestions({
        projectId: specifiedProjectId || projectId,
        page: page || 0,
        params: {
          query,
          sort,
          order,
          author_id,
          'entities[]': entities,
          'statuses[]': statuses,
          'tags[]': tags?.length ? tags.map(t => t.id) : undefined,
        },
      });
    },
    [getMCPs, getSuggestions, projectId],
  );

  return {
    projectId,
    getSuggestion,
    isFetching,
    tagResult: sortedTags,
    tagTotal,
    agentResult: sortedAgents,
    agentTotal,
    pipelineResult: sortedPipelines,
    pipelineTotal,
    toolkitResult: sortedToolkits,
    toolkitTotal,
    credentialResult: sortedCredentials,
    credentialTotal: credentialTotal || sortedCredentials.length,
    mcpResult: sortedMCPs,
    mcpTotal,
    skillResult: sortedSkills,
    skillTotal,
  };
}
