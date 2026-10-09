import { useCallback, useEffect, useRef, useState } from 'react';

import { useUpdateParticipantSettingsMutation } from '@/api';
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
  const updateParticipantWithNewVersionId = useCallback(
    async ({ versionOnly = false } = {}) => {
      // Update the participant settings with new version data from API response
      const updatedParticipant = {
        ...(activeParticipant || {}),
        entity_settings: {
          ...activeParticipant?.entity_settings,
          version_id: applicationVersionDetails?.id,
          ...(!versionOnly && {
            variables: [...(applicationVersionDetails?.variables || [])],
            llm_settings: { ...(applicationVersionDetails?.llm_settings || {}) },
            icon_meta: applicationVersionDetails?.meta?.icon_meta || {},
          }),
        },
      };

      setActiveParticipant(updatedParticipant);

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
    },
    [
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
    ],
  );

  const updateParticipantWithNewVersionIdRef = useRef(updateParticipantWithNewVersionId);

  useEffect(() => {
    updateParticipantWithNewVersionIdRef.current = updateParticipantWithNewVersionId;
  }, [updateParticipantWithNewVersionId]);

  const versionId = applicationVersionDetails?.id;
  const participantVersionId = activeParticipant?.entity_settings?.version_id;
  const isPersistedParticipant = !!(activeParticipant?.id && activeConversation?.id);

  useEffect(() => {
    // Guard against #6523: skip while version details are still loading (id not yet available),
    // so a settings-update is never fired with version_id undefined.
    if (!versionId) {
      return;
    }

    const isVersionSwitch = !!prevVersionId && prevVersionId !== versionId;
    const shouldSync = isPersistedParticipant
      ? String(participantVersionId) !== String(versionId)
      : isVersionSwitch;

    if (shouldSync) updateParticipantWithNewVersionIdRef.current({ versionOnly: !isVersionSwitch });
    if (prevVersionId !== versionId) setPrevVersionId(versionId);
  }, [versionId, prevVersionId, isPersistedParticipant, participantVersionId]);
};

export default useApplicationChatSwitchVersion;
