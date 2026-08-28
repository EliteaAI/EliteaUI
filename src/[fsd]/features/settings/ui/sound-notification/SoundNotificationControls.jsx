import { memo, useCallback } from 'react';

import { Box, Slider, Typography } from '@mui/material';

import { Button, Switch } from '@/[fsd]/shared/ui';

const VOLUME_MARKS = [
  { value: 0, label: '0%' },
  { value: 0.5, label: '50%' },
  { value: 1, label: '100%' },
];

const SoundNotificationControls = memo(props => {
  const { config, setConfig, playCompletionSound } = props;
  const styles = soundNotificationControlsStyles();

  const handleToggle = useCallback((_, checked) => setConfig({ enabled: checked }), [setConfig]);

  const handleVolumeChange = useCallback(
    (_, value) => {
      const normalized = Array.isArray(value) ? value[0] : value;
      setConfig({ volume: Math.max(0, Math.min(1, normalized)) });
    },
    [setConfig],
  );

  return (
    <Box
      sx={styles.content}
      data-testid="sound-notifications-content"
    >
      <Box sx={styles.toggleSection}>
        <Box sx={styles.toggleContent}>
          <Typography
            variant="headingSmall"
            sx={{ color: 'text.secondary' }}
          >
            Sound Notifications
          </Typography>
          <Typography variant="bodySmall">Play sound when tasks complete</Typography>
        </Box>
        {/*
          `data-testid` lands on the MUI SwitchBase span; the hidden checkbox needs
          `slotProps.input` (MUI v7 ignores `inputProps` on Switch), and `BaseSwitch`
          consumes its own `slotProps` and spreads `slotProps.switch` onto the MUI
          Switch -- hence the one extra level.
        */}
        <Switch.BaseSwitch
          checked={config.enabled}
          onChange={handleToggle}
          data-testid="sound-notifications-toggle"
          slotProps={{
            switch: { slotProps: { input: { 'data-testid': 'sound-notifications-toggle-input' } } },
          }}
        />
      </Box>
      {config.enabled && (
        <Box sx={styles.sliderRow}>
          <Typography
            variant="caption"
            sx={styles.sliderLabel}
          >
            Volume
          </Typography>
          <Slider
            value={config.volume}
            min={0}
            max={1}
            step={0.05}
            marks={VOLUME_MARKS}
            onChange={handleVolumeChange}
            valueLabelDisplay="auto"
            valueLabelFormat={v => `${Math.round(v * 100)}%`}
            size="small"
            aria-label="Notification volume"
            sx={styles.slider}
            data-testid="sound-notifications-volume-slider"
            slotProps={{
              input: { 'data-testid': 'sound-notifications-volume-slider-input' },
              thumb: { 'data-testid': 'sound-notifications-volume-slider-thumb' },
            }}
          />
        </Box>
      )}
      {config.enabled && (
        <Box>
          <Button.BaseBtn
            variant="elitea"
            color="secondary"
            onClick={playCompletionSound}
            data-testid="sound-notifications-preview-button"
          >
            Preview Sound
          </Button.BaseBtn>
        </Box>
      )}
    </Box>
  );
});

SoundNotificationControls.displayName = 'SoundNotificationControls';

export { SoundNotificationControls };

/** @type {MuiSx} */
const soundNotificationControlsStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  toggleSection: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    backgroundColor: palette.background.userInputBackground,
    borderRadius: '0.75rem',
  }),
  toggleContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  sliderRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    px: '0.25rem',
    width: '48%',
  },
  sliderLabel: {
    color: 'text.secondary',
  },
  slider: {
    '& .MuiSlider-markLabel': {
      color: 'text.secondary',
    },
    '& .MuiSlider-markLabel[data-index="0"]': {
      transform: 'translateX(0)',
    },
    '& .MuiSlider-markLabel[data-index="2"]': {
      transform: 'translateX(-100%)',
    },
  },
});
