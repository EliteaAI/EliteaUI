import { memo, useCallback, useMemo } from 'react';

import { Box } from '@mui/material';

import { Checkbox, Input, Slider } from '@/[fsd]/shared/ui';

import { HUMAN_SCALE_KIND, clampHumanScore, getPassFailOptions } from '../../lib/helpers';

// Keeps the label raised so the empty-state placeholder stays visible under it.
const SHRUNK_LABEL = { shrink: true };

const HumanScoreControl = memo(props => {
  const { scale, value, onChange, disabled = false } = props;

  const outcomeItems = useMemo(
    () => getPassFailOptions(scale).map(option => ({ value: String(option.value), label: option.label })),
    [scale],
  );

  const handleSelectOutcome = useCallback(
    next => {
      onChange?.(Number(next));
    },
    [onChange],
  );

  const handleSlider = useCallback(
    (_event, next) => {
      onChange?.(next);
    },
    [onChange],
  );

  const handleNumber = useCallback(
    event => {
      const raw = event.target.value;
      if (raw === '') {
        onChange?.(null);
        return;
      }
      const parsed = Number(raw);
      if (Number.isNaN(parsed)) return;
      onChange?.(parsed);
    },
    [onChange],
  );

  // Typing stays unclamped so a half-entered number is not rewritten under the caret.
  const handleNumberBlur = useCallback(() => {
    if (value == null) return;
    const clamped = clampHumanScore(value, scale);
    if (clamped !== value) onChange?.(clamped);
  }, [value, scale, onChange]);

  const styles = humanScoreControlStyles();

  if (scale.kind === HUMAN_SCALE_KIND.passFail) {
    return (
      <Box
        sx={styles.outcomeRoot}
        data-testid="human-score-pass-fail"
      >
        <Checkbox.RadioButtonGroup
          value={value == null ? '' : String(value)}
          items={outcomeItems}
          onChange={handleSelectOutcome}
          disabled={disabled}
          testId="human-score-outcome"
        />
      </Box>
    );
  }

  return (
    <Box
      sx={styles.numericRoot}
      data-testid="human-score-numeric"
    >
      {/* InputBase's own wrapper is width:100%, so the field is sized from the outside. */}
      <Box sx={styles.numberFieldWrapper}>
        <Input.InputBase
          variant="standard"
          type="number"
          label={scale.label}
          required
          placeholder="—"
          InputLabelProps={SHRUNK_LABEL}
          value={value ?? ''}
          onChange={handleNumber}
          onBlur={handleNumberBlur}
          disabled={disabled}
          showCopyAction={false}
          showFullScreenAction={false}
          showExpandAction={false}
          inputProps={{ min: scale.min, max: scale.max, step: scale.step }}
          sx={styles.numberField}
          data-testid="human-score-value"
        />
      </Box>
      {/* The unscored styling is applied from here so DiscreteSlider keeps its own sx. */}
      <Box sx={[styles.sliderSlot, value == null && styles.sliderUnset]}>
        <Slider.DiscreteSlider
          value={value ?? scale.min}
          min={scale.min}
          max={scale.max}
          marks={scale.marks}
          onChange={handleSlider}
          disabled={disabled}
          testId="human-score-slider"
          markTestIdPrefix="human-score-mark"
        />
      </Box>
    </Box>
  );
});

HumanScoreControl.displayName = 'HumanScoreControl';

/** @type {MuiSx} */
const humanScoreControlStyles = () => ({
  outcomeRoot: {
    display: 'flex',
    alignItems: 'center',
    minWidth: '14rem',
  },
  numericRoot: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    flex: 1,
    minWidth: 0,
  },
  numberFieldWrapper: {
    display: 'flex',
    width: '5rem',
    flexShrink: 0,
  },
  numberField: {
    '& input[type=number]': {
      MozAppearance: 'textfield',
    },
    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
  },
  sliderSlot: {
    display: 'flex',
    flex: 1,
    minWidth: '12rem',
  },
  // Unscored, the thumb would park on the minimum and read as a real score.
  sliderUnset: {
    '& .MuiSlider-thumb, & .MuiSlider-track': {
      opacity: 0,
    },
  },
});

export default HumanScoreControl;
