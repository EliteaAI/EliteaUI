import { useCallback, useRef, useState } from 'react';

import { extractSkillCompareData } from '@/[fsd]/entities/compare-versions';
import { useLazySkillDetailsQuery, useSkillUpdateMutation } from '@/[fsd]/features/skill/api';
import useToast from '@/hooks/useToast';

export const useCompareSkillVersions = ({ projectId, skillId }) => {
  const { toastSuccess, toastError } = useToast();

  const [fetchSkillVersion] = useLazySkillDetailsQuery();
  const [updateSkillVersion] = useSkillUpdateMutation();

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
        fetchSkillVersion({ projectId, skillId, versionId: leftId }).unwrap(),
        fetchSkillVersion({ projectId, skillId, versionId: rightId }).unwrap(),
      ]);
      versionDetailsRef.current = { left: leftDetail, right: rightDetail };
      const pickMeta = d => {
        const vd = d.version_details ?? d;
        return { id: vd.id, name: vd.name, created_at: vd.created_at, author: vd.author };
      };
      return {
        leftData: extractSkillCompareData(leftDetail),
        rightData: extractSkillCompareData(rightDetail),
        leftVersionMeta: pickMeta(leftDetail),
        rightVersionMeta: pickMeta(rightDetail),
      };
    },
    [fetchSkillVersion, projectId, skillId],
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
          versionId === versionDetailsRef.current.left?.version_details?.id
            ? versionDetailsRef.current.left
            : versionDetailsRef.current.right;
        await updateSkillVersion({
          ...(versionDetails?.version_details ?? {}),
          projectId,
          skillId,
          versionId,
          instructions: mergedData.instructions,
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
    [updateSkillVersion, projectId, skillId, toastSuccess, toastError],
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
