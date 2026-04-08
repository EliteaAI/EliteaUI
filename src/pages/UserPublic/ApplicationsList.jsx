import { memo, useCallback, useEffect } from 'react';

import { useSelector } from 'react-redux';

import { Typography } from '@mui/material';

import { ContentType } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import CardList from '@/components/CardList';
import RightInfoPanel from '@/components/RightInfoPanel';
import useCardList from '@/hooks/useCardList';
import useToast from '@/hooks/useToast';
import useViewMode from '@/hooks/useViewMode';

import useAuthorName from '../../hooks/useAuthorName';
import { useLoadApplications } from '../../hooks/useLoadApplications';

const EmptyListPlaceHolder = memo(props => {
  const { query, name, forPipeline } = props;
  const authorName = useAuthorName(name);
  if (!query) {
    return (
      <Typography>{`${authorName} has not created ${forPipeline ? 'pipeline' : 'agent'} yet.`}</Typography>
    );
  } else {
    return <Typography>Nothing found.</Typography>;
  }
});
EmptyListPlaceHolder.displayName = 'EmptyListPlaceHolder';

const ApplicationsList = memo(props => {
  const { rightPanelOffset, sortBy, sortOrder, statuses, forPipeline = false } = props;
  const viewMode = useViewMode();
  const { renderCard } = useCardList(viewMode);
  const { name } = useSelector(state => state.trendingAuthor.authorDetails);

  const {
    onLoadMoreApplications,
    data,
    isApplicationsError,
    isMoreApplicationsError,
    isApplicationsFirstFetching,
    isApplicationsFetching,
    isApplicationsLoading,
    applicationsError,
    tagList,
    query,
  } = useLoadApplications(viewMode, sortBy, sortOrder, statuses, false, forPipeline, !forPipeline);

  const { rows: applications = [], total = 1 } = data || {};

  const loadMoreItems = useCallback(() => {
    const existsMore = applications.length < total;
    if (!existsMore || isApplicationsFetching || isApplicationsFirstFetching) return;
    onLoadMoreApplications();
  }, [
    applications.length,
    total,
    isApplicationsFetching,
    isApplicationsFirstFetching,
    onLoadMoreApplications,
  ]);

  const { toastError } = useToast();
  useEffect(() => {
    if (isMoreApplicationsError) {
      toastError(buildErrorMessage(applicationsError));
    }
  }, [applicationsError, isMoreApplicationsError, toastError]);

  return (
    <>
      <CardList
        key={forPipeline ? 'PipelinesList' : 'ApplicationsList'}
        cardList={applications}
        total={total}
        isLoading={isApplicationsLoading || isApplicationsFirstFetching}
        isError={isApplicationsError}
        rightPanelOffset={rightPanelOffset}
        rightPanelContent={<RightInfoPanel tagList={tagList} />}
        renderCard={renderCard}
        isLoadingMore={isApplicationsFetching}
        loadMoreFunc={loadMoreItems}
        cardType={forPipeline ? ContentType.UserPublicPipelines : ContentType.UserPublicApplications}
        emptyListPlaceHolder={
          <EmptyListPlaceHolder
            query={query}
            name={name}
            forPipeline={forPipeline}
          />
        }
      />
    </>
  );
});

ApplicationsList.displayName = 'ApplicationsList';

export default ApplicationsList;
