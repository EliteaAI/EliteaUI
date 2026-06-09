import { memo, useContext, useMemo } from 'react';

import { useVoiceConfig } from '@/[fsd]/features/chat/lib/hooks';
import { VoiceConfigControls } from '@/[fsd]/features/chat/ui/voice-config';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { useGetTtsVoicesQuery, useListModelsQuery } from '@/api/configurations.js';
import SocketContext from '@/contexts/SocketContext';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const VoicePersonalizationSection = memo(() => {
  const { config, setConfig, browserVoices } = useVoiceConfig({ persist: true });
  const socket = useContext(SocketContext);
  const projectId = useSelectedProjectId();

  const { data: ttsModelsData } = useListModelsQuery(
    { projectId, section: 'tts', include_shared: true },
    { skip: !projectId },
  );

  const ttsModel = useMemo(
    () => ttsModelsData?.items?.find(m => m.default) ?? ttsModelsData?.items?.[0] ?? null,
    [ttsModelsData],
  );

  const hasModelTTS = !!(ttsModel && socket);

  const { data: ttsVoicesData } = useGetTtsVoicesQuery(
    { projectId: ttsModel?.project_id ?? projectId, modelName: ttsModel?.name ?? '' },
    { skip: !ttsModel },
  );

  const displayVoices = hasModelTTS ? (ttsVoicesData?.voices ?? []) : browserVoices;

  return (
    <BasicAccordion
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={styles.accordion}
      items={[
        {
          title: 'Voice Personalization',
          content: (
            <VoiceConfigControls
              config={config}
              onConfigChange={setConfig}
              hasModelTTS={hasModelTTS}
              ttsModel={ttsModel}
              socket={socket}
              browserVoices={browserVoices}
              voices={displayVoices}
            />
          ),
        },
      ]}
    />
  );
});

VoicePersonalizationSection.displayName = 'VoicePersonalizationSection';

export { VoicePersonalizationSection };

/** @type {MuiSx} */
const styles = {
  accordion: {
    background: 'transparent !important',
  },
};
