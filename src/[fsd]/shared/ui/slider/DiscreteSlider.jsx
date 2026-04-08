import { memo, useCallback } from 'react';

import { Box, Slider, Tooltip, Typography } from '@mui/material';

import { Label } from '@/[fsd]/shared/ui';

const DiscreteSlider = memo(props => {
  const {
    label,
    value,
    onChange,
    levels,
    tooltipFormatter,
    labelTooltip,
    disabled = false,
    min = 1,
    max,
    showLabels = false,
    ...sliderProps
  } = props;

  const marks = Array.from({ length: max - min + 1 }, (_, i) => ({
    value: min + i,
    label: String(min + i),
  }));

  const handleMarkClick = useCallback(
    markValue => () => {
      if (!disabled && onChange) {
        onChange(null, markValue);
      }
    },
    [disabled, onChange],
  );

  return (
    <Box sx={styles.container}>
      <Label.InfoLabelWithTooltip
        label={label}
        tooltip={labelTooltip || (tooltipFormatter ? tooltipFormatter(value, disabled) : '')}
        variant="bodyMedium"
        sx={disabled ? styles.labelDisabled : styles.label}
      />

      <Box sx={styles.sliderContainer}>
        <Box sx={styles.labelsRow}>
          {marks.map(mark => (
            <Typography
              key={mark.value}
              variant="bodySmall"
              sx={
                disabled
                  ? styles.labelDisabled
                  : value === mark.value
                    ? styles.labelActive
                    : styles.labelInactive
              }
            >
              {showLabels ? levels[mark.value]?.label || mark.label : mark.label}
            </Typography>
          ))}
        </Box>

        <Box sx={styles.sliderWrapper}>
          <Slider
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            step={1}
            marks={marks.map(m => ({ value: m.value }))}
            disabled={disabled}
            sx={styles.slider}
            {...sliderProps}
          />

          {/* Invisible tooltip triggers positioned over marks */}
          <Box sx={styles.markTooltipsContainer}>
            {marks.map(mark => {
              const tooltipTitle = tooltipFormatter
                ? tooltipFormatter(mark.value, disabled)
                : levels[mark.value]?.label || '';

              const position = ((mark.value - min) / (max - min)) * 100;
              const isCurrentValue = mark.value === value;

              return (
                <Tooltip
                  key={`mark-${mark.value}`}
                  title={tooltipTitle}
                  placement="bottom"
                >
                  <Box
                    onClick={handleMarkClick(mark.value)}
                    sx={{
                      ...styles.markTooltipTrigger,
                      left: `${position}%`,
                      // Hide trigger at current value to allow thumb dragging
                      pointerEvents: isCurrentValue ? 'none' : 'auto',
                    }}
                  />
                </Tooltip>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

DiscreteSlider.displayName = 'DiscreteSlider';

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    width: '100%',
    padding: '0 0.5rem',
  },
  label: ({ palette }) => ({
    color: palette.text.primary,
  }),
  labelDisabled: ({ palette }) => ({
    color: palette.text.disabled,
    opacity: 0.5,
  }),
  sliderContainer: {
    display: 'flex',
    flexDirection: 'column',
    // gap: '0.4rem',
    width: '100%',
  },
  sliderWrapper: {
    position: 'relative',
    width: '100%',
  },
  markTooltipsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  markTooltipTrigger: {
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: '1rem',
    height: '1rem',
    pointerEvents: 'auto',
    cursor: 'pointer',
    zIndex: 2,
  },
  labelsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingBottom: '0.125rem',
  },
  labelActive: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 500,
    textTransform: 'capitalize',
  }),
  labelInactive: ({ palette }) => ({
    color: palette.text.primary,
    textTransform: 'capitalize',
  }),
  slider: ({ palette }) => ({
    color: palette.text.primary,
    height: '0.25rem',
    padding: 0,
    '&.Mui-disabled': {
      color: palette.text.disabled,
      opacity: 0.5,
      '& .MuiSlider-thumb': {
        color: palette.text.secondary,
        opacity: 0.9,
      },
    },
    '& .MuiSlider-rail': {
      height: '0.25rem',
      backgroundColor: palette.border.lines,
      opacity: 1,
    },
    '& .MuiSlider-track': {
      height: '0.25rem',
      border: 'none',
      borderRadius: 0,
    },
    '& .MuiSlider-thumb': {
      width: '1.25rem',
      height: '1.25rem',
    },
    '& .MuiSlider-mark': {
      width: '0.5rem',
      height: '0.5rem',
      borderRadius: '50%',
      backgroundColor: palette.secondary.main,
      opacity: 1,
      transform: 'translate(-50%, -50%)',
      top: '50%',
      '&.MuiSlider-markActive': {
        backgroundColor: palette.text.primary,
      },
    },
  }),
};

export default DiscreteSlider;
