import { memo, useCallback, useEffect, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { Typography } from '@mui/material';

import { useLoadToolkits } from '@/[fsd]/features/toolkits/lib/hooks';
import { ContentType } from '@/common/constants';
import { buildErrorMessage, sortByCreatedAt } from '@/common/utils';
import CardList from '@/components/CardList';
import RightInfoPanel from '@/components/RightInfoPanel';
import useCardList from '@/hooks/useCardList';
import usePageQuery from '@/hooks/usePageQuery';
import { useAuthorIdFromUrl } from '@/hooks/useSearchParamValue';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import useViewMode from '@/hooks/useViewMode';
import { getQueryStatuses } from '@/utils/getQueryStatus';

import useAuthorName from '../../hooks/useAuthorName';
import { useLoadApplications } from '../../hooks/useLoadApplications';

const EmptyListPlaceHolder = memo(props => {
  const { query, name } = props;
  const authorName = useAuthorName(name);
  if (!query) {
    return <Typography>{`${authorName} has not created anything yet.`}</Typography>;
  } else {
    return <Typography>Nothing found.</Typography>;
  }
});
EmptyListPlaceHolder.displayName = 'EmptyListPlaceHolder';

const AllStuffList = memo(props => {
  const { rightPanelOffset, sortBy, sortOrder, statuses, displayedTabs } = props;
  const { query, tagList, selectedTagIds } = usePageQuery();
  const viewMode = useViewMode();
  const { renderCard } = useCardList(viewMode);
  const projectId = useSelectedProjectId();
  const authorId = useAuthorIdFromUrl();

  const { name } = useSelector(state => state.trendingAuthor.authorDetails);

  const {
    onLoadMoreApplications,
    data: applicationData,
    isApplicationsError,
    isApplicationsFetching,
    isApplicationsLoading,
    applicationsError,
  } = useLoadApplications(viewMode, sortBy, sortOrder, statuses, !displayedTabs.agents, false, true);
  const { rows: applications, total: applicationsTotal } = useMemo(
    () => applicationData || { rows: [], total: 0 },
    [applicationData],
  );

  const loadMoreApplications = useCallback(() => {
    if (applicationsTotal <= applications.length) {
      return;
    }
    onLoadMoreApplications();
  }, [applicationsTotal, applications.length, onLoadMoreApplications]);

  const {
    onLoadMoreApplications: onLoadMorePipelines,
    data: pipelineData,
    isApplicationsError: isPipelinesError,
    isApplicationsFetching: isPipelinesFetching,
    isApplicationsLoading: isPipelinesLoading,
    applicationsError: pipelinesError,
  } = useLoadApplications(viewMode, sortBy, sortOrder, statuses, !displayedTabs.pipelines, true, false);
  const { rows: pipelines, total: pipelinesTotal } = useMemo(
    () => pipelineData || { rows: [], total: 0 },
    [pipelineData],
  );

  const loadMorePipelines = useCallback(() => {
    if (pipelinesTotal <= pipelines.length) {
      return;
    }
    onLoadMorePipelines();
  }, [pipelinesTotal, pipelines.length, onLoadMorePipelines]);

  const {
    onLoadMoreToolkits,
    data: toolkitsData,
    isToolkitsError,
    isToolkitsFetching,
    isToolkitsLoading,
    toolkitsError,
    totalCount: toolkitsTotal,
  } = useLoadToolkits({
    specifiedProjectId: projectId,
    tags: selectedTagIds,
    query,
    author_id: authorId,
    statuses: getQueryStatuses(statuses),
    forceSkip: !displayedTabs.toolkits,
  });
  const toolkits = useMemo(() => toolkitsData || [], [toolkitsData]);

  const loadMoreToolkits = useCallback(() => {
    if (toolkitsTotal <= toolkits.length) {
      return;
    }
    onLoadMoreToolkits();
  }, [toolkitsTotal, toolkits.length, onLoadMoreToolkits]);

  const {
    onLoadMoreToolkits: onLoadMoreMCPs,
    data: mcpsData,
    isToolkitsError: isMCPsError,
    isToolkitsFetching: isMCPsFetching,
    isToolkitsLoading: isMCPsLoading,
    toolkitsError: mcpsError,
    totalCount: mcpsTotal,
  } = useLoadToolkits({
    specifiedProjectId: projectId,
    tags: selectedTagIds,
    query,
    author_id: authorId,
    statuses: getQueryStatuses(statuses),
    forceSkip: !displayedTabs.MCPs,
    isMCP: true,
  });
  const mcps = useMemo(() => mcpsData || [], [mcpsData]);

  const loadMoreMCPs = useCallback(() => {
    if (mcpsTotal <= mcps.length) {
      return;
    }
    onLoadMoreMCPs();
  }, [mcpsTotal, mcps.length, onLoadMoreMCPs]);

  const isLoading = isApplicationsLoading || isPipelinesLoading || isToolkitsLoading || isMCPsLoading;
  const isLoadingMore = isApplicationsFetching || isPipelinesFetching || isToolkitsFetching || isMCPsFetching;
  const isError = isApplicationsError || isPipelinesError || isToolkitsError || isMCPsError;
  const error = applicationsError || pipelinesError || toolkitsError || mcpsError;
  const total = applicationsTotal + pipelinesTotal + toolkitsTotal + mcpsTotal;

  const onLoadMore = useCallback(() => {
    if (!isLoadingMore) {
      loadMoreApplications();
      loadMorePipelines();
      loadMoreToolkits();
      loadMoreMCPs();
    }
  }, [isLoadingMore, loadMoreApplications, loadMorePipelines, loadMoreToolkits, loadMoreMCPs]);

  const realDataList = useMemo(() => {
    const applicationList = applications.map(application => ({
      ...application,
      cardType: ContentType.UserPublicApplications,
    }));
    const pipelineList = pipelines.map(pipeline => ({
      ...pipeline,
      cardType: ContentType.UserPublicPipelines,
    }));
    const toolkitList = toolkits.map(toolkit => ({
      ...toolkit,
      cardType: ContentType.UserPublicToolkits,
    }));
    const mcpList = mcps.map(mcp => ({
      ...mcp,
      cardType: ContentType.UserPublicMCPs,
    }));
    const finalList = [...applicationList, ...pipelineList, ...toolkitList, ...mcpList]
      .sort(sortByCreatedAt)
      .filter(item => {
        const { tags = [] } = item;
        if (!selectedTagIds.length) return true;

        const selectedTagIdList = selectedTagIds.split(',');
        if (selectedTagIdList.length === 1) return !!tags.find(tag => tag.id == selectedTagIdList[0]);

        return selectedTagIdList.every(id => tags.some(tag => tag.id == id));
      });
    return finalList;
  }, [applications, pipelines, toolkits, mcps, selectedTagIds]);

  const { toastError } = useToast();
  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  return (
    <>
      <CardList
        mixedContent
        key="AllStuffList"
        cardList={realDataList}
        total={total}
        isLoading={isLoading}
        isError={isError}
        rightPanelOffset={rightPanelOffset}
        rightPanelContent={<RightInfoPanel tagList={tagList} />}
        renderCard={renderCard}
        isLoadingMore={isLoadingMore}
        loadMoreFunc={onLoadMore}
        cardType={ContentType.UserPublicAll}
        emptyListPlaceHolder={
          <EmptyListPlaceHolder
            query={query}
            name={name}
          />
        }
      />
    </>
  );
});

AllStuffList.displayName = 'AllStuffList';

export default AllStuffList;
