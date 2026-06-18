import { memo } from 'react';

import { Box } from '@mui/material';

const SoonLabel = memo(({ text, sx }) => (
  <Box sx={[styles.root, sx]}>
    <Box component="span">{text}</Box>
    <Box
      component="span"
      sx={styles.chip}
    >
      Soon
    </Box>
  </Box>
));

SoonLabel.displayName = 'SoonLabel';

/** @type {MuiSx} */
const styles = {
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: '0.5rem',
  },
  chip: ({ palette }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    padding: '0.0625rem 0.5rem',
    borderRadius: '6.25rem',
    border: `1px solid ${palette.border.lines}`,
    color: palette.text.secondary,
    fontSize: '0.6875rem',
    lineHeight: '1rem',
    fontWeight: 500,
  }),
};

export default SoonLabel;
