import { memo, useCallback } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditPenIcon from '@/components/Icons/EditPenIcon';

import { EVAL_TIER } from '../../../lib/constants';
import { getBindingEngineLabel, getTargetLabel, getWeightLabel } from '../../../lib/helpers';
import { SharedDatasetBadge } from '../../common';

const DimensionCard = memo(props => {
  const {
    binding,
    dimensionName,
    tier = null,
    defaultTarget = null,
    defaultTargetOperator = null,
    defaultWeight = null,
    canEdit = false,
    canRemove = false,
    onEdit,
    onRemove,
  } = props;

  const isShared = tier != null && tier !== EVAL_TIER.agent_adhoc;
  const sharedTooltip = tier === EVAL_TIER.platform ? 'Shared across platform' : 'Shared across project';

  const handleEdit = useCallback(
    event => {
      event.stopPropagation();
      onEdit?.(binding);
    },
    [onEdit, binding],
  );

  const handleRemove = useCallback(
    event => {
      event.stopPropagation();
      onRemove?.(binding);
    },
    [onRemove, binding],
  );

  const engineLabel = getBindingEngineLabel(binding);
  const targetLabel = getTargetLabel(
    binding.target ?? defaultTarget,
    binding.target_operator || defaultTargetOperator,
  );
  const weightLabel = getWeightLabel(binding.weight ?? defaultWeight);

  const styles = dimensionCardStyles();

  return (
    <Box
      sx={styles.root}
      data-testid={`dimension-card-${binding.id}`}
    >
      <Box sx={styles.info}>
        <Tooltip
          title={dimensionName}
          placement="top"
          disableHoverListener={dimensionName.length < 30}
        >
          <Typography
            variant="bodyMedium"
            sx={styles.name}
          >
            {dimensionName}
          </Typography>
        </Tooltip>
        {isShared && <SharedDatasetBadge tooltipTitle={sharedTooltip} />}
        <Box sx={styles.badges}>
          {engineLabel && (
            <Typography
              component="span"
              variant="bodySmall"
              sx={styles.badge}
            >
              {engineLabel}
            </Typography>
          )}
          {targetLabel && (
            <Typography
              component="span"
              variant="bodySmall"
              sx={styles.badge}
            >
              {targetLabel}
            </Typography>
          )}
          {weightLabel && (
            <Typography
              component="span"
              variant="bodySmall"
              sx={styles.badge}
            >
              {weightLabel}
            </Typography>
          )}
        </Box>
      </Box>
      {(canEdit || canRemove) && (
        <Box
          className="dimension-card-actions"
          sx={styles.actions}
        >
          {canEdit && (
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              onClick={handleEdit}
              sx={styles.actionButton}
              data-testid={`dimension-card-edit-${binding.id}`}
            >
              <EditPenIcon sx={styles.actionIcon} />
            </Button.BaseBtn>
          )}
          {canRemove && (
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              onClick={handleRemove}
              sx={styles.actionButton}
              data-testid={`dimension-card-remove-${binding.id}`}
            >
              <DeleteIcon sx={styles.actionIcon} />
            </Button.BaseBtn>
          )}
        </Box>
      )}
    </Box>
  );
});

DimensionCard.displayName = 'DimensionCard';

/** @type {MuiSx} */
const dimensionCardStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '2.625rem',
    padding: '0.5rem 1rem',
    borderRadius: '0.75rem',
    border: `0.0625rem solid ${palette.border.cardsOutlines}`,
    backgroundColor: palette.background.aiProviderAccordion.default,
    gap: '0.625rem',
    '&:hover': {
      backgroundColor: palette.background.aiProviderAccordion.hover,
      borderColor: palette.border.lines,
    },
    '&:hover .dimension-card-actions': {
      opacity: 1,
    },
  }),
  info: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    minWidth: 0,
    flex: 1,
  },
  name: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexShrink: 1,
    minWidth: 0,
  }),
  badges: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    flexShrink: 0,
  },
  badge: ({ palette }) => ({
    padding: '0.25rem 0.5rem',
    borderRadius: '1.0625rem',
    color: palette.text.primary,
    backgroundColor: 'transparent',
    border: `0.0625rem solid ${palette.background.tabButton.default}`,
    fontSize: '0.75rem',
    lineHeight: '1rem',
    whiteSpace: 'nowrap',
  }),
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flexShrink: 0,
    opacity: 0,
    transition: 'opacity 0.15s ease',
  },
  actionButton: ({ palette }) => ({
    padding: '0.375rem',
    minWidth: 'auto',
    width: '1.75rem',
    height: '1.75rem',
    borderRadius: '1rem',
    color: palette.icon.fill.default,
    '&:hover': {
      backgroundColor: palette.background.tabButton.default,
    },
  }),
  actionIcon: ({ palette }) => ({
    fontSize: '1rem',
    '& path': {
      fill: palette.icon.fill.default,
    },
  }),
});

export default DimensionCard;
