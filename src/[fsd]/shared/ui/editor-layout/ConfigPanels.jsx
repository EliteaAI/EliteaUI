import { memo } from 'react';

import { Box } from '@mui/material';

const HIDDEN_SCROLLBAR = {
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
  '::-webkit-scrollbar': {
    display: 'none',
  },
};

/**
 * Two configuration columns that scroll on their own, or one shared scrolling column when stacked.
 * Both layouts keep the same element tree, so switching never remounts the sections.
 */
const ConfigPanels = memo(props => {
  const { left, right, isStacked = false, testId = 'config-panels', sx } = props;

  const styles = configPanelsStyles(isStacked);

  return (
    <Box
      sx={[styles.root, sx]}
      data-testid={testId}
      data-stacked={isStacked}
    >
      <Box
        sx={styles.column}
        data-testid={`${testId}-left`}
      >
        {left}
      </Box>
      <Box
        sx={styles.column}
        data-testid={`${testId}-right`}
      >
        {right}
      </Box>
    </Box>
  );
});

ConfigPanels.displayName = 'ConfigPanels';

/** @type {MuiSx} */
const configPanelsStyles = isStacked => ({
  root: {
    display: 'flex',
    flexDirection: isStacked ? 'column' : 'row',
    gap: isStacked ? '1rem' : '2rem',
    height: '100%',
    boxSizing: 'border-box',
    overflowY: isStacked ? 'auto' : 'hidden',
    ...HIDDEN_SCROLLBAR,
  },
  column: {
    flex: isStacked ? 'none' : 1,
    minWidth: 0,
    height: isStacked ? 'auto' : '100%',
    overflowY: isStacked ? 'visible' : 'auto',
    paddingBottom: isStacked ? 0 : '1.25rem',
    boxSizing: 'border-box',
    ...HIDDEN_SCROLLBAR,
  },
});

export default ConfigPanels;
