import { useCallback } from 'react';

import EntityCard from '@/components/Card';

/**
 * Custom hook that provides a memoized card renderer function for EntityCard component.
 * Used by list pages (Applications, Pipelines, Credentials, etc.) to render cards consistently.
 */
const useCardList = (viewMode, customTagClickHandler = null) => {
  const renderCard = useCallback(
    (cardData, cardType, index) => {
      // When metaOnly is true, return metadata for DataTable to extract viewMode
      if (cardData?.metaOnly) {
        return {
          viewMode,
        };
      }

      return (
        <EntityCard
          data={cardData}
          viewMode={viewMode}
          type={cardType}
          index={index}
          customTagClickHandler={customTagClickHandler}
        />
      );
    },
    [viewMode, customTagClickHandler],
  );

  return {
    renderCard,
  };
};

export default useCardList;
