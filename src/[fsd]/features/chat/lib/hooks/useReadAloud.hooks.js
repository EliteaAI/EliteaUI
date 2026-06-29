import { useCallback, useEffect, useMemo, useState } from 'react';

import { toSpeakableText } from '@/[fsd]/features/chat/lib/helpers/tts.helpers';
import { useVoiceConfig } from '@/[fsd]/features/chat/voice-config';
import { useGetTtsVoicesQuery, useListModelsQuery } from '@/api/configurations.js';

import { useTextToSpeech } from './useTextToSpeech.hooks';

/**
 * Read-aloud / text-to-speech wiring shared by every surface that renders the
 * VoiceMiniPlayer (agent ChatBox, skill test panel, …). Picks a TTS model
 * (section 'tts') for server-side speech, falling back to the browser's
 * SpeechSynthesis, and tracks the spoken word range for in-bubble highlighting.
 *
 * Calling `onAutoSpeak(text, msgId)` surfaces the player; `onPlay()` starts
 * playback; the player auto-hides when playback ends.
 *
 * @returns onAutoSpeak/speakingMessageId/speakingSegments/spokenRange to pass to
 * the message list, showPlayer + voicePlayerProps to render <VoiceMiniPlayer>,
 * and isPlaying/stop for callers that gate other flows on playback.
 */
export const useReadAloud = ({ projectId, socket }) => {
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [speakingSegments, setSpeakingSegments] = useState(null);

  const { data: ttsModelsData } = useListModelsQuery(
    { projectId, section: 'tts', include_shared: true },
    { skip: !projectId },
  );
  const ttsModel = useMemo(
    () => ttsModelsData?.items?.find(model => model.default) ?? ttsModelsData?.items?.[0] ?? null,
    [ttsModelsData],
  );
  const hasModelTTS = !!(ttsModel && socket);

  const {
    config: voiceConfig,
    setConfig: setVoiceConfig,
    browserVoices,
    resolvedBrowserVoice,
  } = useVoiceConfig({ persist: false });
  const { data: ttsVoicesData } = useGetTtsVoicesQuery(
    { projectId: ttsModel?.project_id ?? projectId, modelName: ttsModel?.name ?? '' },
    { skip: !ttsModel },
  );
  const displayVoices = hasModelTTS ? (ttsVoicesData?.voices ?? []) : browserVoices;

  const {
    speak,
    stop: stopTTS,
    isPlaying,
    spokenRange,
    showPlayer,
    setShowPlayer,
    speakableText,
    setSpeakableText,
  } = useTextToSpeech({
    ttsModel,
    socket,
    voiceConfig: {
      voice: resolvedBrowserVoice,
      voiceId: voiceConfig.voiceId || undefined,
      rate: voiceConfig.rate,
      volume: voiceConfig.volume,
    },
  });

  const onAutoSpeak = useCallback(
    (text, msgId) => {
      if (!text) return;
      const { text: convertedText, segments } = toSpeakableText(text);
      if (!convertedText) return;
      setSpeakingMessageId(msgId ?? null);
      setSpeakingSegments(segments);
      setSpeakableText(convertedText);
      setShowPlayer(true);
    },
    [setShowPlayer, setSpeakableText],
  );

  const onPlay = useCallback(() => {
    speak(speakableText);
  }, [speak, speakableText]);

  // When playback ends, hide the player and clear the spoken-word highlight.
  useEffect(() => {
    if (!isPlaying) {
      setSpeakingMessageId(null);
      setSpeakingSegments(null);
      setShowPlayer(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  return {
    onAutoSpeak,
    speakingMessageId,
    speakingSegments,
    spokenRange,
    showPlayer,
    isPlaying,
    stop: stopTTS,
    voicePlayerProps: {
      voiceConfig,
      voices: displayVoices,
      onVoiceConfigChange: setVoiceConfig,
      ttsModel,
      hasModelTTS,
      isPlaying,
      onStop: stopTTS,
      onPlay,
    },
  };
};
