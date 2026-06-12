import { memo, useCallback, useContext, useEffect, useState } from 'react';

import { Button, Modal } from '@/[fsd]/shared/ui';
import SocketContext from '@/contexts/SocketContext';

import { useVoiceConfig } from '../lib/hooks/useVoiceConfig.hooks';
import { VoiceConfigControls } from './VoiceConfigControls';

const VoiceConfigDialog = memo(props => {
  const { config, voices, open, onApply, onCancel, ttsModel, hasModelTTS, isPlaying } = props;
  const [localConfig, setLocalConfig] = useState(config);

  const socket = useContext(SocketContext);
  const { browserVoices } = useVoiceConfig();

  useEffect(() => {
    setLocalConfig(config);
  }, [config, open]);

  const handleConfigChange = useCallback(updates => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const handleApply = useCallback(() => onApply(localConfig), [localConfig, onApply]);

  return (
    <Modal.BaseModal
      open={open}
      title="Voice settings"
      titleVariant="headingMedium"
      onClose={onCancel}
      content={
        <VoiceConfigControls
          config={localConfig}
          onConfigChange={handleConfigChange}
          hasModelTTS={hasModelTTS}
          ttsModel={ttsModel}
          socket={socket}
          browserVoices={browserVoices}
          voices={voices}
          isPlaying={isPlaying}
        />
      }
      actions={
        <>
          <Button.BaseBtn
            variant="elitea"
            color="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button.BaseBtn>
          <Button.BaseBtn
            variant="elitea"
            onClick={handleApply}
          >
            Apply
          </Button.BaseBtn>
        </>
      }
    />
  );
});

VoiceConfigDialog.displayName = 'VoiceConfigDialog';

export { VoiceConfigDialog };
