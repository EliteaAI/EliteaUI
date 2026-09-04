import { memo, useCallback } from 'react';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';

import { EvaluationRowBadge, evaluationRowStyles } from '../common';

const EvaluationItemRow = memo(props => {
  const { item, readOnly = false, canEdit = false, canDelete = false, onEdit, onDelete } = props;

  const handleEdit = useCallback(() => onEdit?.(item), [onEdit, item]);
  const handleDelete = useCallback(() => onDelete?.(item), [onDelete, item]);

  const styles = evaluationRowStyles();

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
            <EvaluationRowBadge key={badge}>{badge}</EvaluationRowBadge>
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

export default EvaluationItemRow;
