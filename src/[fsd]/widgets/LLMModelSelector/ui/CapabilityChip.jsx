import { memo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import ImageIcon from '@/assets/image.svg?react';
import ReasonIcon from '@/assets/reason-icon.svg?react';

const CAPABILITY_CONFIG = {
  vision: {
    Icon: ImageIcon,
    label: 'Image analysis',
    tooltip: 'Supports image analysis',
  },
  reasoning: {
    Icon: ReasonIcon,
    label: 'Reasoning',
    tooltip: 'Supports reasoning',
  },
};

/**
 * Compact capability indicator chip.
 * @param {{ type: 'vision' | 'reasoning', showLabel?: boolean, showTooltip?: boolean }} props
 */
const CapabilityChip = memo(props => {
  const { type, showLabel = false, showTooltip = false } = props;
  const config = CAPABILITY_CONFIG[type];

  if (!config) return null;

  const styles = capabilityChipStyles(showLabel, type);

  const chip = (
    <Box sx={styles.chip}>
      <Box
        component={config.Icon}
        sx={styles.icon}
      />
      {showLabel && <Typography variant="labelSmall">{config.label}</Typography>}
    </Box>
  );

  if (showTooltip) {
    return (
      <Tooltip
        title={config.tooltip}
        placement="top"
        enterDelay={3000}
        enterNextDelay={3000}
      >
        {chip}
      </Tooltip>
    );
  }

  return chip;
});

CapabilityChip.displayName = 'CapabilityChip';

/** @type {(showLabel: boolean, type: string) => MuiSx} */
const capabilityChipStyles = (showLabel, type) => ({
  chip: ({ palette }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    backgroundColor: palette.capability[type].background,
    ...(showLabel
      ? {
          gap: '0.375rem',
          padding: '0.25rem 0.375rem',
          borderRadius: '0.5rem',
          backdropFilter: `blur(${palette.mode === 'light' ? '0.375rem' : '0.75rem'})`,
          color: palette.text.secondary,
        }
      : {
          padding: '0.1875rem',
          borderRadius: '0.25rem',
          width: '1.125rem',
          height: '1.125rem',
        }),
  }),
  icon: ({ palette }) => ({
    color: palette.capability[type].icon,
    flexShrink: 0,
    ...(showLabel
      ? { fontSize: '1rem', width: '1rem', height: '1rem' }
      : { fontSize: '0.75rem', width: '0.75rem', height: '0.75rem' }),
  }),
});

export default CapabilityChip;
