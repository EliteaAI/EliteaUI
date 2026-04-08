import { useCallback } from 'react';

import { useTrackEvent } from '@/GA';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { ChatParticipantType } from '@/common/constants';

/**
 * Hook for managing pipeline creation workflow in chat context
 * Similar to useAgentCreation but for pipelines
 */
const usePipelineCreation = ({ onPipelineEditorCreated, addNewParticipants, onSetActiveParticipant }) => {
  const trackEvent = useTrackEvent();
  const onPipelineCreated = useCallback(
    createdPipeline => {
      if (!createdPipeline) return;

      trackEvent(GA_EVENT_NAMES.PIPELINE_CREATED_FROM_CHAT, {
        [GA_EVENT_PARAMS.ENTITY]: 'pipeline',
        [GA_EVENT_PARAMS.PIPELINE_ID]: createdPipeline.id,
        [GA_EVENT_PARAMS.CREATION_SOURCE]: 'chat_canvas',
        [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
        [GA_EVENT_PARAMS.PIPELINE_NAME]: createdPipeline.name || 'unknown',
      });

      // Ensure the pipeline has the correct participant type
      const pipelineParticipant = {
        ...createdPipeline,
        participantType: ChatParticipantType.Pipelines,
        entity_name: ChatParticipantType.Applications,
        entity_meta: {
          ...createdPipeline.entity_meta,
          id: createdPipeline.id,
        },
        meta: {
          ...createdPipeline.meta,
          name: createdPipeline.name,
        },
        entity_settings: {
          ...createdPipeline.entity_settings,
          agent_type: 'pipeline', // Ensure it's marked as a pipeline
          version_id: createdPipeline.version_details?.id, // Set version_id for saving
        },
      };

      // Add the pipeline to the conversation
      if (addNewParticipants) {
        addNewParticipants([pipelineParticipant]);
      }

      // Set as active participant if callback provided
      if (onSetActiveParticipant) {
        onSetActiveParticipant(pipelineParticipant);
      }

      // Notify the pipeline editor
      if (onPipelineEditorCreated) {
        onPipelineEditorCreated(pipelineParticipant);
      }
    },
    [onPipelineEditorCreated, addNewParticipants, onSetActiveParticipant, trackEvent],
  );

  return {
    onPipelineCreated,
  };
};

export default usePipelineCreation;
