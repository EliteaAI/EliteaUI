import { memo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

// One labelled line of the editor schedule card: the value truncates and shows its full text in a tooltip
// on hover and on keyboard focus (R2.4); the label stays whole, as on the toolkit Schedule card
const EntityScheduleCardLine = memo(props => {
  const { label, area, testId, isTitle, text, chip } = props;
  const styles = entityScheduleCardLineStyles();

  return (
    <Box sx={[styles.row, { gridArea: area }, chip && styles.wrapChip]}>
      {label && (
        <Typography
          variant="bodySmall2"
          component="span"
          color="text.primary"
          sx={styles.label}
        >
          {`${label}: `}
        </Typography>
      )}
      <Tooltip
        title={text}
        placement="top"
      >
        <Typography
          variant={isTitle ? 'labelMedium' : 'bodySmall2'}
          component="span"
          color="text.secondary"
          tabIndex={0}
          sx={styles.value}
          data-testid={testId}
        >
          {text}
        </Typography>
      </Tooltip>
      {chip}
    </Box>
  );
});

EntityScheduleCardLine.displayName = 'EntityScheduleCardLine';

/** @type {MuiSx} */
const entityScheduleCardLineStyles = () => ({
  row: {
    display: 'flex',
    alignItems: 'center',
    columnGap: '0.5rem',
    minWidth: 0,
  },
  // The status chip drops below the date when the line has no room
  wrapChip: { flexWrap: 'wrap' },
  label: { flexShrink: 0, minWidth: '4.5rem' },
  value: {
    minWidth: 0,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

export default EntityScheduleCardLine;
