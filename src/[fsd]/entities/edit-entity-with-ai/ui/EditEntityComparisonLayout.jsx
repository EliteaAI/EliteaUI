import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const EditEntityComparisonLayout = memo(props => {
  const { currentLabel = 'CURRENT', suggestedLabel = 'SUGGESTED', currentContent, suggestedContent } = props;

  return (
    <Box sx={styles.container}>
      <Box sx={styles.column}>
        <Box sx={styles.columnHeaderBar}>
          <Typography sx={styles.columnHeaderText}>{currentLabel}</Typography>
        </Box>
        <Box sx={styles.columnContent}>{currentContent}</Box>
      </Box>
      <Box sx={[styles.column, styles.suggestedColumn]}>
        <Box sx={styles.columnHeaderBar}>
          <Typography sx={styles.columnHeaderText}>{suggestedLabel}</Typography>
        </Box>
        <Box sx={styles.columnContent}>{suggestedContent}</Box>
      </Box>
    </Box>
  );
});

EditEntityComparisonLayout.displayName = 'EditEntityComparisonLayout';

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'flex',
    width: '100%',
    flex: 1,
    minHeight: 0,
  },
  column: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  suggestedColumn: ({ palette }) => ({
    borderLeft: `0.0625rem solid ${palette.border.lines}`,
  }),
  columnHeaderBar: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.75rem 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  columnHeaderText: {
    flex: 1,
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    letterSpacing: '0.045rem',
    textTransform: 'uppercase',
    textAlign: 'center',
    color: 'text.primary',
  },
  columnContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
};

export default EditEntityComparisonLayout;
