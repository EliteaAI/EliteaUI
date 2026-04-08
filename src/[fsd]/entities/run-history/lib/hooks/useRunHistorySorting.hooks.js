import { useCallback, useState } from 'react';

const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc',
};

export const useRunHistorySorting = (initialSortType, initialDirection = SORT_DIRECTIONS.DESC) => {
  const [sortConfig, setSortConfig] = useState({
    type: initialSortType,
    direction: initialDirection,
  });

  const handleSortItems = useCallback(sortType => {
    setSortConfig(prevConfig => {
      if (prevConfig.type === sortType)
        return {
          ...prevConfig,
          direction:
            prevConfig.direction === SORT_DIRECTIONS.ASC ? SORT_DIRECTIONS.DESC : SORT_DIRECTIONS.ASC,
        };

      return {
        type: sortType,
        direction: SORT_DIRECTIONS.ASC,
      };
    });
  }, []);

  const getSortedData = useCallback(
    (data, sortFunctions) => {
      if (!data?.length || !sortFunctions) return data;

      const sortFunction = sortFunctions[sortConfig.type];

      if (!sortFunction) return data;

      const sorted = [...data].sort((a, b) => {
        const comparison = sortFunction(a, b);

        return sortConfig.direction === SORT_DIRECTIONS.ASC ? comparison : -comparison;
      });

      return sorted;
    },
    [sortConfig],
  );

  return {
    sortConfig,
    handleSortItems,
    getSortedData,
  };
};
