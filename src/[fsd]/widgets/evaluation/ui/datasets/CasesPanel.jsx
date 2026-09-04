import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import {
  GridTableBody,
  GridTableContainer,
  GridTableHeader,
  GridTableRow,
} from '@/[fsd]/entities/grid-table';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import useCheckPermission from '@/hooks/useCheckPermission';

import { EVAL_CASE_SOURCE, EVAL_CASE_SOURCE_LABEL, EVAL_PERMISSIONS } from '../../lib/constants';
import { isDatasetSharedIn } from '../../lib/helpers';
import AddCaseMenu from '../suite/case-modals/AddCaseMenu';
import CaseInputNameCell from './CaseInputNameCell';
import CaseRowActions from './CaseRowActions';

const COLUMNS = [
  { field: 'input', label: 'Input', sortable: true },
  { field: 'expected_output', label: 'Expected Output', sortable: true },
  { field: 'source_type', label: 'Source', sortable: true },
  { field: 'variables', label: 'Variables', sortable: false },
];

const GRID_TEMPLATE_COLUMNS = '3rem 1fr 1fr 7rem 7rem 5rem';
const GRID_TEMPLATE_COLUMN_NO_CHECKBOXES = '4fr 4fr 2fr 2fr';
const NAME_FIELD = 'input';

const getSourceLabel = source => {
  if (source === EVAL_CASE_SOURCE.conversation) {
    return 'Chats';
  }
  return EVAL_CASE_SOURCE_LABEL[source] || source || '—';
};

const getVariablesLabel = variables => {
  if (!variables || typeof variables !== 'object') return '—';
  const count = Object.keys(variables).length;
  if (count === 0) return '—';
  return `${count} variable${count === 1 ? '' : 's'}`;
};

