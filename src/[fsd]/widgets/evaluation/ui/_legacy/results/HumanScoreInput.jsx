import { memo, useCallback, useMemo } from 'react';

import { Box, Slider, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

import { Input } from '@/[fsd]/shared/ui';

import { EVAL_SCALE_TYPE } from '../../../lib/constants';

// Score input that adapts to the dimension's scale (§15): binary renders a
// Pass/Fail toggle, ordinal a segmented button row, continuous a slider paired
// with a numeric field. `value` is the native score (or null when unscored).
const HumanScoreInput = memo(props => {
  const { scaleType, scaleMin = 0, scaleMax = 100, value, onChange, disabled = false } = props;

  const min = Number(scaleMin);
  const max = Number(scaleMax);

  const ordinalOptions = useMemo(() => {
    if (scaleType !== EVAL_SCALE_TYPE.ordinal) return [];
    const options = [];
    for (let i = min; i <= max; i += 1) options.push(i);
    return options;
  }, [scaleType, min, max]);

  const handleToggle = useCallback(
    (_event, next) => {
      if (next != null) onChange?.(next);
    },
    [onChange],
  );

  const handleSlider = useCallback((_event, next) => onChange?.(next), [onChange]);

  const handleNumber = useCallback(
    event => {
      const raw = event.target.value;
      if (raw === '') {
        onChange?.(null);
        return;
      }
      const parsed = Number(raw);
      if (!Number.isNaN(parsed)) onChange?.(Math.min(max, Math.max(min, parsed)));
    },
    [onChange, min, max],
  );

  const styles = humanScoreInputStyles();

  if (scaleType === EVAL_SCALE_TYPE.binary) {
    return (
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value ?? null}
        onChange={handleToggle}
        disabled={disabled}
        data-testid="evaluation-human-score-binary"
      >
        <ToggleButton value={min}>Fail</ToggleButton>
        <ToggleButton value={max}>Pass</ToggleButton>
      </ToggleButtonGroup>
    );
  }

  if (scaleType === EVAL_SCALE_TYPE.ordinal) {
    return (
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value ?? null}
        onChange={handleToggle}
        disabled={disabled}
        data-testid="evaluation-human-score-ordinal"
      >
        {ordinalOptions.map(option => (
          <ToggleButton
            key={option}
            value={option}
          >
            {option}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );
  }

  return (
    <Box
      sx={styles.continuousRow}
      data-testid="evaluation-human-score-continuous"
    >
      <Slider
        value={typeof value === 'number' ? value : min}
        min={min}
        max={max}
        onChange={handleSlider}
        disabled={disabled}
        sx={styles.slider}
      />
      <Input.InputBase
        variant="standard"
        type="number"
        value={value ?? ''}
        onChange={handleNumber}
        disabled={disabled}
        inputProps={{ min, max }}
        sx={styles.number}
      />
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        / {max}
      </Typography>
    </Box>
  );
});

HumanScoreInput.displayName = 'HumanScoreInput';

/** @type {MuiSx} */
const humanScoreInputStyles = () => ({
  continuousRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  slider: {
    flex: 1,
    minWidth: '8rem',
  },
  number: {
    width: '4.5rem',
  },
});

export default HumanScoreInput;
