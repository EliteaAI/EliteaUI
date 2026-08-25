import { memo } from 'react';

import { Box, Typography, alpha } from '@mui/material';

const CompareVersionsStepIndicator = memo(props => {
  const { steps, activeStepIndex, onStepChange } = props;

  const activeStep = steps[activeStepIndex];

  return (
    <Box sx={styles.container}>
      <Typography sx={styles.title}>{`${activeStepIndex + 1}. ${activeStep?.label}`}</Typography>
      <Box sx={styles.progressBar}>
        {steps.map((step, index) => (
          <Box
            key={step.key}
            onClick={() => onStepChange(index)}
            sx={[
              index <= activeStepIndex ? styles.segmentActive : styles.segmentInactive,
              styles.segmentClickable,
            ]}
          />
        ))}
      </Box>
    </Box>
  );
});

CompareVersionsStepIndicator.displayName = 'CompareVersionsStepIndicator';

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
    backgroundColor: palette.primary.main,
  }),
  segmentInactive: ({ palette }) => ({
    width: '1.5rem',
    height: '0.125rem',
    borderRadius: '0.25rem',
    backgroundColor: alpha(palette.primary.main, 0.3),
  }),
  segmentClickable: {
    cursor: 'pointer',
  },
};

export default CompareVersionsStepIndicator;
