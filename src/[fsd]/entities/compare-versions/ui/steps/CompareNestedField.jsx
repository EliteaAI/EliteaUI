import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { TextDiffHighlight } from '@/[fsd]/entities/edit-entity-with-ai';

// One field of a sub-agent on both sides, as two read-only texts with the differences marked
const CompareNestedField = memo(props => {
  const { label, leftText, rightText } = props;
  const styles = compareNestedFieldStyles;

  return (
    <Box sx={styles.field}>
      <Typography variant="labelSmall">{label}</Typography>
      <Box sx={styles.columns}>
        <Box sx={styles.card}>
          <TextDiffHighlight
            original={rightText}
            modified={leftText}
            mode="modified"
          />
        </Box>
        <Box sx={styles.card}>
          <TextDiffHighlight
            original={leftText}
            modified={rightText}
            mode="modified"
          />
        </Box>
      </Box>
    </Box>
  );
});

CompareNestedField.displayName = 'CompareNestedField';

/** @type {MuiSx} */
const compareNestedFieldStyles = {
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  columns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  card: ({ palette }) => ({
    padding: '0.5rem 1rem',
    minHeight: '2.5rem',
    maxHeight: '12rem',
    overflowY: 'auto',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
};

export default CompareNestedField;
