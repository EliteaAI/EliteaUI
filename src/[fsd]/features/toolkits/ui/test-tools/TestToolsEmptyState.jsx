import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { useToolkitToolOptions } from '@/[fsd]/features/toolkits/lib/hooks';
import { Select } from '@/[fsd]/shared/ui/';
import TestIcon from '@/assets/test.svg?react';

const TestToolsEmptyState = memo(props => {
  const { toolkitId, onChangeTool } = props;
  const { allToolsOptions } = useToolkitToolOptions({ toolkitId });
  const styles = getStyles();

  return (
    <Box sx={styles.root}>
      <TestIcon
        width="2rem"
        height="2rem"
      />
      <Box sx={styles.textContainer}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          Test toolkit
        </Typography>
        <Typography
          variant="bodyMedium"
          color="text.primary"
        >
          Choose a tool from the list to configure parameters and run the test.
        </Typography>
      </Box>
      <Select.PopoverSelect
        options={allToolsOptions}
        onValueChange={onChangeTool}
        label="Select Tool"
        placeholder="Search tools..."
        emptyPlaceholder="No tools found"
      />
    </Box>
  );
});

TestToolsEmptyState.displayName = 'TestToolsEmptyState';

export default TestToolsEmptyState;

/** @type {MuiSx} */
const getStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    gap: '1.5rem',
    padding: '3.75rem 0 0 0',
    textAlign: 'center',
    color: ({ palette }) => palette.icon.fill.disabled,
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    maxWidth: '20.5rem',
  },
});
