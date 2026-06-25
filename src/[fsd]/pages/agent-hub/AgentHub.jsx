import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLocation, useSearchParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { AgentHubContext, useInteractiveTour } from '@/[fsd]/app/providers';
import { AgentHubConstants } from '@/[fsd]/features/agent-hub/lib/constants';
import { AgentHubHelpers } from '@/[fsd]/features/agent-hub/lib/helpers';
import { useAgentHubData } from '@/[fsd]/features/agent-hub/lib/hooks';
import { AgentCategorySection, AgentModal } from '@/[fsd]/features/agent-hub/ui';
import { AGENT_HUB_TOUR_ID, AGENT_HUB_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import { useGroupedCategories } from '@/[fsd]/shared/lib/hooks';
import { Category } from '@/[fsd]/shared/ui';
import useDebounceValue from '@/hooks/useDebounceValue';

const AgentHub = memo(() => {
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
    const agentId = searchParams.get(AgentHubConstants.AGENT_ID);
    if (agentId && !selectedApplication) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete(AgentHubConstants.AGENT_ID);
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
    categoryNames,
    applicationsByTag,
    totalCountsByTag,
    currentPageByTag,
    loadingTags,
    refreshingTags,
    isFetching,
    fetchApplicationsForCategoryName,
    fetchTrendingApplications,
    fetchMyLikedApplications,
    updateApplicationInState,
    addToMyLiked,
    removeFromMyLiked,
    onRefresh,
  } = useAgentHubData(debouncedQuery, selectedTagNames);

  const allCategories = useMemo(() => AgentHubHelpers.buildAllCategories(categoryNames), [categoryNames]);
  const applicationMenuItems = useMemo(
    () => AgentHubHelpers.buildApplicationMenuItems(applicationsByTag, selectedTagNames),
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
      AgentHubHelpers.getCategoryForApplication,
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
      const fetchFunction = AgentHubHelpers.getFetchFunctionForCategory(category, {
        fetchTrendingApplications,
        fetchMyLikedApplications,
        fetchApplicationsForCategoryName,
      });

      if (fetchFunction) {
        fetchFunction(currentPage + 1);
      }
    },
    [currentPageByTag, fetchApplicationsForCategoryName, fetchTrendingApplications, fetchMyLikedApplications],
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
          isLoadingMore={loadingTags.has(category)}
          onSelectItem={handleApplicationSelect}
          onLoadMore={handleLoadMore}
          onRefresh={onRefresh}
        />
      );
    },
    [handleApplicationSelect, handleLoadMore, loadingTags, onRefresh, refreshingTags, totalCountsByTag],
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
    () => tour?.tourId === AGENT_HUB_TOUR_ID && tour?.currentStep?.id === 'starting-a-conversation',
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

  const styles = agentHubStyles();

  const contextValue = useMemo(
    () => ({
      updateApplicationInState: updateApplicationInStateAndModal,
      addToMyLiked,
      removeFromMyLiked,
    }),
    [updateApplicationInStateAndModal, addToMyLiked, removeFromMyLiked],
  );

  return (
    <AgentHubContext.Provider value={contextValue}>
      <Box
        data-tour={AGENT_HUB_TOUR_TARGET_IDS.workspace}
        sx={styles.workspace}
      >
        <Category.GroupedCategory
          title="Welcome to Agent HUB"
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
    </AgentHubContext.Provider>
  );
});

AgentHub.displayName = 'AgentHub';

/** @type {MuiSx} */
const agentHubStyles = () => ({
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

export default AgentHub;
