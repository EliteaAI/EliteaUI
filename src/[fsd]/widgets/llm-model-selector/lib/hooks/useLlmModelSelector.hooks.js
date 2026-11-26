import { useCallback, useMemo, useRef, useState } from 'react';

import { normalizeLlmSettings } from '../helpers';

// The model list and the settings dialog of a model selector: the list opens at `anchorRef`; ⚙ calls `onClickSettings`
// when the host owns the settings, else opens the dialog, which applies through `onSetLLMSettings`.
export const useLlmModelSelector = ({
  llmSettings,
  selectedModel,
  showStepsLimit = false,
  onSetLLMSettings,
  onClickSettings,
}) => {
  const anchorRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showLLMSettings, setShowLLMSettings] = useState(false);

  const normalizedLlmSettings = useMemo(
    // A default param only replaces `undefined`; the Toolkit Index History page passes `llmSettings={null}`
    () => normalizeLlmSettings(llmSettings || {}, selectedModel, { showStepsLimit }),
    [llmSettings, selectedModel, showStepsLimit],
  );

  const handleModelMenuClick = useCallback(() => setAnchorEl(anchorRef.current), []);
  const handleClose = useCallback(() => setAnchorEl(null), []);

  const handleSettingsClick = useCallback(() => {
    if (onClickSettings) {
      onClickSettings();
    } else if (onSetLLMSettings) {
      setShowLLMSettings(true);
    }
  }, [onClickSettings, onSetLLMSettings]);

  const handleApplySettings = useCallback(
    newSettings => {
      onSetLLMSettings?.(newSettings);
      setShowLLMSettings(false);
    },
    [onSetLLMSettings],
  );

  const handleCancelSettings = useCallback(() => setShowLLMSettings(false), []);

  return {
    anchorRef,
    anchorEl,
    showLLMSettings,
    normalizedLlmSettings,
    handleModelMenuClick,
    handleClose,
    handleSettingsClick,
    handleApplySettings,
    handleCancelSettings,
  };
};
