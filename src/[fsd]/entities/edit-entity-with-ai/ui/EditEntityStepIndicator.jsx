import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const EditEntityStepIndicator = memo(props => {
  const { steps, activeStepIndex } = props;

  const activeStep = steps[activeStepIndex];

  return (
    <Box sx={styles.container}>
      <Typography sx={styles.title}>{`${activeStepIndex + 1}. ${activeStep?.label}`}</Typography>
      <Box sx={styles.progressBar}>
        {steps.map((step, index) => (
          <Box
            key={step.key}
            sx={index === activeStepIndex ? styles.segmentActive : styles.segmentInactive}
          />
        ))}
      </Box>
    </Box>
  );
});

EditEntityStepIndicator.displayName = 'EditEntityStepIndicator';

/** @type {MuiSx} */
const styles = {
  container: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem 1rem',
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: palette.background.default,
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  title: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: '1.5rem',
    color: 'text.secondary',
  },
  progressBar: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  segmentActive: ({ palette }) => ({
    width: '1.5rem',
    height: '0.25rem',
    borderRadius: '0.25rem',
    backgroundColor: palette.primary.hover,
  }),
  segmentInactive: {
    width: '1.5rem',
    height: '0.125rem',
    borderRadius: '0.25rem',
    backgroundColor: 'rgba(106, 232, 250, 0.3)',
  },
};

export default EditEntityStepIndicator;
