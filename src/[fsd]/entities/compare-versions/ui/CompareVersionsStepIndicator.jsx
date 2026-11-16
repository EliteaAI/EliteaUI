import { memo } from 'react';

import { Box, Typography, alpha } from '@mui/material';

const CompareVersionsStepIndicator = memo(props => {
  const { steps, activeStepIndex, onStepChange } = props;

  const activeStep = steps[activeStepIndex];

  return (
    <Box sx={compareVersionsStepIndicatorStyles.container}>
      <Typography
        variant="headingMedium"
        color="text.secondary"
      >{`${activeStepIndex + 1}. ${activeStep?.label}`}</Typography>
      <Box sx={compareVersionsStepIndicatorStyles.progressBar}>
        {steps.map((step, index) => (
          <Box
            key={step.key}
            component="button"
            type="button"
            aria-label={`Step ${index + 1}: ${step.label}`}
            aria-current={index === activeStepIndex ? 'step' : undefined}
            data-testid={`compare-step-${step.key}`}
            onClick={() => onStepChange(index)}
            sx={[
              index <= activeStepIndex
                ? compareVersionsStepIndicatorStyles.segmentActive
                : compareVersionsStepIndicatorStyles.segmentInactive,
              compareVersionsStepIndicatorStyles.segmentClickable,
            ]}
          />
        ))}
      </Box>
    </Box>
  );
});

CompareVersionsStepIndicator.displayName = 'CompareVersionsStepIndicator';

/** @type {MuiSx} */
const compareVersionsStepIndicatorStyles = {
  container: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem 1rem',
    width: '100%',
    boxSizing: 'border-box',
    background: palette.background.default.primary,
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
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
  segmentClickable: ({ palette }) => ({
    cursor: 'pointer',
    border: 'none',
    padding: 0,
    '&:focus-visible': {
      outline: `0.125rem solid ${palette.primary.main}`,
      outlineOffset: '0.125rem',
    },
  }),
};

export default CompareVersionsStepIndicator;
