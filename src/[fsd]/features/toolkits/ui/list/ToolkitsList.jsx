import { memo, useCallback, useEffect, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { AuthorInformation } from '@/[fsd]/entities/author/ui';
import { useLoadToolkits } from '@/[fsd]/features/toolkits/lib/hooks';
import { ToolkitTypesPanel, ToolkitsEmptyListPlaceHolder } from '@/[fsd]/features/toolkits/ui/list';
import { ContentType, PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants';
import { buildErrorMessage, uniqueArrayByProp } from '@/common/utils';
import CardList from '@/components/CardList';
import TeamMates from '@/components/TeamMates';
import useMCPListStatusMonitor from '@/hooks/toolkit/useMCPListStatusMonitor';
import useTypes from '@/hooks/toolkit/useTypes';
import useCardList from '@/hooks/useCardList';
import useIsTableView from '@/hooks/useIsTableView';
import useQueryTrendingAuthor from '@/hooks/useQueryTrendingAuthor';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';
import { actions as tagsActions } from '@/slices/tags';
import { rightInfoPanelStyle } from '@/styles/RightInfoPanelStyle';

const ToolkitsList = memo(props => {
  const {
    rightPanelOffset,
    cardContentType = ContentType.ToolkitAll,
    isMCP = false,
    isApplication = false,
  } = props;
  const navigate = useNavigate();
  const styles = getStyles();
  const { selectedTypes } = useTypes();
  const dispatch = useDispatch();
  const { query } = useSelector(state => state.search);
  const selectedProjectId = useSelectedProjectId();

  const { renderCard } = useCardList(
    selectedProjectId != PUBLIC_PROJECT_ID ? ViewMode.Owner : ViewMode.Public,
  );
  const isTableView = useIsTableView();

  const {
    onLoadMoreToolkits,
    data,
    isToolkitsError,
    isMoreToolkitsError,
    isToolkitsFirstFetching,
    isToolkitsFetching,
    toolkitsError,
    tagList,
    page,
    pageSize,
    totalCount,
    setPage,
  } = useLoadToolkits({ isMCP, isApplication, isTableView });

  useMCPListStatusMonitor({ isMCP });

  useEffect(() => {
    dispatch(
      tagsActions.setVisibleTags({
        tags: tagList,
      }),
    );
  }, [dispatch, tagList]);

  const projectId = useSelectedProjectId();
  const { isLoadingAuthor, authorId } = useQueryTrendingAuthor(projectId);
  const { personal_project_id: privateProjectId } = useSelector(state => state.user);

  const rightPanelContent = useMemo(
    () => (
      <div style={rightInfoPanelStyle}>
        <ToolkitTypesPanel
          tagList={tagList}
          title="Types"
          style={styles.rightInfoPanel}
        />
        {selectedProjectId == privateProjectId || authorId ? (
          <AuthorInformation isLoading={isLoadingAuthor} />
        ) : (
          <TeamMates entityType="toolkit" />
        )}
      </div>
    ),
    [tagList, styles.rightInfoPanel, selectedProjectId, privateProjectId, authorId, isLoadingAuthor],
  );

  // Navigate to New Toolkit page for private projects with no toolkits
  useEffect(() => {
    const isPublic = selectedProjectId == PUBLIC_PROJECT_ID;
    const loading = isToolkitsFirstFetching || isToolkitsFetching;
    const hasError = !!isToolkitsError;
    const hasQuery = !!(query && String(query).trim());

    if (!isPublic && !loading && !hasError && !hasQuery && totalCount === 0 && selectedTypes?.length === 0) {
      if (isApplication) {
        navigate(RouteDefinitions.CreateApp, { replace: true });
      } else {
        navigate(!isMCP ? RouteDefinitions.CreateToolkit : RouteDefinitions.CreateMCP, { replace: true });
      }
    }
  }, [
    selectedProjectId,
    isToolkitsFirstFetching,
    isToolkitsFetching,
    isToolkitsError,
    selectedTypes?.length,
    query,
    totalCount,
    navigate,
    isMCP,
    isApplication,
  ]);

  const uniqueDataList = useMemo(() => {
    const getToolkitItemName = item => {
      if (!item.name || item.name.trim() === '') {
        const fallbackName =
          item.toolkit_name ||
          item.settings?.alita_title ||
          item.settings?.configuration_title ||
          item.type.charAt(0).toUpperCase() + item.type.slice(1);
        return fallbackName;
      }
      return item.name;
    };

    const items = uniqueArrayByProp(
      (data || []).map(item => ({
        ...item,
        name: getToolkitItemName(item),
      })),
      'id',
    );

    return items;
  }, [data]);

  const loadMore = useCallback(() => {
    const existsMore = totalCount && uniqueDataList.length < totalCount && (page + 1) * pageSize < totalCount;
    if (!existsMore || isToolkitsFetching || isToolkitsFirstFetching) return;
    onLoadMoreToolkits();
  }, [
    totalCount,
    uniqueDataList.length,
    page,
    pageSize,
    isToolkitsFetching,
    isToolkitsFirstFetching,
    onLoadMoreToolkits,
  ]);

  const { toastError } = useToast();
  useEffect(() => {
    if (isMoreToolkitsError) {
      toastError(buildErrorMessage(toolkitsError));
    }
  }, [toolkitsError, isMoreToolkitsError, toastError]);

  return (
    <CardList
      key={cardContentType}
      cardList={uniqueDataList}
      total={totalCount}
      isLoading={isToolkitsFirstFetching}
      isError={isToolkitsError}
      rightPanelOffset={rightPanelOffset}
      rightPanelContent={rightPanelContent}
      renderCard={renderCard}
      isLoadingMore={isToolkitsFetching}
      loadMoreFunc={loadMore}
      cardType={cardContentType}
      emptyListPlaceHolder={
        <ToolkitsEmptyListPlaceHolder
          query={query}
          isMCP={isMCP}
        />
      }
      setPage={setPage}
      page={page}
      pageSize={pageSize}
    />
  );
});

/** @type {MuiSx} */
const getStyles = () => ({
  rightInfoPanel: { flex: 1 },
});

ToolkitsList.displayName = 'ToolkitsList';

export default ToolkitsList;
