import { useCallback, useEffect, useMemo, useState } from 'react';

import { useTheme } from '@mui/material';

import { CredentialNameHelpers } from '@/[fsd]/features/credentials/lib/helpers';
import { McpAuthConstants } from '@/[fsd]/features/mcp/lib/constants';
import { McpConstants } from '@/[fsd]/features/toolkits/lib/constants';
import { McpToolkitHelpers, ToolkitsHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { useListToolkitTypesQuery, useToolkitsListQuery } from '@/api/toolkits.js';
import useTypes from '@/hooks/toolkit/useTypes';
import usePageQuery from '@/hooks/usePageQuery';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useSortQueryParamsFromUrl from '@/hooks/useSortQueryParamsFromUrl';

import { useGetCurrentToolkitSchemas } from './useGetCurrentToolkitSchemas.hooks';

export const useLoadToolkits = ({
  isMCP,
  isApplication,
  specifiedProjectId,
  specifiedQuery,
  search_artifact,
  forceSkip,
  toolkit_type,
  isTableView,
  author_id,
  statuses,
  tags,
} = {}) => {
  const selectedProjectId = useSelectedProjectId();
  const projectId = useMemo(
    () => specifiedProjectId || selectedProjectId,
    [selectedProjectId, specifiedProjectId],
  );
  const { selectedTypes: selectedTypeNames } = useTypes({ isMCP });
  const [selectedTypes, setSelectedTypes] = useState([]);
  const { toolkitSchemas } = useGetCurrentToolkitSchemas();

  const { data: toolkitTypesData } = useListToolkitTypesQuery(
    { projectId, params: { mcp: isMCP || undefined, application: isApplication || undefined } },
    { skip: !projectId || forceSkip },
  );
  const mcpGroupByType = useMemo(() => {
    const prefix = McpAuthConstants.MCP_PREBUILD_PREFIX;
    const map = {};
    Object.entries(toolkitSchemas || {}).forEach(([key, schema]) => {
      const group = schema?.metadata?.group;
      if (!group || !key.toLowerCase().startsWith(prefix)) return;
      const normalized = prefix + key.slice(prefix.length).toLowerCase().replace(/ /g, '_');
      map[key] = group;
      map[normalized] = group;
    });
    return map;
  }, [toolkitSchemas]);

  const { mcpTypesByGroup, nonMcpTypes } = useMemo(() => {
    const byGroup = {};
    const nonMcp = [];
    (toolkitTypesData?.rows || []).forEach(type => {
      const schema = toolkitSchemas?.[type];
      const isMcpType =
        type === 'mcp' || type.startsWith(McpAuthConstants.MCP_PREBUILD_PREFIX) || schema?.type === 'mcp';
      if (isMcpType) {
        const group = mcpGroupByType[type] || McpConstants.MCP_OTHER_GROUP;
        (byGroup[group] ||= []).push(type);
      } else {
        nonMcp.push(type);
      }
    });
    return { mcpTypesByGroup: byGroup, nonMcpTypes: nonMcp };
  }, [toolkitTypesData?.rows, toolkitSchemas, mcpGroupByType]);

  const typeNameToTypes = useMemo(() => {
    const map = {};
    nonMcpTypes.forEach(type => {
      const label =
        toolkitSchemas?.[type]?.metadata?.label || CredentialNameHelpers.extraCredentialName(type);
      map[label] = [type];
    });
    Object.entries(mcpTypesByGroup).forEach(([group, types]) => {
      map[group] = types;
    });
    return map;
  }, [nonMcpTypes, mcpTypesByGroup, toolkitSchemas]);

  useEffect(() => {
    if (!isMCP) {
      setSelectedTypes(selectedTypeNames.flatMap(name => typeNameToTypes[name] || []));
    } else {
      let selectedMcpTypes = [];
      if (selectedTypeNames.includes(McpConstants.McpCategory.Local)) {
        selectedMcpTypes = [...(toolkitTypesData?.rows || []).filter(type => type !== 'mcp')];
      }
      if (selectedTypeNames.includes(McpConstants.McpCategory.Remote)) {
        selectedMcpTypes = [...selectedMcpTypes, 'mcp'];
      }
      setSelectedTypes(selectedMcpTypes);
    }
  }, [isMCP, selectedTypeNames, typeNameToTypes, toolkitTypesData?.rows]);

  const {
    onLoadMoreToolkits: onLoadMoreCardViewToolkits,
    data: cardViewData,
    isToolkitsError: isCardViewToolkitsError,
    isToolkitsFetching: isCardViewToolkitsFetching,
    isToolkitsLoading: isCardViewToolkitsLoading,
    isMoreToolkitsError: isMoreCardViewToolkitsError,
    isToolkitsFirstFetching: isCardViewToolkitsFirstFetching,
    toolkitsError: cardViewToolkitsError,
    totalCount: cardViewTotalCount,
    indexesTotal: cardViewIndexesTotal,
    page: cardViewPage,
    pageSize: cardViewPageSize,
    setPage: setCardViewPage,
    query: cardViewQuery,
    refetchToolkits: refetchCardViewToolkits,
    tagList: cardViewTagList,
  } = useLoadToolkitData({
    isMCP,
    isApplication,
    specifiedProjectId,
    specifiedQuery,
    forceSkip: forceSkip || isTableView,
    selectedTypes,
    toolkit_type,
    search_artifact,
    isTableView,
    author_id,
    statuses,
    tags,
  });

  const projectWideTagList = useMemo(() => {
    const nonMcpTags = nonMcpTypes
      .map(type => {
        const label =
          toolkitSchemas?.[type]?.metadata?.label || CredentialNameHelpers.extraCredentialName(type);
        return { name: label, data: { type } };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const mcpGroupTags = McpToolkitHelpers.orderMcpToolkitGroups(Object.keys(mcpTypesByGroup)).map(group => ({
      name: group,
      data: { group, types: mcpTypesByGroup[group] },
    }));

    return [...nonMcpTags, ...mcpGroupTags].map((tag, index) => ({ id: index + 1, ...tag }));
  }, [nonMcpTypes, mcpTypesByGroup, toolkitSchemas]);

  const {
    onLoadMoreToolkits: onLoadMoreTableViewToolkits,
    data: tableViewData,
    isToolkitsError: isTableViewToolkitsError,
    isToolkitsFetching: isTableViewToolkitsFetching,
    isToolkitsLoading: isTableViewToolkitsLoading,
    isMoreToolkitsError: isMoreTableViewToolkitsError,
    isToolkitsFirstFetching: isTableViewToolkitsFirstFetching,
    toolkitsError: tableViewToolkitsError,
    totalCount: tableViewTotalCount,
    indexesTotal: tableViewIndexesTotal,
    page: tableViewPage,
    pageSize: tableViewPageSize,
    setPage: setTableViewPage,
    query: tableViewQuery,
    refetchToolkits: refetchTableViewToolkits,
    tagList: tableViewTagList,
  } = useLoadToolkitData({
    isMCP,
    isApplication,
    specifiedProjectId,
    specifiedQuery,
    forceSkip: forceSkip || !isTableView,
    selectedTypes,
    toolkit_type,
    isTableView,
    author_id,
    statuses,
    tags,
  });

  const tagList = useMemo(() => {
    if (author_id) {
      return isTableView ? tableViewTagList : cardViewTagList;
    }
    return !isMCP
      ? projectWideTagList
      : [
          {
            id: 1,
            name: McpConstants.McpCategory.Local,
            data: { type: 'local' },
          },
          {
            id: 2,
            name: McpConstants.McpCategory.Remote,
            data: { type: 'mcp' },
          },
        ];
  }, [author_id, isMCP, projectWideTagList, isTableView, tableViewTagList, cardViewTagList]);

  return {
    tagList,
    onLoadMoreToolkits: isTableView ? onLoadMoreTableViewToolkits : onLoadMoreCardViewToolkits,
    data: isTableView ? tableViewData : cardViewData,
    isToolkitsError: isTableView ? isTableViewToolkitsError : isCardViewToolkitsError,
    isToolkitsFetching: isTableView ? isTableViewToolkitsFetching : isCardViewToolkitsFetching,
    isToolkitsLoading: isTableView ? isTableViewToolkitsLoading : isCardViewToolkitsLoading,
    isMoreToolkitsError: isTableView ? isMoreTableViewToolkitsError : isMoreCardViewToolkitsError,
    isToolkitsFirstFetching: isTableView ? isTableViewToolkitsFirstFetching : isCardViewToolkitsFirstFetching,
    toolkitsError: isTableView ? tableViewToolkitsError : cardViewToolkitsError,
    totalCount: isTableView ? tableViewTotalCount : cardViewTotalCount,
    indexesTotal: isTableView ? tableViewIndexesTotal : cardViewIndexesTotal,
    page: isTableView ? tableViewPage : cardViewPage,
    pageSize: isTableView ? tableViewPageSize : cardViewPageSize,
    setPage: isTableView ? setTableViewPage : setCardViewPage,
    query: isTableView ? tableViewQuery : cardViewQuery,
    refetchToolkits: isTableView ? refetchTableViewToolkits : refetchCardViewToolkits,
  };
};

const useLoadToolkitData = ({
  isMCP,
  isApplication,
  specifiedProjectId,
  specifiedQuery,
  forceSkip,
  selectedTypes,
  toolkit_type,
  search_artifact,
  isTableView,
  author_id,
  statuses,
  tags,
} = {}) => {
  const { sort_by, sort_order } = useSortQueryParamsFromUrl({
    defaultSortOrder: 'desc',
    defaultSortBy: 'created_at',
  });
  const params = useMemo(
    () => ({
      specifiedQuery, // Add search query parameter
      sort_by,
      sort_order,
      mcp: isMCP ? true : undefined, // Only add mcp param if isMCP is true
      application: isApplication ? true : undefined, // Only add application param if isApplication is true
      toolkit_type: toolkit_type || selectedTypes || undefined, // Filter by toolkit type if provided
      search_artifact,
      author_id,
      statuses,
      tags,
    }),
    [
      specifiedQuery,
      sort_by,
      sort_order,
      isMCP,
      isApplication,
      toolkit_type,
      selectedTypes,
      search_artifact,
      author_id,
      statuses,
      tags,
    ],
  );
  const { query, page, pageSize, setPage, projectId, extraParams } = usePageQuery(specifiedProjectId, params);

  useEffect(() => {
    setPage(0);
  }, [isTableView, setPage]);

  const theme = useTheme();
  const { toolkitSchemas } = useGetCurrentToolkitSchemas();

  const {
    data: toolkitData,
    error: toolkitError,
    isError: isToolkitError,
    isLoading: isToolkitLoading,
    isFetching: isToolkitFetching,
    refetch: refetchToolkitsData,
  } = useToolkitsListQuery(
    {
      projectId,
      page,
      page_size: pageSize,
      isTableView,
      params: {
        query: extraParams.specifiedQuery || query, // Add search query parameter
        sort_by: extraParams.sort_by,
        sort_order: extraParams.sort_order,
        mcp: extraParams.mcp, // Only add mcp param if isMCP is true
        application: extraParams.application, // Only add application param if isApplication is true
        toolkit_type: extraParams.toolkit_type, // Filter by toolkit type if provided
        author_id: extraParams.author_id,
        statuses: extraParams.statuses,
        tags: extraParams.tags,
        search_artifact: extraParams.search_artifact,
      },
    },
    {
      skip: !projectId || forceSkip,
    },
  );

  const tagList = useMemo(() => {
    const allTags = (toolkitData?.rows || []).flatMap(toolkit => toolkit.tags || []);
    const uniqueTags = [];
    const seenIds = new Set();
    for (const tag of allTags) {
      if (tag && tag.id && !seenIds.has(tag.id)) {
        seenIds.add(tag.id);
        uniqueTags.push(tag);
      }
    }
    return uniqueTags.sort((a, b) => a.name.localeCompare(b.name));
  }, [toolkitData?.rows]);

  // Note: We don't populate Redux store with toolkit types as they are handled separately
  // This prevents toolkit types from interfering with the global tag system used by other menus

  const data = useMemo(() => {
    const enhancedToolkits = ToolkitsHelpers.enhanceToolkitData(
      toolkitData?.rows,
      toolkitSchemas,
      theme,
      isMCP,
    );

    // No local filtering here - filtering is handled in ToolkitsList based on selected types and names
    return enhancedToolkits;
  }, [toolkitData?.rows, toolkitSchemas, theme, isMCP]);

  const totalCount = useMemo(() => {
    return toolkitData?.total || 0;
  }, [toolkitData]);

  const indexesTotal = useMemo(() => toolkitData?.indexes_total ?? null, [toolkitData]);

  const onLoadMoreToolkits = useCallback(() => {
    if (!isToolkitFetching && (page + 1) * pageSize < totalCount) {
      setPage(page + 1);
    }
  }, [isToolkitFetching, page, pageSize, totalCount, setPage]);

  const refetchToolkits = useCallback(() => {
    setPage(0);
    refetchToolkitsData();
  }, [setPage, refetchToolkitsData]);

  return {
    onLoadMoreToolkits,
    data,
    isToolkitsError: isToolkitError,
    isToolkitsFetching: !!page && isToolkitFetching,
    isToolkitsLoading: isToolkitLoading,
    isMoreToolkitsError: !!page && isToolkitError,
    isToolkitsFirstFetching: !page && isToolkitFetching,
    toolkitsError: toolkitError,
    totalCount,
    indexesTotal,
    page,
    pageSize,
    setPage,
    query,
    refetchToolkits,
    tagList,
  };
};
