import { memo, useCallback } from 'react';

import { Box } from '@mui/material';

const ProcessStepIcon = memo(props => {
  const { active, index, onSelect, isError } = props;

  const styles = processStepIconStyles(active, isError);

  const onClick = useCallback(() => {
    onSelect(index);
  }, [index, onSelect]);

  return (
    <Box
      sx={styles.outerBox}
      onClick={onClick}
      data-testid={`pipeline-run-details-timeline-step-${index}`}
      data-status={isError ? 'error' : 'completed'}
    >
      <Box sx={styles.innerBox} />
    </Box>
  );
});

ProcessStepIcon.displayName = 'ProcessStepIcon';

/** @type {MuiSx} */
const processStepIconStyles = (active, isError) => ({
  outerBox: ({ palette }) => ({
    width: '1.3125rem',
    height: '1.3125rem',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxSizing: 'border-box',
    border: active ? `0.0625rem solid ${!isError ? palette.status.published : palette.status.rejected}` : 0,
    zIndex: 1,
    '&:hover': {
      width: '1.5rem',
      height: '1.5rem',
    },
  }),
  innerBox: ({ palette }) => ({
    width: '1.25rem',
    height: '1.25rem',
    borderRadius: '50%',
    boxSizing: 'border-box',
    backgroundColor: !isError ? palette.status.published : palette.status.rejected,
    border: `0.1875rem solid ${palette.components.input.border}`,
    zIndex: 1,
    '&:hover': {
      width: '1.4375rem',
      height: '1.4375rem',
    },
  }),
});

export default ProcessStepIcon;
