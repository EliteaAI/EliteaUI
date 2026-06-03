import { memo, useCallback } from 'react';

import { DEFAULT_TEMPERATURE } from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import DiscreteSlider from '@/[fsd]/shared/ui/slider/DiscreteSlider';

/**
 * Creativity Slider Component
 * Maps temperature values to 5 discrete creativity levels (1-5)
 * Temperature mapping: 1→0.2, 2→0.4, 3→0.6, 4→0.8, 5→1.0
 */

const CREATIVITY_LEVELS = {
  1: { temperature: 0.2, label: 'Low' },
  2: { temperature: 0.4, label: 'Mid-Low' },
  3: { temperature: 0.6, label: 'Medium' },
  4: { temperature: 0.8, label: 'Mid-High' },
  5: { temperature: 1.0, label: 'High' },
};

// Convert temperature to creativity level (1-5)
const temperatureToCreativity = temperature => {
  if (temperature <= 0.2) return 1;
  if (temperature <= 0.4) return 2;
  if (temperature <= 0.6) return 3;
  if (temperature <= 0.8) return 4;
  return 5;
};

const CreativitySlider = memo(props => {
  const { temperature = DEFAULT_TEMPERATURE, onChange } = props;

  const creativity = temperatureToCreativity(temperature);

  const handleChange = useCallback(
    (event, newValue) => {
      const newTemperature = CREATIVITY_LEVELS[newValue].temperature;
      if (onChange) {
        onChange(newTemperature);
      }
    },
    [onChange],
  );

  const tooltipFormatter = useCallback(value => {
    return `${CREATIVITY_LEVELS[value].label} (${CREATIVITY_LEVELS[value].temperature})`;
  }, []);

  return (
    <DiscreteSlider
      label="Creativity"
      value={creativity}
      onChange={handleChange}
      min={1}
      max={5}
      levels={CREATIVITY_LEVELS}
      tooltipFormatter={tooltipFormatter}
      labelTooltip="Controls response randomness and creativity. Lower values produce more focused and deterministic outputs, while higher values generate more diverse and creative responses."
      aria-label="Creativity level"
    />
  );
});

CreativitySlider.displayName = 'CreativitySlider';

export default CreativitySlider;
