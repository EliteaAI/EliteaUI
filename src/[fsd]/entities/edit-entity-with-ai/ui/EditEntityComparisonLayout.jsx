import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const EditEntityComparisonLayout = memo(props => {
  const { currentLabel = 'CURRENT', suggestedLabel = 'SUGGESTED', currentContent, suggestedContent } = props;

  return (
    <Box sx={styles.container}>
      <Box sx={styles.headerRow}>
        <Box sx={styles.headerCell}>
          <Typography sx={styles.headerText}>{currentLabel}</Typography>
        </Box>
        <Box sx={styles.headerCell}>
          <Typography sx={styles.headerText}>{suggestedLabel}</Typography>
        </Box>
      </Box>
      <Box sx={styles.scrollable}>
        <Box sx={styles.columnsRow}>
          <Box sx={styles.column}>{currentContent}</Box>
          <Box sx={styles.column}>{suggestedContent}</Box>
        </Box>
      </Box>
    </Box>
  );
});

EditEntityComparisonLayout.displayName = 'EditEntityComparisonLayout';

/** @type {MuiSx} */
const styles = {
  container: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    flex: 1,
    minHeight: 0,
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: '50%',
      width: '0.0625rem',
      backgroundColor: palette.border.lines,
      pointerEvents: 'none',
      zIndex: 1,
    },
  }),
  headerRow: ({ palette }) => ({
    display: 'flex',
    flexShrink: 0,
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  headerCell: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.75rem 1.5rem',
  },
  headerText: {
    flex: 1,
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    letterSpacing: '0.045rem',
    textTransform: 'uppercase',
    textAlign: 'center',
    color: 'text.primary',
  },
  scrollable: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
  },
  columnsRow: {
    display: 'flex',
    marginBottom: '1rem',
  },
  column: {
    flex: 1,
    minWidth: 0,
  },
};

export default EditEntityComparisonLayout;
