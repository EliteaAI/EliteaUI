import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useLocation, useSearchParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { SkillHubContext } from '@/[fsd]/app/providers';
import { ELITEA_CATALOG_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import { SkillHubConstants } from '@/[fsd]/features/skill-hub/lib/constants';
import { SkillHubHelpers } from '@/[fsd]/features/skill-hub/lib/helpers';
import { useSkillHubData } from '@/[fsd]/features/skill-hub/lib/hooks';
import SkillCategorySection from '@/[fsd]/features/skill-hub/ui/SkillCategorySection';
import SkillHubModal from '@/[fsd]/features/skill-hub/ui/SkillHubModal';
import { useGroupedCategories } from '@/[fsd]/shared/lib/hooks';
import { Category } from '@/[fsd]/shared/ui';
import useDebounceValue from '@/hooks/useDebounceValue';

const SkillsTab = memo(props => {
  const { query = '' } = props;
  const debouncedQuery = useDebounceValue(query, 300);
  const [selectedTagNames, setSelectedTagNames] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    const skillId = searchParams.get(SkillHubConstants.SKILL_ID);
    if (skillId && !selectedSkill) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete(SkillHubConstants.SKILL_ID);
      setSelectedSkill({ id: skillId });
      setIsModalOpen(true);
      setSearchParams(newSearchParams, {
        replace: true,
        state: location.state,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, selectedSkill]);

  const {
    categoryNames,
    skillsByTag,
    totalCountsByTag,
    currentPageByTag,
    loadingTags,
    refreshingTags,
    isFetching,
    fetchTrendingSkills,
    fetchMyLikedSkills,
    updateSkillInState,
    addToMyLiked,
    removeFromMyLiked,
    onRefresh,
  } = useSkillHubData(debouncedQuery, selectedTagNames);

  const allCategories = useMemo(() => SkillHubHelpers.buildAllCategories(categoryNames), [categoryNames]);
  const skillMenuItems = useMemo(
    () => SkillHubHelpers.buildSkillMenuItems(skillsByTag, selectedTagNames),
    [skillsByTag, selectedTagNames],
  );

  const handleSkillSelect = useCallback(skill => {
    setSelectedSkill(skill);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedSkill(null);
  }, []);

  const updateSkillInStateAndModal = useCallback(
    (skillId, updateFn) => {
      updateSkillInState(skillId, updateFn);

      setSelectedSkill(prev => {
        if (prev && prev.id === skillId) {
          return updateFn(prev);
        }
        return prev;
      });
    },
    [updateSkillInState],
  );

  const { groupedItems, selectedCategories, onSelectCategory } = useGroupedCategories(
    skillMenuItems,
    SkillHubHelpers.getCategoryForSkill,
    handleSkillSelect,
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

  const handleLoadMore = useCallback(
    category => {
      const currentPage = currentPageByTag[category] || 0;
      const fetchFunction = SkillHubHelpers.getFetchFunctionForCategory(category, {
        fetchTrendingSkills,
        fetchMyLikedSkills,
      });

      if (fetchFunction) {
        fetchFunction(currentPage + 1);
      }
    },
    [currentPageByTag, fetchTrendingSkills, fetchMyLikedSkills],
  );

  const renderCategory = useCallback(
    (category, items) => {
      return (
        <SkillCategorySection
          key={category}
          category={category}
          items={items}
          totalCount={totalCountsByTag[category] || 0}
          isLoading={refreshingTags.has(category)}
          isLoadingMore={loadingTags.has(category)}
          onSelectItem={handleSkillSelect}
          onLoadMore={handleLoadMore}
          onRefresh={onRefresh}
        />
      );
    },
    [handleSkillSelect, handleLoadMore, loadingTags, onRefresh, refreshingTags, totalCountsByTag],
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

  const styles = skillsTabStyles();

  const contextValue = useMemo(
    () => ({
      updateSkillInState: updateSkillInStateAndModal,
      addToMyLiked,
      removeFromMyLiked,
    }),
    [updateSkillInStateAndModal, addToMyLiked, removeFromMyLiked],
  );

  return (
    <SkillHubContext.Provider value={contextValue}>
      <Box
        data-tour={ELITEA_CATALOG_TOUR_TARGET_IDS.workspace}
        sx={styles.workspace}
      >
        <Category.CatalogBody
          noResultsTitle="No skills found"
          noResultsDescription="Try adjusting your search terms"
          isLoading={isFetching && Object.keys(skillsByTag).length === 0}
          allCategories={allCategories}
          groupedItems={groupedItems}
          selectedCategories={selectedCategories}
          renderCategory={renderCategory}
          renderNoResults={renderNoResults}
          onSelectCategory={handleTagSelect}
        />
        {selectedSkill && (
          <SkillHubModal
            open={isModalOpen}
            onClose={handleCloseModal}
            skill={selectedSkill}
          />
        )}
      </Box>
    </SkillHubContext.Provider>
  );
});

SkillsTab.displayName = 'SkillsTab';

/** @type {MuiSx} */
const skillsTabStyles = () => ({
  workspace: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
});

export default SkillsTab;
