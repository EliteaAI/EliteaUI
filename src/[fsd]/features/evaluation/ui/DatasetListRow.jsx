import { memo, useCallback } from 'react';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';

const DatasetListRow = memo(props => {
  const { dataset, canEdit = false, canDelete = false, onOpen, onRename, onDelete } = props;

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

  const styles = datasetListRowStyles();

  const caseCount = dataset.case_count ?? dataset.cases?.length ?? 0;

  return (
    <Box
      sx={styles.root}
      onClick={handleOpen}
      data-testid="dataset-list-row"
    >
      <Box sx={styles.info}>
        <Box sx={styles.titleRow}>
          <Typography variant="bodyMedium">{dataset.name}</Typography>
          <Typography
            component="span"
            variant="bodySmall"
            sx={styles.badge}
          >
            {caseCount} case{caseCount === 1 ? '' : 's'}
          </Typography>
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

      {(canEdit || canDelete) && (
        <Box sx={styles.actions}>
          {canEdit && (
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
          {canDelete && (
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

/** @type {MuiSx} */
const datasetListRowStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.75rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    border: `0.0625rem solid ${palette.border.lines}`,
    '&:hover': {
      backgroundColor: palette.background.tabButton.default,
    },
  }),
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    minWidth: 0,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  badge: ({ palette }) => ({
    padding: '0.0625rem 0.5rem',
    borderRadius: '0.75rem',
    color: palette.text.secondary,
    backgroundColor: palette.background.tabPanel,
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  actions: {
    display: 'flex',
    gap: '0.25rem',
    flexShrink: 0,
  },
});

export default DatasetListRow;
