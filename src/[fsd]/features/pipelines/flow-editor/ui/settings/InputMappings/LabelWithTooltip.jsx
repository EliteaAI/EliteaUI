import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';

const LabelWithTooltip = memo(props => {
  const { tooltip, title = 'Value', fill } = props;

  return (
    <Box
      component="span"
      sx={styles.container}
    >
      {title && <Typography variant="labelMedium">{title}</Typography>}
      {tooltip && (
        <InfoTooltip
          infoTooltip={{ title: tooltip, icon: { fill } }}
          sx={styles.iconWrapper}
        />
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
  iconWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    position: 'static',
    bottom: 0,
  },
};

export default LabelWithTooltip;