const CasesPanel = memo(props => {
  const {
    dataset = null,
    applicationId = null,
    cases = [],
    isLoading = false,
    onAddCase,
    onImportFile,
    onFromChatsRuns,
    onEditCase,
    onDeleteCase,
    onBulkDelete,
  } = props;

  const { checkPermission } = useCheckPermission();
  const canUpdate = checkPermission(EVAL_PERMISSIONS.datasetUpdate);
  const isSharedIn = isDatasetSharedIn(dataset, applicationId);
  const canEdit = canUpdate && !isSharedIn;

  const datasetName = dataset?.name;

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ field: null, direction: 'asc' });
  const [hoveredRowId, setHoveredRowId] = useState(null);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [dataset?.id]);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === cases.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cases.map(c => c.id)));
    }
  }, [selectedIds.size, cases]);

  const handleSelectRow = useCallback(id => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSort = useCallback(field => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handleRowMouseEnter = useCallback(row => {
    setHoveredRowId(row.id);
  }, []);

  const handleRowMouseLeave = useCallback(() => {
    setHoveredRowId(null);
  }, []);

  const handleBulkDelete = useCallback(() => {
    const selectedCases = cases.filter(c => selectedIds.has(c.id));
    onBulkDelete?.(selectedCases);
  }, [cases, selectedIds, onBulkDelete]);

  const sortedCases = useMemo(() => {
    if (!sortConfig.field) return cases;

    return [...cases].sort((a, b) => {
      let aVal = a[sortConfig.field];
      let bVal = b[sortConfig.field];

      if (sortConfig.field === 'variables') {
        aVal = Object.keys(aVal || {}).length;
        bVal = Object.keys(bVal || {}).length;
      }

      if (aVal == null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bVal == null) return sortConfig.direction === 'asc' ? -1 : 1;

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [cases, sortConfig]);

  const isAllSelected = cases.length > 0 && selectedIds.size === cases.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < cases.length;
  const hasSelection = selectedIds.size > 0;

  const renderCell = useCallback((column, value, row) => {
    if (column.field === 'input') {
      return row.input?.split('\n')[0]?.slice(0, 100) || '—';
    }
    if (column.field === 'expected_output') {
      if (!row.expected_output) return '—';
      return row.expected_output.split('\n')[0]?.slice(0, 100);
    }
    if (column.field === 'source_type') {
      return getSourceLabel(row.source_type);
    }
    if (column.field === 'variables') {
      return getVariablesLabel(row.variables);
    }
    return value ?? '—';
  }, []);

  const styles = casesPanelStyles();

  const toolbar = (
    <Box sx={styles.toolbar}>
      <Typography
        variant="headingSmall"
        sx={styles.datasetName}
      >
        {datasetName || 'Select a dataset'}
      </Typography>
      {datasetName && canEdit && (
        <Box sx={styles.toolbarActions}>
          <AddCaseMenu
            onCreateManually={onAddCase}
            onImportFile={onImportFile}
            onFromChatsRuns={onFromChatsRuns}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          />
          <Tooltip
            title={hasSelection ? `Delete ${selectedIds.size} selected` : 'Select cases to delete'}
            placement="top"
          >
            <Box component="span">
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.tertiary}
                onClick={handleBulkDelete}
                disabled={!hasSelection}
                sx={styles.deleteButton}
                data-testid="bulk-delete-button"
              >
                <DeleteIcon sx={styles.deleteIcon} />
              </Button.BaseBtn>
            </Box>
          </Tooltip>
        </Box>
      )}
    </Box>
  );

  if (!datasetName) {
    return (
      <Box sx={styles.root}>
        <Box sx={styles.emptyState}>
          <Typography
            variant="bodyMedium"
            sx={styles.emptyText}
          >
            Select or create a dataset to view its cases.
          </Typography>
        </Box>
      </Box>
    );
  }

  const isEmpty = cases.length === 0 && !isLoading;
  const emptyMessage = (
    <Box sx={styles.emptyCases}>
      <Typography
        variant="bodyMedium"
        sx={styles.emptyTitle}
      >
        No cases added yet.
      </Typography>
      <Typography
        variant="bodySmall"
        sx={styles.emptySubtitle}
      >
        Add a case manually, from chats and runs, or by importing a file.
      </Typography>
    </Box>
  );

  return (
    <Box sx={styles.root}>
      <GridTableContainer
        toolbar={toolbar}
        isLoading={isLoading}
        isEmpty={isEmpty}
        emptyMessage={emptyMessage}
        loadingMessage="Loading cases..."
      >
        <GridTableHeader
          columns={COLUMNS}
          sortConfig={sortConfig}
          onSort={handleSort}
          onSelectAll={handleSelectAll}
          isAllSelected={isAllSelected}
          isIndeterminate={isIndeterminate}
          gridTemplateColumns={canEdit ? GRID_TEMPLATE_COLUMNS : GRID_TEMPLATE_COLUMN_NO_CHECKBOXES}
          showCheckbox={canEdit}
        />
        <GridTableBody>
          {sortedCases.map(caseItem => (
            <GridTableRow
              key={caseItem.id}
              row={caseItem}
              columns={COLUMNS}
              nameField={NAME_FIELD}
              isSelected={selectedIds.has(caseItem.id)}
              isHovered={hoveredRowId === caseItem.id}
              onSelect={handleSelectRow}
              onMouseEnter={handleRowMouseEnter}
              onMouseLeave={handleRowMouseLeave}
              gridTemplateColumns={canEdit ? GRID_TEMPLATE_COLUMNS : GRID_TEMPLATE_COLUMN_NO_CHECKBOXES}
              showCheckbox={canEdit}
              NameCellComponent={CaseInputNameCell}
              renderCell={renderCell}
              ActionsComponent={CaseRowActions}
              actionsProps={{
                caseItem,
                canEdit,
                onEdit: onEditCase,
                onDelete: onDeleteCase,
              }}
            />
          ))}
        </GridTableBody>
      </GridTableContainer>
    </Box>
  );
});

CasesPanel.displayName = 'CasesPanel';

/** @type {MuiSx} */
const casesPanelStyles = () => ({
  root: ({ palette }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: palette.background.toolkitDetailLeftPanel,
  }),
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '0.425rem 0',
  },
  datasetName: ({ palette }) => ({
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  toolbarActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  deleteButton: ({ palette }) => ({
    minWidth: '1.75rem',
    width: '1.75rem',
    height: '1.75rem',
    padding: '0.375rem',
    borderRadius: '50%',
    backgroundColor: palette.background.tabButton.default,
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
    '&.Mui-disabled': {
      backgroundColor: palette.background.tabButton.default,
      '& svg path': {
        fill: palette.icon.fill.disabled,
      },
    },
  }),
  deleteIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    '& path': {
      fill: palette.icon.fill.default,
    },
  }),
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '2rem',
  },
  emptyText: ({ palette }) => ({
    color: palette.text.secondary,
    textAlign: 'center',
  }),
  emptyCases: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '0.25rem',
  },
  emptyTitle: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  emptySubtitle: ({ palette }) => ({
    color: palette.text.primary,
  }),
});

export default CasesPanel;
