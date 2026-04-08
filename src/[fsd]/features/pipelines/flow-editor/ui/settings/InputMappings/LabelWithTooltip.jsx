import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import InfoIcon from '@/components/Icons/InfoIcon';

const ICON_SIZE = 16;

const LabelWithTooltip = memo(props => {
  const { tooltip, title = 'Value', fill } = props;

  return (
    <Box
      component="span"
      sx={styles.container}
    >
      {title && <Typography variant="labelMedium">{title}</Typography>}
      {tooltip && (
        <StyledTooltip
          placement="top"
          title={tooltip}
        >
          <Box
            component="span"
            sx={styles.iconWrapper(fill)}
          >
            <InfoIcon
              width={ICON_SIZE}
              height={ICON_SIZE}
            />
          </Box>
        </StyledTooltip>
      )}
    </Box>
  );
});

LabelWithTooltip.displayName = 'LabelWithTooltip';

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '.25rem',
    zIndex: 999,
  },
  iconWrapper: fill => ({
    display: 'inline-flex',
    alignItems: 'center',
    color: ({ palette }) => fill || palette.icon.main,
  }),
};

export default LabelWithTooltip;
