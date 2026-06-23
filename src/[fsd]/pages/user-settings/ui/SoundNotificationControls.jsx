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
    <Box sx={styles.content}>
      <Switch.BaseSwitch
        checked={config.enabled}
        onChange={handleToggle}
        label="Play sound when tasks complete"
      />
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
          />
        </Box>
      )}
      {config.enabled && (
        <Box>
          <Button.BaseBtn
            variant="elitea"
            color="secondary"
            onClick={playCompletionSound}
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
  sliderRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    px: '0.25rem',
  },
  sliderLabel: {
    color: 'text.secondary',
  },
});
