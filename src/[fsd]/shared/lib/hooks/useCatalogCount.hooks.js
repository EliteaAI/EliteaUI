import { useMemo } from 'react';

export const useCatalogCount = (itemsByTag, selectedTagNames) => {
  return useMemo(() => {
    const source =
      selectedTagNames.length > 0
        ? selectedTagNames.flatMap(tag => itemsByTag[tag] || [])
        : Object.values(itemsByTag).flat();
    return new Set(source.map(item => item.id)).size;
  }, [itemsByTag, selectedTagNames]);
};
