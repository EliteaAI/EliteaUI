import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLocation, useSearchParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { AgentsStudioContext, useInteractiveTour } from '@/[fsd]/app/providers';
import { AgentsStudioConstants } from '@/[fsd]/features/agents-studio/lib/constants';
import { AgentsStudioHelpers, TagHelpers } from '@/[fsd]/features/agents-studio/lib/helpers';
import { useAgentsStudioData } from '@/[fsd]/features/agents-studio/lib/hooks';
import { AgentCategorySection, AgentModal } from '@/[fsd]/features/agents-studio/ui';
import { AGENT_STUDIO_TOUR_ID } from '@/[fsd]/features/interactive-tours/lib/constants';
import { AGENT_STUDIO_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants/agentStudioTourTargets.constants';
import { useGroupedCategories } from '@/[fsd]/shared/lib/hooks';
import { Category } from '@/[fsd]/shared/ui';
import useDebounceValue from '@/hooks/useDebounceValue';

const AgentsStudio = memo(() => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounceValue(query, 300);
  const [selectedTagNames, setSelectedTagNames] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalOpenedByTourRef = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const tour = useInteractiveTour();

  useEffect(() => {
    const agentId = searchParams.get(AgentsStudioConstants.AGENT_ID);
    if (agentId && !selectedApplication) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete(AgentsStudioConstants.AGENT_ID);
      setSelectedApplication({ id: agentId });
      setIsModalOpen(true);
      setSearchParams(newSearchParams, {
        replace: true,
        state: location.state,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, selectedApplication]);

  const {
    tags,
    applicationsByTag,
    totalCountsByTag,
    currentPageByTag,
    loadingTags,
    refreshingTags,
    isFetching,
    fetchApplicationsForTag,
    fetchTrendingApplications,
    fetchMyLikedApplications,
    fetchApplicationsWithoutTags,
    updateApplicationInState,
    addToMyLiked,
    removeFromMyLiked,
    onRefresh,
  } = useAgentsStudioData(debouncedQuery, selectedTagNames);

  const allCategories = useMemo(() => AgentsStudioHelpers.buildAllCategories(tags), [tags]);
  const applicationMenuItems = useMemo(
    () => AgentsStudioHelpers.buildApplicationMenuItems(applicationsByTag, selectedTagNames),
    [applicationsByTag, selectedTagNames],
  );

  const handleApplicationSelect = useCallback(app => {
    setSelectedApplication(app);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    modalOpenedByTourRef.current = false;
    setIsModalOpen(false);
    setSelectedApplication(null);
  }, []);

  const updateApplicationInStateAndModal = useCallback(
    (applicationId, updateFn) => {
      updateApplicationInState(applicationId, updateFn);

      setSelectedApplication(prev => {
        if (prev && prev.id === applicationId) {
          return updateFn(prev);
        }
        return prev;
      });
    },
    [updateApplicationInState],
  );

  const { groupedItems, selectedCategories, searchQuery, onSearchChange, onSelectCategory } =
    useGroupedCategories(
      applicationMenuItems,
      AgentsStudioHelpers.getCategoryForApplication,
      handleApplicationSelect,
      null,
      { isSearchDisabled: true, isSortDisabled: true },
    );

  const handleTagSelect = useCallback(
    category => {
      setSelectedTagNames(prev =>
        prev.includes(category) ? prev.filter(name => name !== category) : [...prev, category],
      );
      onSelectCategory(category);
    },
    [onSelectCategory],
  );

  const handleSearchChange = useCallback(
    event => {
      const searchValue = event?.target?.value || '';
      setQuery(searchValue);
      onSearchChange(event);
    },
    [onSearchChange],
  );

  const handleLoadMore = useCallback(
    category => {
      const currentPage = currentPageByTag[category] || 0;
      const fetchFunction = AgentsStudioHelpers.getFetchFunctionForCategory(category, {
        fetchTrendingApplications,
        fetchMyLikedApplications,
        fetchApplicationsWithoutTags,
        fetchApplicationsForTag,
        tags,
      });

      if (fetchFunction) {
        fetchFunction(currentPage + 1);
      }
    },
    [
      currentPageByTag,
      fetchApplicationsForTag,
      fetchTrendingApplications,
      fetchMyLikedApplications,
      fetchApplicationsWithoutTags,
      tags,
    ],
  );

  const renderCategory = useCallback(
    (category, items) => {
      return (
        <AgentCategorySection
          key={category}
          category={category}
          items={items}
          totalCount={totalCountsByTag[category] || 0}
          isLoading={refreshingTags.has(category)}
          isLoadingMore={loadingTags.has(
            tags?.rows?.find(t => TagHelpers.formatTagName(t.name) === category)?.id || category,
          )}
          onSelectItem={handleApplicationSelect}
          onLoadMore={handleLoadMore}
          onRefresh={onRefresh}
        />
      );
    },
    [
      handleApplicationSelect,
      handleLoadMore,
      loadingTags,
      onRefresh,
      refreshingTags,
      tags?.rows,
      totalCountsByTag,
    ],
  );

  const renderNoResults = useCallback(
    (title, description) => (
      <Category.NoResultsMessage
        title={title}
        description={description}
      />
    ),
    [],
  );

  const firstVisibleApplication = useMemo(() => {
    for (const category of allCategories) {
      const firstItem = groupedItems?.[category]?.find(item => item?.value);

      if (firstItem?.value) {
        return firstItem.value;
      }
    }

    return null;
  }, [allCategories, groupedItems]);

  const isStartingConversationStep = useMemo(
    () => tour?.tourId === AGENT_STUDIO_TOUR_ID && tour?.currentStep?.id === 'starting-a-conversation',
    [tour?.currentStep?.id, tour?.tourId],
  );

  useEffect(() => {
    if (isStartingConversationStep) {
      if (!isModalOpen && !selectedApplication && firstVisibleApplication) {
        modalOpenedByTourRef.current = true;
        setSelectedApplication(firstVisibleApplication);
        setIsModalOpen(true);
      }

      return;
    }

    if (modalOpenedByTourRef.current) {
      modalOpenedByTourRef.current = false;
      setIsModalOpen(false);
      setSelectedApplication(null);
    }
  }, [firstVisibleApplication, isModalOpen, isStartingConversationStep, selectedApplication]);

  const styles = agentsStudioStyles();

  const contextValue = useMemo(
    () => ({
      updateApplicationInState: updateApplicationInStateAndModal,
      addToMyLiked,
      removeFromMyLiked,
    }),
    [updateApplicationInStateAndModal, addToMyLiked, removeFromMyLiked],
  );

  return (
    <AgentsStudioContext.Provider value={contextValue}>
      <Box
        data-tour={AGENT_STUDIO_TOUR_TARGET_IDS.workspace}
        sx={styles.workspace}
      >
        <Category.GroupedCategory
          title="Welcome to Agents Studio"
          searchPlaceholder="Search for agents"
          noResultsTitle="No agents found"
          noResultsDescription="Try adjusting your search terms"
          isLoading={isFetching && Object.keys(applicationsByTag).length === 0}
          allCategories={allCategories}
          groupedItems={groupedItems}
          selectedCategories={selectedCategories}
          searchQuery={searchQuery}
          renderCategory={renderCategory}
          renderNoResults={renderNoResults}
          onSelectCategory={handleTagSelect}
          onSearchChange={handleSearchChange}
          slotProps={{
            categoryList: { sx: styles.categoryList },
            groupedItems: { sx: styles.groupedItems },
          }}
        />
        {selectedApplication && (
          <AgentModal
            open={isModalOpen}
            onClose={handleCloseModal}
            agent={selectedApplication}
          />
        )}
      </Box>
    </AgentsStudioContext.Provider>
  );
});

AgentsStudio.displayName = 'AgentsStudio';

/** @type {MuiSx} */
const agentsStudioStyles = () => ({
  workspace: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  categoryList: {
    maxWidth: '81.375rem',
  },
  groupedItems: {
    maxWidth: '81.375rem',
  },
});

export default AgentsStudio;
