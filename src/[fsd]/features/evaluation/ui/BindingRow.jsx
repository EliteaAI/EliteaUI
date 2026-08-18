import { memo, useCallback } from 'react';

import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { getBindingEngineLabel, getBindingLabel, isPlatformBinding } from '../lib/helpers';

const BindingRow = memo(props => {
  const {
    binding,
    dimensions = [],
    codeValidations = [],
    canEdit = false,
    canReorder = false,
    onEdit,
    onRemove,
  } = props;

  const handleEdit = useCallback(() => onEdit?.(binding), [onEdit, binding]);
  const handleRemove = useCallback(() => onRemove?.(binding), [onRemove, binding]);

  const isPlatform = isPlatformBinding(binding);
  const dragDisabled = !canReorder;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: binding.id,
    disabled: dragDisabled,
  });

  const styles = bindingRowStyles({ transform, transition, isDragging });

  const label = getBindingLabel(binding, { dimensions, codeValidations });

  const badges = [getBindingEngineLabel(binding)];
  if (binding.weight != null) badges.push(`w${binding.weight}`);
  if (binding.target != null && binding.target_operator) {
    badges.push(`${binding.target_operator} ${binding.target}`);
  }

  return (
    <Box
      ref={setNodeRef}
      style={styles.dragStyle}
      sx={styles.root}
      data-testid="evaluation-binding-row"
    >
      {canReorder && (
        <Box
          sx={styles.dragHandle}
          {...(dragDisabled ? {} : attributes)}
          {...(dragDisabled ? {} : listeners)}
          data-testid="evaluation-binding-drag-handle"
        >
          <DragIndicatorIcon fontSize="small" />
        </Box>
      )}

      <Box sx={styles.info}>
        <Typography variant="bodyMedium">{label}</Typography>
        {badges.filter(Boolean).map(badge => (
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

      <Box sx={styles.actions}>
        {canEdit && (
          <Tooltip
            title="Edit binding"
            placement="top"
          >
            <IconButton
              size="small"
              onClick={handleEdit}
              data-testid="evaluation-binding-edit"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
        {canEdit && !isPlatform && (
          <Tooltip
            title="Remove"
            placement="top"
          >
            <IconButton
              size="small"
              onClick={handleRemove}
              data-testid="evaluation-binding-remove"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
});

BindingRow.displayName = 'BindingRow';

/** @type {MuiSx} */
const bindingRowStyles = ({ transform, transition, isDragging } = {}) => ({
  dragStyle: {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 'auto',
  },
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.paper,
    opacity: isDragging ? 0.5 : 1,
  }),
  dragHandle: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    color: palette.text.secondary,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
  }),
  info: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
    minWidth: 0,
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

export default BindingRow;
