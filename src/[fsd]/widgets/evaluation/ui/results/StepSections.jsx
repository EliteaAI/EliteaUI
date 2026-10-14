import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { formatCaseContent, getTrajectoryStepSections } from '../../lib/helpers';

/** The payload sections of one trajectory step (inputs, output, error), as preformatted text. */
const StepSections = memo(props => {
  const { step, outputsStored } = props;
  const sections = getTrajectoryStepSections(step, { outputsStored });
  const styles = stepSectionsStyles();
  if (!sections.length) {
    return (
      <Typography
        variant="bodySmall"
        sx={styles.emptyText}
      >
        No payload recorded for this step.
      </Typography>
    );
  }
  return sections.map(({ label, content }) => (
    <Box
      key={label}
      sx={styles.section}
    >
      <Typography
        variant="labelSmall"
        sx={styles.metricLabel}
      >
        {label}
      </Typography>
      <Typography
        variant="bodySmall"
        component="pre"
        sx={styles.pre}
      >
        {formatCaseContent(content)}
      </Typography>
    </Box>
  ));
});

StepSections.displayName = 'StepSections';

/** @type {MuiSx} */
const stepSectionsStyles = () => ({
  metricLabel: ({ palette }) => ({
    color: palette.text.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }),
  section: {
    marginBottom: '0.75rem',
  },
  pre: ({ palette }) => ({
    color: palette.text.secondary,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
    fontFamily: 'inherit',
    fontSize: '0.875rem',
    lineHeight: 1.5,
  }),
  emptyText: ({ palette }) => ({
    color: palette.text.primary,
    fontStyle: 'italic',
  }),
});

export default StepSections;
