import { memo, useCallback } from 'react';

import { Box } from '@mui/material';

import { Label } from '@/[fsd]/shared/ui';
import StyledInputEnhancer from '@/[fsd]/shared/ui/input/StyledInputEnhancer';
import { MAX_STEP_LIMIT, MIN_STEP_LIMIT } from '@/common/constants';
import { parseValueToIntNumber } from '@/common/utils';

const StepsLimitInput = memo(props => {
  const { value, onChange } = props;

  const handleInput = useCallback(
    event => {
      if (event?.preventDefault) {
        event.preventDefault();
      }
      const raw = event?.target?.value ?? event;
      const parsed = parseValueToIntNumber(raw);
      if (parsed === '' || parsed === null || parsed === undefined) return;
      const clamped = Math.min(Math.max(parsed, MIN_STEP_LIMIT), MAX_STEP_LIMIT);
      onChange?.(clamped);
    },
    [onChange],
  );

  return (
    <Box sx={styles.container}>
      <Label.InfoLabelWithTooltip
        label="Steps Limit"
        tooltip="The maximum number of steps to take before ending the execution loop (tools call limit)."
        variant="subtitle"
        sx={styles.label}
      />
      <StyledInputEnhancer
        onInput={handleInput}
        value={value ?? ''}
        id="steps_limit"
        type="number"
        variant="standard"
        placeholder="Enter steps limit"
        fullWidth
        inputProps={{ min: MIN_STEP_LIMIT, max: MAX_STEP_LIMIT }}
        sx={styles.formInput}
      />
    </Box>
  );
});

StepsLimitInput.displayName = 'StepsLimitInput';

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '1rem',
  },
  label: ({ palette }) => ({
    color: palette.text.primary,
    fontSize: '0.75rem',
    lineHeight: '0.9375rem',
    textTransform: 'uppercase',
    paddingLeft: '0.5rem',
  }),
  formInput: {
    padding: '0rem',
    margin: '0rem',
  },
};

export default StepsLimitInput;
