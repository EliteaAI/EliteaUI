import { useCallback, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import YAML from 'js-yaml';
import { useDispatch, useStore } from 'react-redux';

import { useGeneratePipelineDraftMutation } from '@/[fsd]/features/pipelines/api/generatePipelineApi';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { DEFAULT_PIPELINE_KEY } from '@/[fsd]/features/pipelines/lib/constants';
import { toggleSet } from '@/[fsd]/features/pipelines/lib/helpers';
import { getAttachmentKey } from '@/[fsd]/features/pipelines/tool-picker/lib/helpers/attachmentDiff.helpers';
import {
  buildApplicationAttachment,
  buildToolkitAttachment,
} from '@/[fsd]/features/pipelines/tool-picker/lib/helpers/attachmentTool.helpers';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { useLazyApplicationDetailsQuery, useLazyToolkitsDetailsQuery } from '@/api';
import useSaveNewVersion from '@/hooks/application/useSaveNewVersion';
import { calculateNodesAndEdges } from '@/pages/Pipelines/useSavePipeline';
import { actions } from '@/slices/pipeline';
import { actions as editorActions } from '@/slices/pipelineEditor';

import { computeInitialSelections, getRemoveId, normaliseCurrentTool } from '../helpers';
import { useAttachSkills } from './useAttachSkills.hooks';

const CANVAS_SETTLE_INTERVAL_MS = 100;
const CANVAS_SETTLE_MAX_CHECKS = 30;

export const useAIEditPipelineModal = ({ isCreateMode, onClose }) => {
  const formik = useFormikContext();
  const dispatch = useDispatch();
  const store = useStore();
  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();

  const onCreateNewVersionRef = useRef(null);

  const [generateDraft, { error: generateError, reset: resetGenerate }] = useGeneratePipelineDraftMutation();

  const [fetchApplicationDetails] = useLazyApplicationDetailsQuery();
  const [fetchToolkitDetails] = useLazyToolkitsDetailsQuery();
  const attachSkills = useAttachSkills();

  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [isSavingAsVersion, setIsSavingAsVersion] = useState(false);
  const pendingDraftRef = useRef(null);

  const [addToolkitIds, setAddToolkitIds] = useState(new Set());
  const [addMcpIds, setAddMcpIds] = useState(new Set());
  const [addAgentIds, setAddAgentIds] = useState(new Set());
  const [addPipelineIds, setAddPipelineIds] = useState(new Set());
  const [addSkillIds, setAddSkillIds] = useState(new Set());
  const [removeToolRecordIds, setRemoveToolRecordIds] = useState(new Set());

  const handleToggleAddToolkit = useCallback(id => toggleSet(setAddToolkitIds)(id), []);
  const handleToggleAddMcp = useCallback(id => toggleSet(setAddMcpIds)(id), []);
  const handleToggleAddAgent = useCallback(id => toggleSet(setAddAgentIds)(id), []);
  const handleToggleAddPipeline = useCallback(id => toggleSet(setAddPipelineIds)(id), []);
  const handleToggleAddSkill = useCallback(id => toggleSet(setAddSkillIds)(id), []);
  const handleToggleRemoveTool = useCallback(id => toggleSet(setRemoveToolRecordIds)(id), []);

  const currentTools = useMemo(
    () => formik.values?.version_details?.tools || [],
    [formik.values?.version_details?.tools],
  );

  const { onCreateNewVersion } = useSaveNewVersion({
    toastError,
    toastSuccess,
    applicationId: formik.values?.id,
    versionDetails: {
      ...formik.values?.version_details,
      id: undefined,
    },
    sourceVersionId: formik.values?.version_details?.id,
    webhook_secret: formik.values?.webhook_secret,
  });

  onCreateNewVersionRef.current = onCreateNewVersion;

  const handleGenerate = useCallback(
    description =>
      generateDraft({
        projectId,
        user_description: description,
        pipeline_id: formik.values?.id,
        version_id: formik.values?.version_details?.id,
        llm_settings: formik.values?.version_details?.llm_settings,
      }),
    [generateDraft, projectId, formik.values],
  );

  const handleDraftGenerated = useCallback(
    draftData => {
      const selections = computeInitialSelections(draftData, formik.values?.version_details?.tools);
      setAddToolkitIds(selections.addToolkitIds);
      setAddMcpIds(selections.addMcpIds);
      setAddAgentIds(selections.addAgentIds);
      setAddPipelineIds(selections.addPipelineIds);
      setAddSkillIds(selections.addSkillIds);
      setRemoveToolRecordIds(selections.removeToolRecordIds);
      return draftData;
    },
    [formik.values?.version_details?.tools],
  );

  // Builds the form attachment for every ticked suggestion. Suggestions carry only ids and names, so the full
  // toolkit (settings, available tools) and application version are read first, as the node pickers do.
  const buildSelectedAttachments = useCallback(
    async draftData => {
      const pick = (list, ids) => (list || []).filter(item => ids.has(item.id));
      const mcps = pick(draftData.suggested_mcp, addMcpIds);
      const toolkits = [...pick(draftData.suggested_toolkits, addToolkitIds), ...mcps];
      const apps = [
        ...pick(draftData.suggested_agents, addAgentIds),
        ...pick(draftData.suggested_pipelines, addPipelineIds),
      ];
      const results = await Promise.allSettled([
        ...toolkits.map(async t => {
          const { data } = await fetchToolkitDetails({
            projectId: t.project_id ?? projectId,
            toolkitId: t.id,
          });
          return buildToolkitAttachment(data ?? t, { mcp: mcps.includes(t) });
        }),
        ...apps.map(async a => {
          const { data } = await fetchApplicationDetails({
            projectId: a.project_id ?? projectId,
            applicationId: a.id,
          });
          return buildApplicationAttachment(a, data?.version_details);
        }),
      ]);
      return results.filter(r => r.status === 'fulfilled').map(r => r.value);
    },
    [
      addAgentIds,
      addMcpIds,
      addPipelineIds,
      addToolkitIds,
      fetchApplicationDetails,
      fetchToolkitDetails,
      projectId,
    ],
  );

  const handleSave = useCallback(
    async draftData => {
      const newYaml = draftData.pipeline_yaml ?? '';
      await formik.setFieldValue('version_details.instructions', newYaml);
      if (draftData.name) await formik.setFieldValue('name', draftData.name);
      if (draftData.description != null) await formik.setFieldValue('description', draftData.description);

      // The canvas reads the pipeline from Redux, so the draft is loaded there too. Nodes keep their
      // position on the canvas; only the ones the draft adds are arranged.
      const {
        orientation,
        layout_version: layoutVersion,
        nodes: flowNodes = [],
      } = formik.values?.version_details?.pipeline_settings || {};
      const { nodes, edges } = calculateNodesAndEdges(newYaml, orientation, flowNodes);
      let yamlJsonObject = {};
      try {
        yamlJsonObject = YAML.load(newYaml) || {};
      } catch {
        // an unparsable draft leaves an empty canvas, as the YAML editor does
      }
      dispatch(editorActions.resetPipelineEditor());
      // On an existing pipeline the draft is an unsaved edit, so Discard must still return to the saved
      // version; the create page has no saved version, so the draft becomes its starting point
      const loadPipeline = isCreateMode ? actions.initThePipeline : actions.applyPipelineDraft;
      dispatch(
        loadPipeline({
          nodes: nodes.map(node => FlowEditorHelpers.convertNode(node, layoutVersion)),
          edges,
          yamlJsonObject,
          yamlCode: newYaml,
          layout_version: layoutVersion,
          orientation,
        }),
      );

      // Selections only change the form: Save applies the relations (useApplyPipelineAttachments), exactly as
      // for tools picked in nodes, and Discard reverts them with the rest of the draft
      const formTools = formik.values?.version_details?.tools || [];
      const kept = formTools.filter(t => !removeToolRecordIds.has(getRemoveId(normaliseCurrentTool(t))));
      const keptKeys = new Set(kept.map(getAttachmentKey));
      const added = (await buildSelectedAttachments(draftData)).filter(
        t => !keptKeys.has(getAttachmentKey(t)),
      );
      await formik.setFieldValue('version_details.tools', [...kept, ...added]);

      const skills = (draftData.suggested_skills || []).filter(s => addSkillIds.has(s.id));
      if (isCreateMode) {
        // A skill relation needs a version, which only exists after the first Save of a new pipeline
        await formik.setFieldValue('pending_skills', skills);
      } else {
        await attachSkills(skills, formik.values?.version_details?.id);
      }
    },
    [
      addSkillIds,
      attachSkills,
      buildSelectedAttachments,
      dispatch,
      formik,
      isCreateMode,
      removeToolRecordIds,
    ],
  );

  const handleSaveAsVersion = useCallback(draftData => {
    pendingDraftRef.current = draftData;
    setVersionName('');
    setShowVersionModal(true);
  }, []);

  // The canvas fills in node defaults and rewrites the draft in the editor's YAML format after it renders it.
  // A version created before that stores YAML the editor rewrites again on open, so it opens as changed.
  const waitForCanvasYaml = useCallback(async () => {
    const readYaml = () => store.getState().pipeline.byKey[DEFAULT_PIPELINE_KEY] || {};
    let previous = null;
    for (let i = 0; i < CANVAS_SETTLE_MAX_CHECKS; i++) {
      await new Promise(resolve => setTimeout(resolve, CANVAS_SETTLE_INTERVAL_MS));
      const { resetFlag, yamlCode } = readYaml();
      if (!resetFlag && yamlCode === previous) break;
      previous = yamlCode;
    }
    return readYaml().yamlCode;
  }, [store]);

  const handleConfirmSaveAsVersion = useCallback(async () => {
    const draftData = pendingDraftRef.current;
    if (!draftData) return;

    setIsSavingAsVersion(true);
    try {
      // Name and description belong to the pipeline, and a new version does not save them, so they are not applied
      await handleSave({ ...draftData, name: undefined, description: undefined });
      const yamlCode = await waitForCanvasYaml();
      // Passed in because this callback was created before the canvas re-rendered the draft
      const result = await onCreateNewVersionRef.current?.(
        versionName || formik.values?.version_details?.name,
        { yamlCode },
      );
      if (!result?.data?.id) return;
      // The form and canvas (YAML and layout) now hold the saved version; marking them clean lets the redirect
      // to it through instead of being blocked as leaving with unsaved changes
      formik.resetForm({
        values: {
          ...formik.values,
          version_details: { ...formik.values.version_details, instructions: yamlCode },
        },
      });
      dispatch(actions.markPipelineSaved({ nodes: store.getState().pipelineEditor.nodes }));
      setShowVersionModal(false);
      onClose();
    } catch {
      // error already toasted by useSaveNewVersion
    } finally {
      setIsSavingAsVersion(false);
    }
  }, [dispatch, formik, handleSave, onClose, store, versionName, waitForCanvasYaml]);

  return {
    generateError,
    resetGenerate,
    currentTools,
    addToolkitIds,
    addMcpIds,
    addAgentIds,
    addPipelineIds,
    addSkillIds,
    removeToolRecordIds,
    handleToggleAddToolkit,
    handleToggleAddMcp,
    handleToggleAddAgent,
    handleToggleAddPipeline,
    handleToggleAddSkill,
    handleToggleRemoveTool,
    handleGenerate,
    handleDraftGenerated,
    handleSave,
    handleSaveAsVersion,
    showVersionModal,
    setShowVersionModal,
    versionName,
    setVersionName,
    isSavingAsVersion,
    handleConfirmSaveAsVersion,
  };
};
