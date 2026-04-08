import { useCallback, useMemo, useState } from 'react';

export const useRowSelection = options => {
  const { rows = [], idField = 'id', initialSelected = [] } = options || {};

  const [selectedIds, setSelectedIds] = useState(initialSelected);

  const allRowIds = useMemo(() => rows.map(row => row[idField]), [rows, idField]);

  const isAllSelected = useMemo(
    () => selectedIds.length === rows.length && rows.length > 0,
    [selectedIds.length, rows.length],
  );

  const isIndeterminate = useMemo(
    () => selectedIds.length > 0 && selectedIds.length < rows.length,
    [selectedIds.length, rows.length],
  );

  const selectedCount = selectedIds.length;

  const handleSelectAll = useCallback(() => {
    setSelectedIds(isAllSelected ? [] : allRowIds);
  }, [isAllSelected, allRowIds]);

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
