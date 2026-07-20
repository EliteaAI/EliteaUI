import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';

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
    tooltipTestId,
  } = props;

  const styles = infoLabelWithTooltipStyles(iconSize);

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
        <InfoTooltip
          infoTooltip={{ title: tooltip, icon: styles.info }}
          testId={tooltipTestId}
        />
      )}
    </Box>
  );
});

InfoLabelWithTooltip.displayName = 'InfoLabelWithTooltip';

/** @type {MuiSx} */
const infoLabelWithTooltipStyles = iconSize => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    height: '1.5rem',
    '[data-shrink="true"] &': {
      height: '1.5rem',
    },
  },
  label: ({ palette }) => ({
    color: palette.text.primary,
  }),
  info: {
    width: iconSize,
    height: iconSize,
  },
});

export default InfoLabelWithTooltip;
