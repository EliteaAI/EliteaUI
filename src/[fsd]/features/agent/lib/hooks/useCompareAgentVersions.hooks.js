import { useCallback, useRef, useState } from 'react';

import { useDispatch } from 'react-redux';

import { extractAgentCompareData } from '@/[fsd]/entities/compare-versions';
import { useLazyGetApplicationSkillsQuery } from '@/[fsd]/features/skill/api';
import {
  useLazyGetApplicationVersionDetailQuery,
  useUpdateApplicationVersionMutation,
} from '@/api/applications';
import { eliteaApi } from '@/api/eliteaApi';
import useToast from '@/hooks/useToast';

export const useCompareAgentVersions = ({ projectId, applicationId }) => {
  const dispatch = useDispatch();
  const { toastSuccess, toastError } = useToast();

  const [fetchAgentVersion] = useLazyGetApplicationVersionDetailQuery();
  const [updateAgentVersion] = useUpdateApplicationVersionMutation();
  const [fetchApplicationSkills] = useLazyGetApplicationSkillsQuery();

  const versionDetailsRef = useRef({ left: null, right: null });
  const savedLeftFieldsRef = useRef({});
  const leftVersionIdRef = useRef(null);

  const [savingLeftKeys, setSavingLeftKeys] = useState({});
  const [savingRightKeys, setSavingRightKeys] = useState({});

  const resetSavingState = useCallback(() => {
    setSavingLeftKeys({});
    setSavingRightKeys({});
  }, []);

  const loadVersions = useCallback(
    async (leftId, rightId) => {
      savedLeftFieldsRef.current = {};
      leftVersionIdRef.current = leftId;
      const [leftDetail, rightDetail, leftSkillsResult, rightSkillsResult] = await Promise.all([
        fetchAgentVersion({ projectId, applicationId, versionId: leftId }).unwrap(),
        fetchAgentVersion({ projectId, applicationId, versionId: rightId }).unwrap(),
        fetchApplicationSkills({ projectId, appVersionId: leftId }).unwrap(),
        fetchApplicationSkills({ projectId, appVersionId: rightId }).unwrap(),
      ]);
      versionDetailsRef.current = { left: leftDetail, right: rightDetail };
      const pickMeta = d => ({ id: d.id, name: d.name, created_at: d.created_at, author: d.author });
      return {
        leftData: extractAgentCompareData({ ...leftDetail, skills: leftSkillsResult?.skills ?? [] }),
        rightData: extractAgentCompareData({ ...rightDetail, skills: rightSkillsResult?.skills ?? [] }),
        leftVersionMeta: pickMeta(leftDetail),
        rightVersionMeta: pickMeta(rightDetail),
      };
    },
    [fetchAgentVersion, fetchApplicationSkills, projectId, applicationId],
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
        if (versionId === versionDetailsRef.current.left?.id) {
          savedLeftFieldsRef.current = { ...savedLeftFieldsRef.current, ...fieldPayload };
        }
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

  const flushLeftSaves = useCallback(() => {
    const fields = savedLeftFieldsRef.current;
    savedLeftFieldsRef.current = {};
    if (Object.keys(fields).length === 0) return null;
    dispatch(
      eliteaApi.util.updateQueryData('applicationDetails', { projectId, applicationId }, draft => {
        draft.version_details = draft.version_details ?? {};
        Object.entries(fields).forEach(([key, value]) => {
          draft.version_details[key] = value;
        });
      }),
    );
    return fields;
  }, [dispatch, projectId, applicationId]);

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
    flushLeftSaves,
  };
};
