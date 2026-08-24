import { memo, useCallback } from 'react';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';

import { isDatasetSharedIn } from '../../lib/helpers';
import { EvaluationRowBadge, evaluationRowStyles } from '../common';

const DatasetListRow = memo(props => {
  const {
    dataset,
    applicationId = null,
    canEdit = false,
    canDelete = false,
    onOpen,
    onRename,
    onDelete,
  } = props;

  const handleOpen = useCallback(() => onOpen?.(dataset), [onOpen, dataset]);
  const handleRename = useCallback(
    event => {
      event.stopPropagation();
      onRename?.(dataset);
    },
    [onRename, dataset],
  );
  const handleDelete = useCallback(
    event => {
      event.stopPropagation();
      onDelete?.(dataset);
    },
    [onDelete, dataset],
  );

  const styles = evaluationRowStyles({ clickable: true });

  const caseCount = dataset.case_count ?? dataset.cases?.length ?? 0;
  const isSharedIn = isDatasetSharedIn(dataset, applicationId);
  const canEditRow = canEdit && !isSharedIn;
  const canDeleteRow = canDelete && !isSharedIn;

  return (
    <Box
      sx={styles.root}
      onClick={handleOpen}
      data-testid="dataset-list-row"
    >
      <Box sx={styles.info}>
        <Box sx={styles.titleRow}>
          <Typography variant="bodyMedium">{dataset.name}</Typography>
          <EvaluationRowBadge>
            {caseCount} case{caseCount === 1 ? '' : 's'}
          </EvaluationRowBadge>
          {dataset.is_shared && (
            <EvaluationRowBadge>{isSharedIn ? 'Shared in' : 'Shared'}</EvaluationRowBadge>
          )}
        </Box>
        {dataset.description && (
          <Typography
            variant="bodySmall"
            color="text.secondary"
          >
            {dataset.description}
          </Typography>
        )}
      </Box>

      {(canEditRow || canDeleteRow) && (
        <Box sx={styles.actions}>
          {canEditRow && (
            <Tooltip
              title="Rename"
              placement="top"
            >
              <IconButton
                size="small"
                onClick={handleRename}
                data-testid="dataset-rename"
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
          {canDeleteRow && (
            <Tooltip
              title="Delete"
              placement="top"
            >
              <IconButton
                size="small"
                onClick={handleDelete}
                data-testid="dataset-delete"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  );
});

DatasetListRow.displayName = 'DatasetListRow';

export default DatasetListRow;
