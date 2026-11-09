import { useCallback, useRef, useState } from 'react';

import { useDispatch } from 'react-redux';

import {
  COMPARE_ENTITY_TYPES,
  extractAgentCompareData,
  extractPipelineCompareData,
} from '@/[fsd]/entities/compare-versions';
import { rebuildPipelineSettingsFromYaml } from '@/[fsd]/features/pipelines/lib/helpers/pipelineCanvasSync.helpers';
import { useLazyGetApplicationSkillsQuery } from '@/[fsd]/features/skill/api';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import {
  useLazyGetApplicationVersionDetailQuery,
  useUpdateApplicationVersionMutation,
} from '@/api/applications';
import { eliteaApi } from '@/api/eliteaApi';

// The fields the compare wizard edits; every other field of the version is sent back as stored
const EDITABLE_FIELDS = ['instructions', 'welcome_message', 'conversation_starters'];

const pickMeta = detail => ({
  id: detail.id,
  name: detail.name,
  created_at: detail.created_at,
  author: detail.author,
});

// Compare and save two versions of an agent or a pipeline (entityType 'agent' or 'pipeline')
export const useCompareAgentVersions = ({
  projectId,
  applicationId,
  entityType = COMPARE_ENTITY_TYPES.agent,
}) => {
  const dispatch = useDispatch();
  const { toastSuccess, toastError } = useToast();
  const isPipeline = entityType === COMPARE_ENTITY_TYPES.pipeline;

  const [fetchAgentVersion] = useLazyGetApplicationVersionDetailQuery();
  const [updateAgentVersion] = useUpdateApplicationVersionMutation();
  const [fetchApplicationSkills] = useLazyGetApplicationSkillsQuery();

  const versionDetailsRef = useRef({ left: null, right: null });
  const savedLeftFieldsRef = useRef({});

  const [savingLeftKeys, setSavingLeftKeys] = useState({});
  const [savingRightKeys, setSavingRightKeys] = useState({});

  const resetSavingState = useCallback(() => {
    setSavingLeftKeys({});
    setSavingRightKeys({});
  }, []);

  const loadVersions = useCallback(
    async (leftId, rightId) => {
      savedLeftFieldsRef.current = {};
      const versionRequests = [
        fetchAgentVersion({ projectId, applicationId, versionId: leftId }).unwrap(),
        fetchAgentVersion({ projectId, applicationId, versionId: rightId }).unwrap(),
      ];

      if (isPipeline) {
        // Pipelines have no skills
        const [leftDetail, rightDetail] = await Promise.all(versionRequests);
        versionDetailsRef.current = { left: leftDetail, right: rightDetail };
        return {
          leftData: extractPipelineCompareData(leftDetail),
          rightData: extractPipelineCompareData(rightDetail),
          leftVersionMeta: pickMeta(leftDetail),
          rightVersionMeta: pickMeta(rightDetail),
        };
      }

      const [leftDetail, rightDetail, leftSkillsResult, rightSkillsResult] = await Promise.all([
        ...versionRequests,
        fetchApplicationSkills({ projectId, appVersionId: leftId }).unwrap(),
        fetchApplicationSkills({ projectId, appVersionId: rightId }).unwrap(),
      ]);
      versionDetailsRef.current = { left: leftDetail, right: rightDetail };
      return {
        leftData: extractAgentCompareData({ ...leftDetail, skills: leftSkillsResult?.skills ?? [] }),
        rightData: extractAgentCompareData({ ...rightDetail, skills: rightSkillsResult?.skills ?? [] }),
        leftVersionMeta: pickMeta(leftDetail),
        rightVersionMeta: pickMeta(rightDetail),
      };
    },
    [fetchAgentVersion, fetchApplicationSkills, isPipeline, projectId, applicationId],
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
      const side = versionId === versionDetailsRef.current.left?.id ? 'left' : 'right';
      try {
        const mergedData = { ...data, ...edits, ...fieldPayload };
        const versionDetails = versionDetailsRef.current[side];
        // Only the saved fields change: the other edited fields keep their stored value until saved
        const storedFields = Object.fromEntries(
          EDITABLE_FIELDS.map(field => [field, field in fieldPayload ? fieldPayload[field] : data[field]]),
        );
        await updateAgentVersion({
          ...(versionDetails ?? {}),
          projectId,
          applicationId,
          versionId,
          ...(isPipeline
            ? storedFields
            : {
                instructions: mergedData.instructions,
                welcome_message: mergedData.welcome_message,
                conversation_starters: mergedData.conversation_starters,
              }),
        }).unwrap();
        // The next save of this version sends what is stored now, not what was loaded
        versionDetailsRef.current = {
          ...versionDetailsRef.current,
          [side]: { ...(versionDetails ?? {}), ...fieldPayload },
        };
        setEdits(prev => {
          const next = { ...prev };
          keys.forEach(k => delete next[k]);
          return next;
        });
        setData(prev => ({ ...prev, ...fieldPayload }));
        toastSuccess(`Version "${versionName}" has been updated.`);
        if (side === 'left') {
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
    [updateAgentVersion, isPipeline, projectId, applicationId, toastSuccess, toastError],
  );

  // Puts the fields saved to the open (left) version into the editor cache when the dialog closes
  const flushLeftSaves = useCallback(() => {
    const fields = savedLeftFieldsRef.current;
    savedLeftFieldsRef.current = {};
    if (Object.keys(fields).length === 0) return null;
    // A new pipeline YAML brings its canvas: kept positions, new nodes placed, removed ones dropped
    const withCanvas = (target, cached) => {
      Object.entries(fields).forEach(([key, value]) => {
        target[key] = value;
      });
      if (!isPipeline || fields.instructions === undefined) return;
      const pipelineSettings = rebuildPipelineSettingsFromYaml(
        fields.instructions,
        cached?.pipeline_settings,
      );
      if (pipelineSettings) target.pipeline_settings = pipelineSettings;
    };
    const patchVersionDetails = draft => {
      draft.version_details = draft.version_details ?? {};
      withCanvas(draft.version_details, draft.version_details);
    };
    dispatch(
      eliteaApi.util.updateQueryData('applicationDetails', { projectId, applicationId }, patchVersionDetails),
    );
    const leftVersionId = versionDetailsRef.current.left?.id;
    if (isPipeline && leftVersionId) {
      // The pipeline editors that read a single version build their YAML and flow from this entry
      dispatch(
        eliteaApi.util.updateQueryData(
          'getApplicationVersionDetail',
          { projectId, applicationId, versionId: leftVersionId },
          draft => withCanvas(draft, draft),
        ),
      );
    }
    return fields;
  }, [dispatch, isPipeline, projectId, applicationId]);

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
