import { memo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import InfoIcon from '@/components/Icons/InfoIcon';

/**
 * Reusable field label with optional info icon and tooltip
 * Used for form fields, settings, and other input labels
 */
const InfoLabelWithTooltip = memo(props => {
  const {
    label,
    tooltip,
    variant = 'bodySmall',
    sx,
    labelSx: labelSxProp,
    labelTextPointerEventsNone = false,
    inheritColor = false,
    inheritLabel = false,
    iconSize = 16,
    required = false,
  } = props;

  const labelSx = [
    inheritColor ? { color: 'inherit' } : styles.label,
    ...(labelTextPointerEventsNone ? [{ pointerEvents: 'none' }] : []),
    ...(labelSxProp ? [labelSxProp] : []),
  ];

  const labelContent = required ? `${label} *` : label;

  const labelNode = inheritLabel ? (
    <Box
      component="span"
      sx={labelSx}
    >
      {labelContent}
    </Box>
  ) : (
    <Typography
      variant={variant}
      sx={labelSx}
    >
      {labelContent}
    </Typography>
  );

  return (
    <Box sx={[styles.container, sx]}>
      {labelNode}
      {tooltip && (
        <Tooltip title={tooltip}>
          <Box sx={styles.iconWrapper}>
            <InfoIcon
              width={iconSize}
              height={iconSize}
            />
          </Box>
        </Tooltip>
      )}
    </Box>
  );
});

InfoLabelWithTooltip.displayName = 'InfoLabelWithTooltip';

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  label: ({ palette }) => ({
    color: palette.text.primary,
  }),
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',

    '&:hover': {
      opacity: 0.8,
    },
  },
};

export default InfoLabelWithTooltip;
