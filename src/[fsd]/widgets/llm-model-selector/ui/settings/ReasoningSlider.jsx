import { memo, useCallback } from 'react';

import {
  DEFAULT_REASONING_EFFORT,
  REASONING_EFFORT_VALUES,
} from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import DiscreteSlider from '@/[fsd]/shared/ui/slider/DiscreteSlider';

/**
 * Reasoning Slider Component
 * Maps reasoning effort values to 3 discrete levels (1-3)
 * Handles conversion between string values ('Low', 'Medium', 'High') and numeric slider positions
 */

const REASONING_LEVELS = {
  1: {
    value: REASONING_EFFORT_VALUES.Low,
    label: REASONING_EFFORT_VALUES.Low,
    tooltip: 'Fast, surface-level reasoning — concise answers with minimal steps.',
  },
  2: {
    value: REASONING_EFFORT_VALUES.Medium,
    label: REASONING_EFFORT_VALUES.Medium,
    tooltip: 'Balanced reasoning — clear explanations with moderate multi-step thinking.',
  },
  3: {
    value: REASONING_EFFORT_VALUES.High,
    label: REASONING_EFFORT_VALUES.High,
    tooltip: 'Deep, thorough reasoning — detailed step-by-step analysis (may be slower).',
  },
};

// Convert string value to numeric position
const valueToPosition = value => {
  const normalizedValue = value?.toLowerCase();
  if (normalizedValue === REASONING_EFFORT_VALUES.Low.toLowerCase()) return 1;
  if (normalizedValue === REASONING_EFFORT_VALUES.High.toLowerCase()) return 3;
  return 2; // Default to Medium
};

// Convert numeric position to string value
const positionToValue = position => {
  return REASONING_LEVELS[position]?.value || DEFAULT_REASONING_EFFORT;
};

const ReasoningSlider = memo(props => {
  const { value, onChange, disabled = false } = props;

  const numericValue = valueToPosition(value);

  const handleChange = useCallback(
    (event, position) => {
      const stringValue = positionToValue(position);
      onChange?.(stringValue);
    },
    [onChange],
  );

  const tooltipFormatter = useCallback(val => {
    return REASONING_LEVELS[val]?.tooltip || REASONING_LEVELS[2].tooltip;
  }, []);

  return (
    <DiscreteSlider
      label="Reasoning"
      value={numericValue}
      onChange={handleChange}
      min={1}
      max={3}
      levels={REASONING_LEVELS}
      tooltipFormatter={tooltipFormatter}
      disabled={disabled}
      labelTooltip="Controls the depth of logical thinking and problem-solving."
      showLabels
      aria-label="Reasoning level"
    />
  );
});

ReasoningSlider.displayName = 'ReasoningSlider';

export default ReasoningSlider;
