import { memo, useCallback, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { LLMSettingsConstants } from '@/[fsd]/shared/lib/constants';
import { getReasoningCapability } from '@/[fsd]/shared/lib/utils';
import { Button, Label } from '@/[fsd]/shared/ui';
import DiscreteSlider from '@/[fsd]/shared/ui/slider/DiscreteSlider';

const { REASONING_EFFORT_LABELS, REASONING_EFFORT_OFF, REASONING_EFFORT_TOOLTIPS, REASONING_HELPER_TEXTS } =
  LLMSettingsConstants;

const FIRST_POSITION = 1;
const LABEL_TOOLTIP =
  'Controls the depth of logical thinking and problem-solving. Only the levels this model supports are offered.';

const labelOf = level => REASONING_EFFORT_LABELS[level] || level;

const positionOf = (levels, level) => {
  const index = levels.indexOf(String(level ?? '').toLowerCase());
  return index === -1 ? null : FIRST_POSITION + index;
};

/**
 * One slider position per effort level the model offers (#6819). Rows without stored levels
 * fall back to Low / Medium / High. `none` renders as Off. A single-level model shows its
 * level read-only, and a saved level the model no longer offers can be replaced in one click.
 */
const ReasoningSlider = memo(props => {
  const { value, onChange, disabled = false, capability: capabilityProp } = props;
  const capability = capabilityProp ?? getReasoningCapability({ supports_reasoning: true });
  const { levels, defaultLevel, alwaysOn, isBudget } = capability;
  const styles = reasoningSliderStyles();

  const sliderLevels = useMemo(
    () =>
      Object.fromEntries(
        levels.map((level, index) => [
          FIRST_POSITION + index,
          { value: level, label: labelOf(level), tooltip: REASONING_EFFORT_TOOLTIPS[level] },
        ]),
      ),
    [levels],
  );

  const storedPosition = positionOf(levels, value);
  const isStoredUnsupported = Boolean(value) && storedPosition === null;
  const isSingleLevel = levels.length === 1;
  const replacementLevel = isSingleLevel ? levels[0] : defaultLevel;
  const numericValue = storedPosition ?? positionOf(levels, defaultLevel) ?? FIRST_POSITION;

  const handleChange = useCallback(
    (event, position) => {
      const level = sliderLevels[position]?.value ?? defaultLevel;
      onChange?.(level);
    },
    [defaultLevel, onChange, sliderLevels],
  );

  const onUseReplacement = useCallback(() => onChange?.(replacementLevel), [onChange, replacementLevel]);

  const tooltipFormatter = useCallback(
    position => sliderLevels[position]?.tooltip || sliderLevels[numericValue]?.tooltip || '',
    [numericValue, sliderLevels],
  );

  const helperText = isStoredUnsupported
    ? REASONING_HELPER_TEXTS.unsupportedStored(value)
    : isSingleLevel
      ? REASONING_HELPER_TEXTS.fixedLevel(labelOf(levels[0]))
      : String(value).toLowerCase() === REASONING_EFFORT_OFF
        ? REASONING_HELPER_TEXTS.off
        : alwaysOn
          ? REASONING_HELPER_TEXTS.alwaysOn
          : isBudget
            ? REASONING_HELPER_TEXTS.budget
            : '';

  return (
    <Box sx={styles.root}>
      {isSingleLevel ? (
        <Box sx={styles.fixed}>
          <Label.InfoLabelWithTooltip
            label="Reasoning"
            tooltip={LABEL_TOOLTIP}
            variant="subtitle"
          />
          <Typography
            variant="bodyMedium"
            data-testid="model-settings-reasoning-fixed"
          >
            {labelOf(levels[0])}
          </Typography>
        </Box>
      ) : (
        <DiscreteSlider
          testId="model-settings-reasoning-slider"
          markTestIdPrefix="model-settings-reasoning-level"
          label="Reasoning"
          value={numericValue}
          onChange={handleChange}
          min={FIRST_POSITION}
          max={FIRST_POSITION + levels.length - 1}
          levels={sliderLevels}
          tooltipFormatter={tooltipFormatter}
          disabled={disabled}
          labelTooltip={LABEL_TOOLTIP}
          showLabels
          aria-label="Reasoning level"
        />
      )}
      {helperText && (
        <Typography
          variant="bodySmall"
          sx={isStoredUnsupported ? styles.warning : styles.helper}
          data-testid="model-settings-reasoning-helper"
        >
          {helperText}
        </Typography>
      )}
      {isStoredUnsupported && !disabled && (
        <Button.BaseBtn
          variant={Button.BUTTON_VARIANTS.secondary}
          onClick={onUseReplacement}
          data-testid="model-settings-reasoning-use-level"
          sx={styles.replaceWithLevel}
        >
          {REASONING_HELPER_TEXTS.replaceWithLevel(labelOf(replacementLevel))}
        </Button.BaseBtn>
      )}
    </Box>
  );
});

ReasoningSlider.displayName = 'ReasoningSlider';

/** @type {MuiSx} */
const reasoningSliderStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    alignItems: 'flex-start',
  },
  fixed: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    width: '100%',
  },
  helper: ({ palette }) => ({
    color: palette.text.primary,
  }),
  warning: ({ palette }) => ({
    color: palette.text.attention,
  }),
  replaceWithLevel: {
    marginTop: '0.25rem',
  },
});

export default ReasoningSlider;
