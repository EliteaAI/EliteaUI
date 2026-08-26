import { useCallback, useState } from 'react';

import { useLazySkillDetailsQuery, useSkillUpdateMutation } from '@/[fsd]/features/skill/api';
import {
  useLazyGetApplicationVersionDetailQuery,
  useUpdateApplicationVersionMutation,
} from '@/api/applications';
import useToast from '@/hooks/useToast';

export const useCompareVersionsSave = ({ isAgent, projectId, entityId }) => {
  const { toastSuccess, toastError } = useToast();

  const [fetchAgentVersion] = useLazyGetApplicationVersionDetailQuery();
  const [fetchSkillVersion] = useLazySkillDetailsQuery();
  const [updateAgentVersion] = useUpdateApplicationVersionMutation();
  const [updateSkillVersion] = useSkillUpdateMutation();

  const [savingLeftKeys, setSavingLeftKeys] = useState({});
  const [savingRightKeys, setSavingRightKeys] = useState({});

  const resetSavingState = useCallback(() => {
    setSavingLeftKeys({});
    setSavingRightKeys({});
  }, []);

  const markKeys = (setter, keys) =>
    setter(prev => {
      const next = { ...prev };
      keys.forEach(k => {
        next[k] = true;
      });
      return next;
    });

  const clearKeys = (setter, keys) =>
    setter(prev => {
      const next = { ...prev };
      keys.forEach(k => {
        delete next[k];
      });
      return next;
    });

  const saveVersion = useCallback(
    async ({
      fieldPayload,
      data,
      edits,
      versionDetails,
      versionId,
      versionName,
      setSavingKeys,
      setEdits,
      setData,
    }) => {
      const keys = Object.keys(fieldPayload);
      markKeys(setSavingKeys, keys);
      try {
        const mergedData = { ...data, ...edits, ...fieldPayload };
        if (isAgent) {
          await updateAgentVersion({
            ...versionDetails,
            projectId,
            applicationId: entityId,
            versionId,
            instructions: mergedData.instructions,
            welcome_message: mergedData.welcome_message,
            conversation_starters: mergedData.conversation_starters,
          }).unwrap();
        } else {
          await updateSkillVersion({
            ...versionDetails,
            projectId,
            skillId: entityId,
            versionId,
            instructions: mergedData.instructions,
          }).unwrap();
        }
        setEdits(prev => {
          const next = { ...prev };
          keys.forEach(k => delete next[k]);
          return next;
        });
        setData(prev => ({ ...prev, ...fieldPayload }));
        toastSuccess(`Version "${versionName}" has been updated.`);
      } catch {
        toastError('Failed to save. Please try again.');
      } finally {
        clearKeys(setSavingKeys, keys);
      }
    },
    [isAgent, updateAgentVersion, updateSkillVersion, projectId, entityId, toastSuccess, toastError],
  );

  return {
    fetchAgentVersion,
    fetchSkillVersion,
    savingLeftKeys,
    savingRightKeys,
    setSavingLeftKeys,
    setSavingRightKeys,
    resetSavingState,
    saveVersion,
  };
};
