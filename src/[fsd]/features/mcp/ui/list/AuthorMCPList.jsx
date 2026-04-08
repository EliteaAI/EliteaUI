import { memo, useCallback, useEffect, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { useLoadToolkits } from '@/[fsd]/features/toolkits/lib/hooks';
import { AuthorEmptyListPlaceHolder } from '@/[fsd]/features/toolkits/ui/list';
import { ContentType } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import CardList from '@/components/CardList';
import RightInfoPanel from '@/components/RightInfoPanel';
import useCardList from '@/hooks/useCardList';
import { useAuthorIdFromUrl } from '@/hooks/useSearchParamValue';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useTags from '@/hooks/useTags';
import useToast from '@/hooks/useToast';
import useViewMode from '@/hooks/useViewMode';
import { getQueryStatuses } from '@/utils/getQueryStatus';

const AuthorMCPList = memo(props => {
  const { rightPanelOffset, statuses } = props;
  const viewMode = useViewMode();
  const { renderCard } = useCardList(viewMode);
  const { name } = useSelector(state => state.trendingAuthor.authorDetails);
  const { query } = useSelector(state => state.search);
  const projectId = useSelectedProjectId();
  const authorId = useAuthorIdFromUrl();
  const { selectedTagIds } = useTags();
  const { toastError } = useToast();

  const {
    onLoadMoreToolkits,
    data,
    isToolkitsError,
    isMoreToolkitsError,
    isToolkitsFirstFetching,
    isToolkitsFetching,
    isToolkitsLoading,
    toolkitsError,
    tagList,
    totalCount,
  } = useLoadToolkits({
    specifiedProjectId: projectId,
    tags: selectedTagIds,
    query,
    author_id: authorId,
    statuses: getQueryStatuses(statuses),
    forceSkip: !projectId,
    isMCP: true,
  });

  const total = totalCount || 0;

  const cards = useMemo(
    () =>
      (data || []).map(toolkit => ({
        ...toolkit,
        cardType: ContentType.UserPublicMCPs,
      })),
    [data],
  );

  const loadMoreItems = useCallback(() => {
    const existsMore = cards.length < total;
    if (!existsMore || isToolkitsFetching || isToolkitsFirstFetching) return;
    onLoadMoreToolkits();
  }, [cards.length, total, isToolkitsFetching, isToolkitsFirstFetching, onLoadMoreToolkits]);

  useEffect(() => {
    if (isMoreToolkitsError) {
      toastError(buildErrorMessage(toolkitsError));
    }
  }, [toolkitsError, isMoreToolkitsError, toastError]);

  return (
    <>
      <CardList
        key="AuthorMCPList"
        cardList={cards}
        total={total}
        isLoading={isToolkitsLoading || isToolkitsFirstFetching}
        isError={isToolkitsError}
        rightPanelOffset={rightPanelOffset}
        rightPanelContent={<RightInfoPanel tagList={tagList} />}
        renderCard={renderCard}
        isLoadingMore={isToolkitsFetching}
        loadMoreFunc={loadMoreItems}
        emptyListPlaceHolder={
          <AuthorEmptyListPlaceHolder
            query={query}
            name={name}
          />
        }
      />
    </>
  );
});

AuthorMCPList.displayName = 'AuthorMCPList';

export default AuthorMCPList;
