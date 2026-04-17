import { useCallback, useMemo, useState } from 'react';

export const useRowSelection = options => {
  const { rows = [], idField = 'id', initialSelected = [] } = options || {};

  const [selectedIds, setSelectedIds] = useState(initialSelected);

  const allRowIds = useMemo(() => rows.map(row => row[idField]), [rows, idField]);

  const allRowIdsSet = useMemo(() => new Set(allRowIds), [allRowIds]);

  const currentPageSelectedCount = useMemo(
    () => selectedIds.filter(id => allRowIdsSet.has(id)).length,
    [selectedIds, allRowIdsSet],
  );

  const isAllSelected = useMemo(
    () => currentPageSelectedCount === rows.length && rows.length > 0,
    [currentPageSelectedCount, rows.length],
  );

  const isIndeterminate = useMemo(
    () => currentPageSelectedCount > 0 && currentPageSelectedCount < rows.length,
    [currentPageSelectedCount, rows.length],
  );

  const selectedCount = selectedIds.length;

  const handleSelectAll = useCallback(() => {
    // Selection is preserved across pages. When all rows on the current page are selected,
    // toggling "select all" removes only the current page row IDs and keeps selections
    // from other pages intact.
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !allRowIdsSet.has(id)));
    } else {
      setSelectedIds(prev => {
        const prevSelectedIdsSet = new Set(prev);
        const nextRowIds = allRowIds.filter(id => !prevSelectedIdsSet.has(id));

        return [...prev, ...nextRowIds];
      });
    }
  }, [isAllSelected, allRowIds, allRowIdsSet]);

  const handleSelectRow = useCallback(rowId => {
    setSelectedIds(prev => {
      if (prev.includes(rowId)) {
        return prev.filter(id => id !== rowId);
      } else {
        return [...prev, rowId];
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isRowSelected = useCallback(rowId => selectedIds.includes(rowId), [selectedIds]);

  const getSelectedRows = useCallback(
    () => rows.filter(row => selectedIds.includes(row[idField])),
    [rows, selectedIds, idField],
  );

  const selectRows = useCallback(rowIds => {
    setSelectedIds(rowIds);
  }, []);

  return {
    selectedIds,
    selectedCount,
    isAllSelected,
    isIndeterminate,
    handleSelectAll,
    handleSelectRow,
    clearSelection,
    isRowSelected,
    getSelectedRows,
    selectRows,
  };
};
