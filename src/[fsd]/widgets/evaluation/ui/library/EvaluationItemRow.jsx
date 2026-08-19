import { memo, useCallback } from 'react';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';

const EvaluationItemRow = memo(props => {
  const { item, readOnly = false, canEdit = false, canDelete = false, onEdit, onDelete } = props;

  const handleEdit = useCallback(() => onEdit?.(item), [onEdit, item]);
  const handleDelete = useCallback(() => onDelete?.(item), [onDelete, item]);

  const styles = evaluationItemRowStyles();

  const badges = [];
  if (item.tier) badges.push(item.tier);
  if (item.allowed_engines?.length) badges.push(item.allowed_engines.join(' · '));
  if (item.return_contract) badges.push(item.return_contract);

  return (
    <Box
      sx={styles.root}
      data-testid="evaluation-item-row"
    >
      <Box sx={styles.info}>
        <Box sx={styles.titleRow}>
          <Typography variant="bodyMedium">{item.name}</Typography>
          {badges.map(badge => (
            <Typography
              key={badge}
              component="span"
              variant="bodySmall"
              sx={styles.badge}
            >
              {badge}
            </Typography>
          ))}
        </Box>
        {item.description && (
          <Typography
            variant="bodySmall"
            color="text.secondary"
          >
            {item.description}
          </Typography>
        )}
      </Box>

      {!readOnly && (canEdit || canDelete) && (
        <Box sx={styles.actions}>
          {canEdit && (
            <Tooltip
              title="Edit"
              placement="top"
            >
              <IconButton
                size="small"
                onClick={handleEdit}
                data-testid="evaluation-item-edit"
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
                data-testid="evaluation-item-delete"
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

EvaluationItemRow.displayName = 'EvaluationItemRow';

/** @type {MuiSx} */
const evaluationItemRowStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.75rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
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

export default EvaluationItemRow;
