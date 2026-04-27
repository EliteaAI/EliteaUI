import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { AutoSuggestionTitles, CollectionStatus, SortFields, SortOrderOptions } from '@/common/constants';
import { useSearchPromptNavigate } from '@/hooks/useCardNavigate';
import useSearch from '@/hooks/useSearch';
import useSearchBar from '@/hooks/useSearchBar';
import { useAuthorIdFromUrl } from '@/hooks/useSearchParamValue';

import { ListSection, StyledList, StyledListItem } from './SearchBarComponents';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function SuggestionList({
  searchString,
  isEmptyInput,
  searchTags,
  searchTagLength,
  showTopData,
  handleAddTag,
}) {
  const {
    projectId,
    getSuggestion,
    isFetching,
    tagResult,
    tagTotal,
    agentResult,
    agentTotal,
    pipelineResult,
    pipelineTotal,
    toolkitResult,
    toolkitTotal,
    credentialResult,
    credentialTotal,
    mcpResult,
    mcpTotal,
  } = useSearch();

  const {
    isPublicApplicationsPage,
    isUserPublicPage,
    isPipelinesPage,
    isToolkitsPage,
    isMCPsPage,
    isCredentialsPage,
  } = useSearchBar();

  const userPublicPageTab = useMemo(() => isUserPublicPage?.params?.tab, [isUserPublicPage?.params?.tab]);
  const tab = useMemo(
    () =>
      (
        isPublicApplicationsPage ||
        isPipelinesPage ||
        isUserPublicPage ||
        isToolkitsPage ||
        isMCPsPage ||
        isCredentialsPage
      )?.params?.tab,
    [
      isPipelinesPage,
      isPublicApplicationsPage,
      isUserPublicPage,
      isToolkitsPage,
      isMCPsPage,
      isCredentialsPage,
    ],
  );

  const [page, setPage] = useState(0);
  const authorId = useAuthorIdFromUrl();
  const statuses = useMemo(() => {
    switch (tab) {
      case 'latest':
      case 'my-liked':
      case 'trending':
        return [CollectionStatus.Published];
      default:
        return undefined;
    }
  }, [tab]);
  const autoSuggestionTypes = useMemo(() => {
    if (isPublicApplicationsPage) return ['tag', 'application'];
    if (isPipelinesPage) return ['tag', 'pipeline'];
    if (isToolkitsPage) return ['toolkit'];
    if (isMCPsPage) return ['mcp'];
    if (isCredentialsPage) return ['credential'];
    if (isUserPublicPage) return ['tag', 'application', 'pipeline', 'collection', 'toolkit', 'credential'];
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSuggestions = useCallback(
    (inputValue, tags) => {
      getSuggestion({
        projectId,
        page,
        params: {
          query: inputValue,
          sort: SortFields.Id,
          order: SortOrderOptions.DESC,
          author_id: authorId ? authorId : undefined,
          entities: autoSuggestionTypes,
          statuses,
          tags,
        },
      });
    },
    [authorId, autoSuggestionTypes, getSuggestion, page, projectId, statuses],
  );

  const fetchMoreData = useCallback(() => {
    setPage(page + 1);
  }, [page]);

  // dopropdown data load / load more
  const debouncedInputValue = useDebounce(searchString, 500);
  useEffect(() => {
    if (!isEmptyInput || searchTagLength) {
      setPage(0);
      getSuggestions(debouncedInputValue, searchTags);
    }
  }, [getSuggestions, isEmptyInput, page, debouncedInputValue, searchTagLength, searchTags]);

  useEffect(() => {
    if (page > 0) {
      getSuggestions(searchString, searchTags);
    }
  }, [getSuggestions, page, searchString, searchTags]);

  const { navigateToDetail } = useSearchPromptNavigate();

  const navToEntity = useCallback(
    (id, name) => {
      navigateToDetail({
        id,
        name,
      });
    },
    [navigateToDetail],
  );

  const navToUserPublicEntity = useCallback(
    (id, name, userPublicEntityType) => {
      navigateToDetail({
        id,
        name,
        userPublicEntityType,
      });
    },
    [navigateToDetail],
  );

  const renderTagItem = useCallback(
    tag => {
      const { name, id } = tag;

      return (
        <StyledListItem
          key={id}
          onClick={() => handleAddTag(tag)}
        >
          {name}
        </StyledListItem>
      );
    },
    [handleAddTag],
  );

  const renderItem = useCallback(
    ({ id, name, displayName }) => {
      return (
        <StyledListItem
          key={id}
          onClick={() => navToEntity(id, name || displayName)}
        >
          {displayName || name}
        </StyledListItem>
      );
    },
    [navToEntity],
  );

  const renderUserPublicItem = useCallback(
    userPublicEntityType => {
      const UserPublicItem = ({ id, name }) => {
        return (
          <StyledListItem
            key={id}
            onClick={() => navToUserPublicEntity(id, name, userPublicEntityType)}
          >
            {name}
          </StyledListItem>
        );
      };
      UserPublicItem.displayName = 'UserPublicItem';
      return UserPublicItem;
    },
    [navToUserPublicEntity],
  );

  return (
    <>
      {!showTopData && (
        <StyledList>
          {!isToolkitsPage && !isCredentialsPage && !isMCPsPage && (
            <ListSection
              sectionTitle={AutoSuggestionTitles.TAGS}
              data={tagResult}
              total={tagTotal}
              isFetching={isFetching}
              renderItem={renderTagItem}
              fetchMoreData={fetchMoreData}
            />
          )}
          {isPublicApplicationsPage && (
            <ListSection
              sectionTitle={AutoSuggestionTitles.AGENTS}
              data={agentResult}
              total={agentTotal}
              isFetching={isFetching}
              renderItem={renderItem}
              fetchMoreData={fetchMoreData}
            />
          )}
          {isPipelinesPage && (
            <ListSection
              sectionTitle={AutoSuggestionTitles.PIPELINES}
              data={pipelineResult}
              total={pipelineTotal}
              isFetching={isFetching}
              renderItem={renderItem}
              fetchMoreData={fetchMoreData}
            />
          )}
          {isToolkitsPage && (
            <ListSection
              sectionTitle={AutoSuggestionTitles.TOOLKITS}
              data={toolkitResult}
              total={toolkitTotal}
              isFetching={isFetching}
              renderItem={renderItem}
              fetchMoreData={fetchMoreData}
            />
          )}
          {isMCPsPage && (
            <ListSection
              sectionTitle={AutoSuggestionTitles.MCPs}
              data={mcpResult}
              total={mcpTotal}
              isFetching={isFetching}
              renderItem={renderItem}
              fetchMoreData={fetchMoreData}
            />
          )}
          {isCredentialsPage && (
            <ListSection
              sectionTitle={AutoSuggestionTitles.CREDENTIALS}
              data={credentialResult}
              total={credentialTotal}
              isFetching={isFetching}
              renderItem={renderItem}
              fetchMoreData={fetchMoreData}
            />
          )}
          {isUserPublicPage && (
            <>
              {userPublicPageTab === 'all' && (
                <React.Fragment>
                  <ListSection
                    sectionTitle={AutoSuggestionTitles.AGENTS}
                    data={agentResult}
                    total={agentTotal}
                    isFetching={isFetching}
                    renderItem={renderUserPublicItem('agents')}
                    fetchMoreData={fetchMoreData}
                  />
                  <ListSection
                    sectionTitle={AutoSuggestionTitles.PIPELINES}
                    data={pipelineResult}
                    total={pipelineTotal}
                    isFetching={isFetching}
                    renderItem={renderUserPublicItem('pipelines')}
                    fetchMoreData={fetchMoreData}
                  />
                  <ListSection
                    sectionTitle={AutoSuggestionTitles.TOOLKITS}
                    data={toolkitResult}
                    total={toolkitTotal}
                    isFetching={isFetching}
                    renderItem={renderUserPublicItem('toolkits')}
                    fetchMoreData={fetchMoreData}
                  />
                  <ListSection
                    sectionTitle={AutoSuggestionTitles.MCPs}
                    data={mcpResult}
                    total={mcpTotal}
                    isFetching={isFetching}
                    renderItem={renderUserPublicItem('mcps')}
                    fetchMoreData={fetchMoreData}
                  />
                  <ListSection
                    sectionTitle={AutoSuggestionTitles.CREDENTIALS}
                    data={credentialResult}
                    total={credentialTotal}
                    isFetching={isFetching}
                    renderItem={renderUserPublicItem('credentials')}
                    fetchMoreData={fetchMoreData}
                  />
                </React.Fragment>
              )}
              {userPublicPageTab === 'agents' && (
                <ListSection
                  sectionTitle={AutoSuggestionTitles.AGENTS}
                  data={agentResult}
                  total={agentTotal}
                  isFetching={isFetching}
                  renderItem={renderItem}
                  fetchMoreData={fetchMoreData}
                />
              )}
              {userPublicPageTab === 'pipelines' && (
                <ListSection
                  sectionTitle={AutoSuggestionTitles.PIPELINES}
                  data={pipelineResult}
                  total={pipelineTotal}
                  isFetching={isFetching}
                  renderItem={renderUserPublicItem('pipelines')}
                  fetchMoreData={fetchMoreData}
                />
              )}
              {userPublicPageTab === 'toolkits' && (
                <ListSection
                  sectionTitle={AutoSuggestionTitles.TOOLKITS}
                  data={toolkitResult}
                  total={toolkitTotal}
                  isFetching={isFetching}
                  renderItem={renderUserPublicItem('toolkits')}
                  fetchMoreData={fetchMoreData}
                />
              )}
              {userPublicPageTab === 'mcps' && (
                <ListSection
                  sectionTitle={AutoSuggestionTitles.MCPS}
                  data={mcpResult}
                  total={mcpTotal}
                  isFetching={isFetching}
                  renderItem={renderUserPublicItem('mcps')}
                  fetchMoreData={fetchMoreData}
                />
              )}
              {userPublicPageTab === 'credentials' && (
                <ListSection
                  sectionTitle={AutoSuggestionTitles.CREDENTIALS}
                  data={credentialResult}
                  total={credentialTotal}
                  isFetching={isFetching}
                  renderItem={renderUserPublicItem('credentials')}
                  fetchMoreData={fetchMoreData}
                />
              )}
            </>
          )}
        </StyledList>
      )}
    </>
  );
}
