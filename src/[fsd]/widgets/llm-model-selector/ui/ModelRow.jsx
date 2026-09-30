import { memo } from 'react';

import { Box, MenuItem, Tooltip, Typography } from '@mui/material';

import { AUTO_MODEL_ID } from '@/[fsd]/shared/lib/constants/autoRouting.constants';
import { Tooltip as SharedTooltip } from '@/[fsd]/shared/ui';
import { AUTO_MODEL_INFO_TEXT, getDefaultModelDescription } from '@/[fsd]/widgets/llm-model-selector/lib';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import ImageIcon from '@/assets/image.svg?react';
import ReasonIcon from '@/assets/reason-icon.svg?react';

const ModelRow = memo(props => {
  const { model, isSelected, isFirstRow, onClick } = props;

  const isAuto = model.id === AUTO_MODEL_ID;
  const description = model.description || getDefaultModelDescription(model);
  const hasDescription = Boolean(description);
  // Auto routes to any capable model, so it always shows both capability icons (per Figma spec).
  const hasReasoning = isAuto || Boolean(model.supports_reasoning);
  const hasVision = isAuto || Boolean(model.supports_vision);
  const hasIcons = hasReasoning || hasVision;
  const tooltipPlacement = isFirstRow ? 'bottom' : 'top';

  return (
    <MenuItem
      data-testid={`model-selector-option-${model.name}`}
      selected={isSelected}
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      sx={styles.menuItem}
    >
      <Box sx={styles.itemContent}>
        <Box sx={styles.nameRow}>
          <Typography
            variant="bodyMedium"
            sx={styles.name}
          >
            {model.display_name || model.name}
          </Typography>
          {isAuto && (
            <SharedTooltip.InfoTooltip
              infoTooltip={{ title: AUTO_MODEL_INFO_TEXT, placement: tooltipPlacement }}
            />
          )}
        </Box>

        {(hasDescription || hasIcons) && (
          <Box sx={styles.metaRow}>
            {hasDescription && (
              <Typography
                variant="bodySmall"
                sx={styles.description}
                data-testid={`model-selector-option-description-${model.name}`}
              >
                {description}
              </Typography>
            )}
            {hasDescription && hasIcons && <Box sx={styles.divider} />}
            {hasReasoning && (
              <Tooltip
                title="Supports reasoning"
                placement={tooltipPlacement}
                enterDelay={600}
                enterNextDelay={600}
              >
                <Box sx={styles.capabilityIconWrapper}>
                  <Box
                    component={ReasonIcon}
                    sx={styles.capabilityIcon}
                  />
                </Box>
              </Tooltip>
            )}
            {hasReasoning && hasVision && <Box sx={styles.divider} />}
            {hasVision && (
              <Tooltip
                title="Supports image analysis"
                placement={tooltipPlacement}
                enterDelay={600}
                enterNextDelay={600}
              >
                <Box sx={styles.capabilityIconWrapper}>
                  <Box
                    component={ImageIcon}
                    sx={styles.capabilityIcon}
                  />
                </Box>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>

      {isSelected && (
        <Box sx={styles.checkIconWrapper}>
          <Box
            component={CheckedIcon}
            sx={styles.checkIcon}
          />
        </Box>
      )}
    </MenuItem>
  );
});

ModelRow.displayName = 'ModelRow';

/** @type {MuiSx} */
const styles = {
  menuItem: ({ palette }) => ({
    padding: '0.5rem 1.25rem',
    minHeight: 'unset',
    alignItems: 'center',
    gap: '1rem',
    '&:hover': {
      backgroundColor: palette.background.surface.interactive.default,
    },
    '&.Mui-selected': {
      backgroundColor: palette.background.interactiveItem.active,
    },
    '&.Mui-selected:hover': {
      backgroundColor: palette.background.interactiveItem.active,
    },
  }),
  itemContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    gap: '0.25rem',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    minWidth: 0,
  },
  name: ({ palette }) => ({
    flexShrink: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: palette.text.secondary,
  }),
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
    overflow: 'hidden',
  },
  description: ({ palette }) => ({
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexShrink: 1,
    color: palette.text.primary,
  }),
  divider: ({ palette }) => ({
    flexShrink: 0,
    width: '0.0625rem',
    height: '0.625rem',
    backgroundColor: palette.border.lines,
  }),
  capabilityIconWrapper: {
    flexShrink: 0,
    display: 'inline-flex',
    width: '0.75rem',
    height: '0.75rem',
  },
  capabilityIcon: ({ palette }) => ({
    width: '0.75rem',
    height: '0.75rem',
    fontSize: '0.75rem',
    color: palette.icon.default,
  }),
  checkIconWrapper: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  checkIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
    color: palette.text.secondary,
    marginLeft: '1rem',
  }),
};

export default ModelRow;
