import { useCallback, useRef, useState } from 'react';

import { extractSkillCompareData } from '@/[fsd]/entities/compare-versions';
import {
  useLazySkillDetailsQuery,
  useLazySkillVersionFilesQuery,
  useSaveSkillVersionFileTextMutation,
  useSkillUpdateMutation,
} from '@/[fsd]/features/skill/api';
import { pickFileEdits } from '@/[fsd]/features/skill/lib/helpers';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { buildErrorMessage } from '@/common/utils';

export const useCompareSkillVersions = ({ projectId, skillId }) => {
  const { toastSuccess, toastError } = useToast();

  const [fetchSkillVersion] = useLazySkillDetailsQuery();
  const [fetchVersionFiles] = useLazySkillVersionFilesQuery();
  const [updateSkillVersion] = useSkillUpdateMutation();
  const [saveFileText] = useSaveSkillVersionFileTextMutation();

  const versionDetailsRef = useRef({ left: null, right: null });

  const [savingLeftKeys, setSavingLeftKeys] = useState({});
  const [savingRightKeys, setSavingRightKeys] = useState({});

  const resetSavingState = useCallback(() => {
    setSavingLeftKeys({});
    setSavingRightKeys({});
  }, []);

  const loadVersions = useCallback(
    async (leftId, rightId) => {
      const [leftDetail, rightDetail, [leftFiles, rightFiles]] = await Promise.all([
        fetchSkillVersion({ projectId, skillId, versionId: leftId }).unwrap(),
        fetchSkillVersion({ projectId, skillId, versionId: rightId }).unwrap(),
        Promise.all([
          fetchVersionFiles({ projectId, skillId, versionId: leftId }).unwrap(),
          fetchVersionFiles({ projectId, skillId, versionId: rightId }).unwrap(),
        ]).catch(() => [[], []]),
      ]);
      versionDetailsRef.current = { left: leftDetail, right: rightDetail };
      const pickMeta = d => {
        const vd = d.version_details ?? d;
        return { id: vd.id, name: vd.name, created_at: vd.created_at, author: vd.author, status: vd.status };
      };
      return {
        leftData: { ...extractSkillCompareData(leftDetail), files: leftFiles },
        rightData: { ...extractSkillCompareData(rightDetail), files: rightFiles },
        leftVersionMeta: pickMeta(leftDetail),
        rightVersionMeta: pickMeta(rightDetail),
      };
    },
    [fetchSkillVersion, fetchVersionFiles, projectId, skillId],
  );

  const saveVersion = useCallback(
    async ({ fieldPayload, data, edits, versionId, versionName, setSavingKeys, setEdits, setData }) => {
      const keys = Object.keys(fieldPayload);
      const fileEdits = pickFileEdits(fieldPayload);
      const fileKeys = fileEdits.map(fileEdit => fileEdit.key);
      const versionKeys = keys.filter(key => !fileKeys.includes(key));
      const savedKeys = [];
      const failures = [];
      setSavingKeys(prev => {
        const next = { ...prev };
        keys.forEach(k => {
          next[k] = true;
        });
        return next;
      });
      try {
        if (versionKeys.length) {
          const mergedData = { ...data, ...edits, ...fieldPayload };
          const versionDetails =
            versionId === versionDetailsRef.current.left?.version_details?.id
              ? versionDetailsRef.current.left
              : versionDetailsRef.current.right;
          try {
            await updateSkillVersion({
              ...(versionDetails?.version_details ?? {}),
              projectId,
              skillId,
              versionId,
              instructions: mergedData.instructions,
            }).unwrap();
            savedKeys.push(...versionKeys);
          } catch {
            failures.push('Failed to save. Please try again.');
          }
        }
        for (const { key, path, content } of fileEdits) {
          try {
            await saveFileText({ projectId, skillId, versionId, path, content }).unwrap();
            savedKeys.push(key);
          } catch (error) {
            failures.push(`${path} was not saved: ${buildErrorMessage(error)}`);
          }
        }
        setEdits(prev => {
          const next = { ...prev };
          savedKeys.forEach(k => delete next[k]);
          return next;
        });
        setData(prev => ({
          ...prev,
          ...Object.fromEntries(savedKeys.map(key => [key, fieldPayload[key]])),
        }));
        if (failures.length) toastError(failures.join(' '));
        else toastSuccess(`Version "${versionName}" has been updated.`);
      } finally {
        setSavingKeys(prev => {
          const next = { ...prev };
          keys.forEach(k => delete next[k]);
          return next;
        });
      }
    },
    [updateSkillVersion, saveFileText, projectId, skillId, toastSuccess, toastError],
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
