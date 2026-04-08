import { useCallback, useEffect, useRef, useState } from 'react';

import { useUpdateParticipantSettingsMutation } from '@/api/chat';
import { buildErrorMessage } from '@/common/utils';
import useToast from '@/hooks/useToast';

export const useApplicationChatSwitchVersion = ({
  activeParticipant,
  activeConversation,
  applicationVersionDetails,
  projectId,
  setActiveParticipant,
}) => {
  const { toastError } = useToast();
  // Direct API mutation for participant settings
  const [updateParticipantSettings] = useUpdateParticipantSettingsMutation();
  const [prevVersionId, setPrevVersionId] = useState(applicationVersionDetails?.id);
  const updateParticipantWithNewVersionId = useCallback(async () => {
    // Update the participant settings with new version data from API response
    const updatedParticipant = {
      ...(activeParticipant || {}),
      entity_settings: {
        ...activeParticipant?.entity_settings,
        version_id: applicationVersionDetails?.id,
        variables: [...(applicationVersionDetails?.variables || [])],
        llm_settings: { ...(applicationVersionDetails?.llm_settings || {}) },
        icon_meta: applicationVersionDetails?.meta?.icon_meta || {},
      },
    };

    if (activeParticipant?.id && activeConversation?.id) {
      // Call the API directly to update participant settings
      const result = await updateParticipantSettings({
        projectId,
        conversationId: activeConversation?.id,
        participantId: activeParticipant?.id,
        ...updatedParticipant.entity_settings,
      });
      if (result.error) {
        toastError(buildErrorMessage(result.error));
      }
    }
    setActiveParticipant(updatedParticipant);
  }, [
    activeConversation?.id,
    activeParticipant,
    applicationVersionDetails?.id,
    applicationVersionDetails?.llm_settings,
    applicationVersionDetails?.meta?.icon_meta,
    applicationVersionDetails?.variables,
    projectId,
    toastError,
    updateParticipantSettings,
    setActiveParticipant,
  ]);

  const updateParticipantWithNewVersionIdRef = useRef(updateParticipantWithNewVersionId);

  useEffect(() => {
    updateParticipantWithNewVersionIdRef.current = updateParticipantWithNewVersionId;
  }, [updateParticipantWithNewVersionId]);

  useEffect(() => {
    if (prevVersionId) {
      if (prevVersionId !== applicationVersionDetails?.id) {
        updateParticipantWithNewVersionIdRef.current();
        setPrevVersionId(applicationVersionDetails?.id);
      }
    } else {
      setPrevVersionId(applicationVersionDetails?.id);
    }
  }, [applicationVersionDetails?.id, prevVersionId]);
};

export default useApplicationChatSwitchVersion;
