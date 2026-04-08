import { useCallback, useEffect, useMemo } from 'react';

import { useDispatch } from 'react-redux';

import { actions } from '@/slices/search';

import { useLoadApplications } from './useLoadApplications';
import useLoadConversations from './useLoadConversations';

const useQueryEntities = ({ sortBy, sortOrder, types, projectId, query }) => {
  const dispatch = useDispatch();
  const { conversations, conversationTotal, isConversationFetching, onLoadMoreConversations } =
    useLoadConversations(sortBy, sortOrder, projectId, query);

  useEffect(() => {
    dispatch(actions.setQuery({ query, queryTags: [] }));
  }, [dispatch, query]);

  const loadMoreConversations = useCallback(() => {
    if (conversationTotal <= conversations.length) {
      return;
    }
    onLoadMoreConversations();
  }, [conversationTotal, conversations.length, onLoadMoreConversations]);

  const {
    onLoadMoreApplications,
    data: applicationData,
    isApplicationsFetching,
  } = useLoadApplications(sortBy, sortOrder, projectId);
  const { rows: applications = [], total: applicationsTotal = 0 } = applicationData || {};

  const loadMoreApplications = useCallback(() => {
    if (applicationsTotal <= applications.length) {
      return;
    }
    onLoadMoreApplications();
  }, [applicationsTotal, applications.length, onLoadMoreApplications]);

  const canLoadMore = useMemo(
    () => applicationsTotal > applications.length || conversationTotal > conversations.length,
    [applications.length, applicationsTotal, conversationTotal, conversations.length],
  );

  const onLoadMore = useCallback(() => {
    if (!isApplicationsFetching) {
      types.includes('applications') && loadMoreApplications();
      types.includes('conversations') && loadMoreConversations();
    }
  }, [types, isApplicationsFetching, loadMoreApplications, loadMoreConversations]);
  const entities = useMemo(() => {
    const applicationList = applications.map(application => ({
      ...application,
      type: 'agent',
    }));
    const conversationList = conversations.map(conversation => ({
      ...conversation,
      type: 'conversation',
    }));
    const finalList = [
      ...(types.includes('applications') ? applicationList : []),
      ...(types.includes('conversations') ? conversationList : []),
    ];
    return finalList;
  }, [applications, conversations, types]);

  return {
    entities,
    isEntitiesFetching: isApplicationsFetching || isConversationFetching,
    onLoadMore,
    canLoadMore,
  };
};

export default useQueryEntities;
