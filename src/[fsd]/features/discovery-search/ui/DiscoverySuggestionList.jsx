import { Fragment, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { DiscoverySearchHelpers } from '@/[fsd]/features/discovery-search/lib/helpers';
import { AutoSuggestionTitles, SortFields, SortOrderOptions } from '@/common/constants';
import { useSearchPromptNavigate } from '@/hooks/useCardNavigate';
import useDebounceValue from '@/hooks/useDebounceValue';
import useSearch from '@/hooks/useSearch';
import useSearchBar from '@/hooks/useSearchBar';
import { useAuthorIdFromUrl } from '@/hooks/useSearchParamValue';

import DiscoverySearchList from './DiscoverySearchList';
import DiscoverySearchListItem from './DiscoverySearchListItem';
import DiscoverySearchListSection from './DiscoverySearchListSection';

const DiscoverySuggestionList = memo(props => {
  const { searchString, isEmptyInput, searchTags, searchTagLength, showTopData, handleAddTag } = props;
  const { tagList: entityFilteredTagList } = useSelector(state => state.tags);

  const {
    projectId,
    getSuggestion,
    isFetching,
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
    skillResult,
    skillTotal,
  } = useSearch();

  const {
    isPublicApplicationsPage,
    isUserPublicPage,
    isPipelinesPage,
    isToolkitsPage,
    isMCPsPage,
    isCredentialsPage,
    isSkillsPage,
  } = useSearchBar();

  const isPublicApplications = Boolean(isPublicApplicationsPage);
  const isUserPublic = Boolean(isUserPublicPage);
  const isPipelines = Boolean(isPipelinesPage);
  const isToolkits = Boolean(isToolkitsPage);
  const isMCPs = Boolean(isMCPsPage);
  const isCredentials = Boolean(isCredentialsPage);
  const isSkills = Boolean(isSkillsPage);
  const userPublicPageTab = isUserPublicPage?.params?.tab;
  const tab =
    isPublicApplicationsPage?.params?.tab ||
    isPipelinesPage?.params?.tab ||
    isUserPublicPage?.params?.tab ||
    isToolkitsPage?.params?.tab ||
    isMCPsPage?.params?.tab ||
    isCredentialsPage?.params?.tab;

  const [page, setPage] = useState(0);
  const authorId = useAuthorIdFromUrl();
  const statuses = useMemo(() => DiscoverySearchHelpers.getSuggestionStatuses(tab), [tab]);
  const autoSuggestionTypes = useMemo(
    () =>
      DiscoverySearchHelpers.getAutoSuggestionTypes({
        isPublicApplications,
        isPipelines,
        isToolkits,
        isMCPs,
        isCredentials,
        isSkills,
        isUserPublic,
      }),
    [isCredentials, isMCPs, isPipelines, isPublicApplications, isSkills, isToolkits, isUserPublic],
  );

  const getSuggestions = useCallback(
    (inputValue, tags, requestedPage) => {
      getSuggestion({
        projectId,
        page: requestedPage,
        params: {
          query: inputValue,
          sort: SortFields.Id,
          order: SortOrderOptions.DESC,
          author_id: authorId || undefined,
          entities: autoSuggestionTypes,
          statuses,
          tags,
        },
      });
    },
    [authorId, autoSuggestionTypes, getSuggestion, projectId, statuses],
  );

  const filteredTagList = useMemo(
    () => DiscoverySearchHelpers.filterTagsByQuery(entityFilteredTagList, searchString),
    [entityFilteredTagList, searchString],
  );

  const debouncedInputValue = useDebounceValue(searchString, 500);
  useEffect(() => {
    if (!isEmptyInput || searchTagLength) {
      setPage(0);
      getSuggestions(debouncedInputValue, searchTags, 0);
    }
  }, [getSuggestions, isEmptyInput, debouncedInputValue, searchTagLength, searchTags]);

  const fetchMoreData = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    getSuggestions(debouncedInputValue, searchTags, nextPage);
  }, [debouncedInputValue, getSuggestions, page, searchTags]);

  const { navigateToDetail } = useSearchPromptNavigate();

  const navToEntity = useCallback(
    (id, name) => {
      navigateToDetail({ id, name });
    },
    [navigateToDetail],
  );

  const navToUserPublicEntity = useCallback(
    (id, name, userPublicEntityType) => {
      navigateToDetail({ id, name, userPublicEntityType });
    },
    [navigateToDetail],
  );

  const renderTagItem = useCallback(
    tag => (
      <DiscoverySearchListItem
        key={tag.id}
        onClick={() => handleAddTag(tag)}
      >
        {tag.name}
      </DiscoverySearchListItem>
    ),
    [handleAddTag],
  );

  const renderItem = useCallback(
    ({ id, name, displayName }) => (
      <DiscoverySearchListItem
        key={id}
        onClick={() => navToEntity(id, name || displayName)}
      >
        {displayName || name}
      </DiscoverySearchListItem>
    ),
    [navToEntity],
  );

  const renderUserPublicItem = useCallback(
    (item, userPublicEntityType) => (
      <DiscoverySearchListItem
        key={item.id}
        onClick={() => navToUserPublicEntity(item.id, item.name, userPublicEntityType)}
      >
        {item.name}
      </DiscoverySearchListItem>
    ),
    [navToUserPublicEntity],
  );

  if (showTopData) return null;

  return (
    <DiscoverySearchList>
      {!isToolkits && !isCredentials && !isMCPs && (
        <DiscoverySearchListSection
          sectionTitle={AutoSuggestionTitles.TAGS}
          data={filteredTagList}
          total={filteredTagList.length}
          isFetching={isFetching}
          renderItem={renderTagItem}
          fetchMoreData={fetchMoreData}
        />
      )}
      {isPublicApplications && (
        <DiscoverySearchListSection
          sectionTitle={AutoSuggestionTitles.AGENTS}
          data={agentResult}
          total={agentTotal}
          isFetching={isFetching}
          renderItem={renderItem}
          fetchMoreData={fetchMoreData}
        />
      )}
      {isPipelines && (
        <DiscoverySearchListSection
          sectionTitle={AutoSuggestionTitles.PIPELINES}
          data={pipelineResult}
          total={pipelineTotal}
          isFetching={isFetching}
          renderItem={renderItem}
          fetchMoreData={fetchMoreData}
        />
      )}
      {isToolkits && (
        <DiscoverySearchListSection
          sectionTitle={AutoSuggestionTitles.TOOLKITS}
          data={toolkitResult}
          total={toolkitTotal}
          isFetching={isFetching}
          renderItem={renderItem}
          fetchMoreData={fetchMoreData}
        />
      )}
      {isMCPs && (
        <DiscoverySearchListSection
          sectionTitle={AutoSuggestionTitles.MCPs}
          data={mcpResult}
          total={mcpTotal}
          isFetching={isFetching}
          renderItem={renderItem}
          fetchMoreData={fetchMoreData}
        />
      )}
      {isCredentials && (
        <DiscoverySearchListSection
          sectionTitle={AutoSuggestionTitles.CREDENTIALS}
          data={credentialResult}
          total={credentialTotal}
          isFetching={isFetching}
          renderItem={renderItem}
          fetchMoreData={fetchMoreData}
        />
      )}
      {isSkills && (
        <DiscoverySearchListSection
          sectionTitle={AutoSuggestionTitles.SKILLS}
          data={skillResult}
          total={skillTotal}
          isFetching={isFetching}
          renderItem={renderItem}
          fetchMoreData={fetchMoreData}
        />
      )}
      {isUserPublic && (
        <>
          {userPublicPageTab === 'all' && (
            <Fragment>
              <DiscoverySearchListSection
                sectionTitle={AutoSuggestionTitles.AGENTS}
                data={agentResult}
                total={agentTotal}
                isFetching={isFetching}
                renderItem={item => renderUserPublicItem(item, 'agents')}
                fetchMoreData={fetchMoreData}
              />
              <DiscoverySearchListSection
                sectionTitle={AutoSuggestionTitles.PIPELINES}
                data={pipelineResult}
                total={pipelineTotal}
                isFetching={isFetching}
                renderItem={item => renderUserPublicItem(item, 'pipelines')}
                fetchMoreData={fetchMoreData}
              />
              <DiscoverySearchListSection
                sectionTitle={AutoSuggestionTitles.TOOLKITS}
                data={toolkitResult}
                total={toolkitTotal}
                isFetching={isFetching}
                renderItem={item => renderUserPublicItem(item, 'toolkits')}
                fetchMoreData={fetchMoreData}
              />
              <DiscoverySearchListSection
                sectionTitle={AutoSuggestionTitles.MCPs}
                data={mcpResult}
                total={mcpTotal}
                isFetching={isFetching}
                renderItem={item => renderUserPublicItem(item, 'mcps')}
                fetchMoreData={fetchMoreData}
              />
              <DiscoverySearchListSection
                sectionTitle={AutoSuggestionTitles.CREDENTIALS}
                data={credentialResult}
                total={credentialTotal}
                isFetching={isFetching}
                renderItem={item => renderUserPublicItem(item, 'credentials')}
                fetchMoreData={fetchMoreData}
              />
            </Fragment>
          )}
          {userPublicPageTab === 'agents' && (
            <DiscoverySearchListSection
              sectionTitle={AutoSuggestionTitles.AGENTS}
              data={agentResult}
              total={agentTotal}
              isFetching={isFetching}
              renderItem={renderItem}
              fetchMoreData={fetchMoreData}
            />
          )}
          {userPublicPageTab === 'pipelines' && (
            <DiscoverySearchListSection
              sectionTitle={AutoSuggestionTitles.PIPELINES}
              data={pipelineResult}
              total={pipelineTotal}
              isFetching={isFetching}
              renderItem={item => renderUserPublicItem(item, 'pipelines')}
              fetchMoreData={fetchMoreData}
            />
          )}
          {userPublicPageTab === 'toolkits' && (
            <DiscoverySearchListSection
              sectionTitle={AutoSuggestionTitles.TOOLKITS}
              data={toolkitResult}
              total={toolkitTotal}
              isFetching={isFetching}
              renderItem={item => renderUserPublicItem(item, 'toolkits')}
              fetchMoreData={fetchMoreData}
            />
          )}
          {userPublicPageTab === 'mcps' && (
            <DiscoverySearchListSection
              sectionTitle={AutoSuggestionTitles.MCPs}
              data={mcpResult}
              total={mcpTotal}
              isFetching={isFetching}
              renderItem={item => renderUserPublicItem(item, 'mcps')}
              fetchMoreData={fetchMoreData}
            />
          )}
          {userPublicPageTab === 'credentials' && (
            <DiscoverySearchListSection
              sectionTitle={AutoSuggestionTitles.CREDENTIALS}
              data={credentialResult}
              total={credentialTotal}
              isFetching={isFetching}
              renderItem={item => renderUserPublicItem(item, 'credentials')}
              fetchMoreData={fetchMoreData}
            />
          )}
        </>
      )}
    </DiscoverySearchList>
  );
});

DiscoverySuggestionList.displayName = 'DiscoverySuggestionList';

export default DiscoverySuggestionList;
