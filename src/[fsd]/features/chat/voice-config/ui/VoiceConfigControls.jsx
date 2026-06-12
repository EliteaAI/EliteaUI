import { memo, useCallback, useMemo } from 'react';

import { Box, Slider, Typography } from '@mui/material';

import { useTextToSpeech } from '@/[fsd]/features/chat/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import SingleSelect from '@/[fsd]/shared/ui/select/SingleSelect';

import * as VoiceConstants from '../constants/voice.constants';

const { VOICE_PREVIEW_TEXT, VOICE_SPEED_MARKS, VOICE_VOLUME_MARKS } = VoiceConstants;

const VoiceConfigControls = memo(props => {
  const { config, onConfigChange, hasModelTTS, ttsModel, socket, browserVoices, voices, isPlaying } = props;
  const styles = voiceConfigControlsStyles();

  const previewVoiceConfig = useMemo(
    () => ({
      voice: browserVoices.find(v => v.name === config?.voiceName) ?? browserVoices[0] ?? null,
      voiceId: config?.voiceId || undefined,
      rate: config?.rate ?? 1.0,
      volume: config?.volume ?? 1.0,
    }),
    [config, browserVoices],
  );

  const { speak: previewSpeak, isPlaying: isPreviewPlaying } = useTextToSpeech({
    ttsModel: hasModelTTS ? ttsModel : null,
    socket,
    voiceConfig: previewVoiceConfig,
  });

  const voiceOptions = (voices ?? []).map(v =>
    hasModelTTS
      ? { value: v.id, label: v.name }
      : { value: v.name, label: `${v.name}${v.localService ? '' : ' (online)'}` },
  );

  const selectedVoiceValue = hasModelTTS ? (config?.voiceId ?? '') : (config?.voiceName ?? '');

  const handleVoiceChange = useCallback(
    value => {
      if (hasModelTTS) {
        onConfigChange({ voiceId: value || null, voiceName: null });
      } else {
        onConfigChange({ voiceName: value || null, voiceId: null });
      }
    },
    [hasModelTTS, onConfigChange],
  );

  const handleRateChange = useCallback((_, value) => onConfigChange({ rate: value }), [onConfigChange]);

  const handleVolumeChange = useCallback((_, value) => onConfigChange({ volume: value }), [onConfigChange]);

  const handlePreview = useCallback(() => previewSpeak(VOICE_PREVIEW_TEXT), [previewSpeak]);

  return (
    <Box sx={styles.content}>
      {voiceOptions.length > 0 && (
        <SingleSelect
          label="Voice"
          value={selectedVoiceValue}
          options={voiceOptions}
          onValueChange={handleVoiceChange}
          showBorder
          showEmptyPlaceholder
          emptyPlaceholder={<em>Default</em>}
        />
      )}
      <Box sx={styles.sliderRow}>
        <Typography
          variant="caption"
          sx={styles.sliderLabel}
        >
          Speed
        </Typography>
        <Slider
          value={config?.rate ?? 1.0}
          min={0.5}
          max={2.0}
          step={0.1}
          marks={VOICE_SPEED_MARKS}
          onChange={handleRateChange}
          valueLabelDisplay="auto"
          valueLabelFormat={v => `${v}×`}
          size="small"
        />
      </Box>
      <Box sx={styles.sliderRow}>
        <Typography
          variant="caption"
          sx={styles.sliderLabel}
        >
          Volume
        </Typography>
        <Slider
          value={config?.volume ?? 1.0}
          min={0}
          max={1}
          step={0.05}
          marks={VOICE_VOLUME_MARKS}
          onChange={handleVolumeChange}
          valueLabelDisplay="auto"
          valueLabelFormat={v => `${Math.round(v * 100)}%`}
          size="small"
        />
      </Box>
      {!isPlaying && (
        <Box>
          <Button.BaseBtn
            variant="elitea"
            color="secondary"
            loading={isPreviewPlaying}
            onClick={handlePreview}
          >
            Preview Voice
          </Button.BaseBtn>
        </Box>
      )}
    </Box>
  );
});

VoiceConfigControls.displayName = 'VoiceConfigControls';

export { VoiceConfigControls };

/** @type {MuiSx} */
const voiceConfigControlsStyles = () => ({
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
