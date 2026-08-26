import { useCallback, useRef, useState } from 'react';

import { extractAgentCompareData } from '@/[fsd]/entities/compare-versions';
import {
  useLazyGetApplicationVersionDetailQuery,
  useUpdateApplicationVersionMutation,
} from '@/api/applications';
import useToast from '@/hooks/useToast';

export const useCompareAgentVersions = ({ projectId, applicationId }) => {
  const { toastSuccess, toastError } = useToast();

  const [fetchAgentVersion] = useLazyGetApplicationVersionDetailQuery();
  const [updateAgentVersion] = useUpdateApplicationVersionMutation();

  const versionDetailsRef = useRef({ left: null, right: null });

  const [savingLeftKeys, setSavingLeftKeys] = useState({});
  const [savingRightKeys, setSavingRightKeys] = useState({});

  const resetSavingState = useCallback(() => {
    setSavingLeftKeys({});
    setSavingRightKeys({});
  }, []);

  const loadVersions = useCallback(
    async (leftId, rightId) => {
      const [leftDetail, rightDetail] = await Promise.all([
        fetchAgentVersion({ projectId, applicationId, versionId: leftId }).unwrap(),
        fetchAgentVersion({ projectId, applicationId, versionId: rightId }).unwrap(),
      ]);
      versionDetailsRef.current = { left: leftDetail, right: rightDetail };
      const pickMeta = d => ({ id: d.id, name: d.name, created_at: d.created_at, author: d.author });
      return {
        leftData: extractAgentCompareData(leftDetail),
        rightData: extractAgentCompareData(rightDetail),
        leftVersionMeta: pickMeta(leftDetail),
        rightVersionMeta: pickMeta(rightDetail),
      };
    },
    [fetchAgentVersion, projectId, applicationId],
  );

  const saveVersion = useCallback(
    async ({ fieldPayload, data, edits, versionId, versionName, setSavingKeys, setEdits, setData }) => {
      const keys = Object.keys(fieldPayload);
      setSavingKeys(prev => {
        const next = { ...prev };
        keys.forEach(k => {
          next[k] = true;
        });
        return next;
      });
      try {
        const mergedData = { ...data, ...edits, ...fieldPayload };
        const versionDetails =
          versionId === versionDetailsRef.current.left?.id
            ? versionDetailsRef.current.left
            : versionDetailsRef.current.right;
        await updateAgentVersion({
          ...(versionDetails ?? {}),
          projectId,
          applicationId,
          versionId,
          instructions: mergedData.instructions,
          welcome_message: mergedData.welcome_message,
          conversation_starters: mergedData.conversation_starters,
        }).unwrap();
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
        setSavingKeys(prev => {
          const next = { ...prev };
          keys.forEach(k => delete next[k]);
          return next;
        });
      }
    },
    [updateAgentVersion, projectId, applicationId, toastSuccess, toastError],
  );

  const onSaveLeft = useCallback(
    args => saveVersion({ ...args, setSavingKeys: setSavingLeftKeys }),
    [saveVersion],
  );

  const onSaveRight = useCallback(
    args => saveVersion({ ...args, setSavingKeys: setSavingRightKeys }),
    [saveVersion],
  );

  return {
    loadVersions,
    savingLeftKeys,
    savingRightKeys,
    onSaveLeft,
    onSaveRight,
    resetSavingState,
  };
};
