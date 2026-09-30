import { memo, useCallback } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { useTextOverflow } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditPenIcon from '@/components/Icons/EditPenIcon';

import { DIMENSION_BADGE_TOOLTIP, DIMENSION_BADGE_TOOLTIP_DELAY, EVAL_TIER } from '../../../lib/constants';
import {
  getBindingEngineLabel,
  getBindingEngineTooltip,
  getTargetLabel,
  getWeightLabel,
} from '../../../lib/helpers';
import { SharedDatasetBadge } from '../../common';

const NAME_MIN_VISIBLE_CHARS = 9;
const NAME_TOOLTIP_MIN_LENGTH = 30;

const DimensionCard = memo(props => {
  const {
    binding,
    dimensionName,
    tier = null,
    defaultTarget = null,
    defaultTargetOperator = null,
    defaultScaleType = null,
    defaultWeight = null,
    canEdit = false,
    canRemove = false,
    onEdit,
    onRemove,
  } = props;

  const { textRef: nameRef, isOverflowing: isNameTruncated } = useTextOverflow(dimensionName);
  const showNameTooltip = (dimensionName || '').length >= NAME_TOOLTIP_MIN_LENGTH || isNameTruncated;

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
    defaultScaleType,
  );
  const weightLabel = getWeightLabel(binding.weight ?? defaultWeight);
  const badges = [
    { key: 'engine', label: engineLabel, tooltip: getBindingEngineTooltip(binding) },
    { key: 'target', label: targetLabel, tooltip: DIMENSION_BADGE_TOOLTIP.target },
    { key: 'weight', label: weightLabel, tooltip: DIMENSION_BADGE_TOOLTIP.weight },
  ].filter(badge => badge.label);

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
          disableHoverListener={!showNameTooltip}
        >
          <Typography
            ref={nameRef}
            variant="bodyMedium"
            sx={styles.name}
          >
            {dimensionName}
          </Typography>
        </Tooltip>
        <Box sx={styles.badges}>
          {isShared && <SharedDatasetBadge tooltipTitle={sharedTooltip} />}
          {badges.map(({ key, label, tooltip }) => (
            <Tooltip
              key={key}
              title={tooltip}
              placement="top"
              enterDelay={DIMENSION_BADGE_TOOLTIP_DELAY}
              enterNextDelay={DIMENSION_BADGE_TOOLTIP_DELAY}
            >
              <Typography
                component="span"
                variant="bodySmall"
                sx={styles.badge}
              >
                {label}
              </Typography>
            </Tooltip>
          ))}
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
    minHeight: '2.625rem',
    padding: '0.5rem 1rem',
    borderRadius: '0.75rem',
    border: `0.0625rem solid ${palette.border.default}`,
    backgroundColor: palette.components.aiProviderAccordion.background.default,
    gap: '0.625rem',
    '&:hover': {
      backgroundColor: palette.components.aiProviderAccordion.background.hover,
      borderColor: palette.border.lines,
    },
    '&:hover .dimension-card-actions': {
      opacity: 1,
    },
  }),
  info: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: '0.625rem',
    rowGap: '0.5rem',
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
    flex: `1 1 ${NAME_MIN_VISIBLE_CHARS}ch`,
    maxWidth: 'max-content',
    minWidth: 0,
  }),
  badges: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: '0.625rem',
    rowGap: '0.5rem',
    minWidth: 0,
    cursor: 'default',
  },
  badge: ({ palette }) => ({
    padding: '0.25rem 0.5rem',
    borderRadius: '1.0625rem',
    color: palette.text.primary,
    backgroundColor: 'transparent',
    border: `0.0625rem solid ${palette.background.surface.interactive.default}`,
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
    color: palette.icon.default,
    '&:hover': {
      backgroundColor: palette.background.surface.interactive.default,
    },
    '&:hover svg path': {
      fill: palette.icon.secondary,
    },
  }),
  actionIcon: ({ palette }) => ({
    fontSize: '1rem',
    '& path': {
      fill: palette.icon.default,
    },
  }),
});

export default DimensionCard;
