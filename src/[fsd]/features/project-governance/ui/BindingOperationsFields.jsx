import { memo, useCallback } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import BaseCheckbox from '@/[fsd]/shared/ui/checkbox/BaseCheckbox';

// (#7228) The operations an agent identity's approval keeps: the proposal, preset, which the approver may trim (never
// widen: the server refuses an operation that was not proposed). Read stays the floor of every identity.
const BindingOperationsFields = memo(props => {
  const { proposed, kept, onChange, testId = 'governance-binding-operations' } = props;
  const styles = bindingOperationsFieldsStyles();

  const handleToggle = useCallback(
    operation => event =>
      onChange(proposed.filter(item => (item === operation ? event.target.checked : kept.includes(item)))),
    [kept, onChange, proposed],
  );

  return (
    <Box
      sx={styles.root}
      data-testid={testId}
    >
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        What the agent may do on the platform for its users (uncheck what you do not approve)
      </Typography>
      <Box sx={styles.options}>
        {proposed.map(operation => (
          <FormControlLabel
            key={operation}
            label={operation}
            control={
              <BaseCheckbox
                checked={kept.includes(operation)}
                onChange={handleToggle(operation)}
                inputProps={{ 'data-testid': `${testId}-${operation}` }}
              />
            }
          />
        ))}
      </Box>
    </Box>
  );
});

BindingOperationsFields.displayName = 'BindingOperationsFields';

/** @type {MuiSx} */
const bindingOperationsFieldsStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  options: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
});

export default BindingOperationsFields;
