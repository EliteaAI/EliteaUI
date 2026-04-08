import { useCallback, useMemo, useState } from 'react';

export const useGroupedCategories = (
  items = [],
  getCategoryForItem,
  onSelectItem,
  specialGroup,
  options = {},
) => {
  const { isSearchDisabled = false, isSortDisabled = false } = options;
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Convert items to standardized data structure
  const allItems = useMemo(() => {
    if (!items || !Array.isArray(items)) return [];

    return items.map(item => {
      // Get categories - can be single string or array
      const rawCategories = getCategoryForItem ? getCategoryForItem(item) : item.category;
      const categories = Array.isArray(rawCategories)
        ? rawCategories
        : rawCategories
          ? [rawCategories]
          : ['Other'];

      return {
        key: item.key,
        label: item.label,
        icon: item.icon,
        categories, // Now stored as array
        onClick: () => {
          onSelectItem(item);
        },
        disabled: item.disabled,
        section: item.section,
        value: item.value,
        categoryOrderByServer: item.categoryOrderByServer,
      };
    });
  }, [items, getCategoryForItem, onSelectItem]);

  // Extract all available categories
  const allCategories = useMemo(() => {
    const categorySet = new Set();
    allItems.forEach(item => {
      item.categories.forEach(cat => categorySet.add(cat));
    });
    const sortedGroups = Array.from(categorySet).sort();
    return specialGroup ? [specialGroup, ...sortedGroups] : sortedGroups;
  }, [allItems, specialGroup]);

  // Filter items based on selected categories and search
  const filteredItems = useMemo(() => {
    let filtered = allItems;

    // Filter by categories - item must match at least one selected category
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(item => item.categories.some(cat => selectedCategories.includes(cat)));
    }

    // Filter by search query
    if (!isSearchDisabled && searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.label.toLowerCase().includes(searchLower) ||
          String(item.key).toLowerCase().includes(searchLower) ||
          item.section?.toLowerCase().includes(searchLower) ||
          item.categories.some(cat => cat.toLowerCase().includes(searchLower)),
      );
    }

    // Sort by item name
    if (!isSortDisabled) {
      filtered.sort((a, b) => a.label.localeCompare(b.label));
    }

    return filtered;
  }, [allItems, selectedCategories, searchQuery, isSearchDisabled, isSortDisabled]);

  const sortItemsByCategoryOrderByServer = useCallback((groups, shouldSort) => {
    Object.keys(groups).forEach(category => {
      if (!shouldSort) {
        groups[category].sort((a, b) => a.label.localeCompare(b.label));
      } else if (groups[category][0]?.categoryOrderByServer) {
        groups[category].sort((a, b) => {
          const orderA = a.categoryOrderByServer?.[category] ?? Infinity;
          const orderB = b.categoryOrderByServer?.[category] ?? Infinity;
          const sortingOrderByServer = orderA - orderB;
          return sortingOrderByServer;
        });
      }
    });
  }, []);

  // Group filtered items by category
  // Items with multiple categories will appear in each category group
  const groupedItems = useMemo(() => {
    const groups = {};
    filteredItems.forEach(item => {
      // Add item to each of its categories
      item.categories.forEach(category => {
        if (!groups[category]) groups[category] = [];

        if (selectedCategories.length) {
          if (selectedCategories.includes(category)) groups[category].push(item);
        } else groups[category].push(item);
      });
    });

    sortItemsByCategoryOrderByServer(groups, isSortDisabled);

    return groups;
  }, [filteredItems, sortItemsByCategoryOrderByServer, isSortDisabled, selectedCategories]);

  // Handle category selection
  const onSelectCategory = useCallback(category => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  }, []);

  // Handle search change
  const onSearchChange = useCallback(e => {
    setSearchQuery(e.target.value);
  }, []);

  return {
    // Data
    allCategories,
    groupedItems,

    // State
    selectedCategories,
    searchQuery,

    // Handlers
    onSearchChange,
    onSelectCategory,
  };
};
