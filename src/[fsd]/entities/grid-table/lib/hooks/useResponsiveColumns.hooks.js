import { useMemo } from 'react';

export const useResponsiveColumns = options => {
  const {
    columns = [],
    containerWidth = 1200,
    checkboxColumnWidth = '3rem',
    actionsColumnWidth = '8.25rem',
    showCheckbox = true,
  } = options || {};

  const visibleColumns = useMemo(
    () => columns.filter(col => !col.hideBelow || containerWidth >= col.hideBelow),
    [columns, containerWidth],
  );

  const dataColumns = useMemo(
    () => visibleColumns.filter(col => col.field !== 'name' && col.field !== 'actions'),
    [visibleColumns],
  );

  const gridTemplateColumns = useMemo(() => {
    const columnWidths = [];

    // Add checkbox column if enabled
    if (showCheckbox) {
      columnWidths.push(checkboxColumnWidth);
    }

    // Add column widths
    visibleColumns.forEach(col => {
      if (col.field === 'actions') {
        columnWidths.push(actionsColumnWidth);
      } else {
        columnWidths.push(col.width || '1fr');
      }
    });

    return columnWidths.join(' ');
  }, [visibleColumns, showCheckbox, checkboxColumnWidth, actionsColumnWidth]);

  const columnVisibility = useMemo(() => {
    const visibility = {};
    columns.forEach(col => {
      visibility[col.field] = !col.hideBelow || containerWidth >= col.hideBelow;
    });
    return visibility;
  }, [columns, containerWidth]);

  return {
    visibleColumns,
    dataColumns,
    gridTemplateColumns,
    columnVisibility,
  };
};
