import { useCallback, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import YAML from 'js-yaml';
import { useDispatch } from 'react-redux';

import { useGeneratePipelineDraftMutation } from '@/[fsd]/features/pipelines/api/generatePipelineApi';
import {
  FlowEditorHelpers,
  LayoutHelpers,
  ParsePipelineHelpers,
} from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { toggleSet } from '@/[fsd]/features/pipelines/lib/helpers';
import { getAttachmentKey } from '@/[fsd]/features/pipelines/tool-picker/lib/helpers/attachmentDiff.helpers';
import {
  buildApplicationAttachment,
  buildToolkitAttachment,
} from '@/[fsd]/features/pipelines/tool-picker/lib/helpers/attachmentTool.helpers';
import { useLazySkillDetailsQuery, useUpdateSkillRelationMutation } from '@/[fsd]/features/skill/api';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import {
  useLazyApplicationDetailsQuery,
  useLazyGetApplicationVersionDetailQuery,
  useLazyToolkitsDetailsQuery,
  useToolkitAssociateMutation,
  useUpdateApplicationRelationMutation,
} from '@/api';
import { buildErrorMessage } from '@/common/utils';
import { mapAssociationError } from '@/hooks/application/useAgentPipelineAssociation';
import useSaveNewVersion from '@/hooks/application/useSaveNewVersion';
import { actions } from '@/slices/pipeline';
import { actions as editorActions } from '@/slices/pipelineEditor';

import { computeInitialSelections, getRemoveId, normaliseCurrentTool } from '../helpers';

export const useAIEditPipelineModal = ({ isCreateMode, onClose }) => {
  const formik = useFormikContext();
  const dispatch = useDispatch();
  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess, toastWarning } = useToast();

  const onCreateNewVersionRef = useRef(null);

  const [generateDraft, { error: generateError, reset: resetGenerate }] = useGeneratePipelineDraftMutation();

  const [associateToolkit] = useToolkitAssociateMutation();
  const [updateApplicationRelation] = useUpdateApplicationRelationMutation();
  const [updateSkillRelation] = useUpdateSkillRelationMutation();
  const [fetchApplicationDetails] = useLazyApplicationDetailsQuery();
  const [fetchSkillDetails] = useLazySkillDetailsQuery();
  const [fetchToolkitDetails] = useLazyToolkitsDetailsQuery();
  const [fetchVersionDetail] = useLazyGetApplicationVersionDetailQuery();

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

  const associateToolkits = useCallback(
    async (versionId, entityId, toolkits) => {
      if (!versionId || !toolkits.length) return;
      await Promise.allSettled(
        toolkits.map(t =>
          associateToolkit({
            projectId,
            toolkitId: t.id,
            entity_version_id: versionId,
            entity_id: entityId,
            entity_type: 'agent',
            has_relation: true,
          }).unwrap(),
        ),
      );
    },
    [associateToolkit, projectId],
  );

  const associateApplications = useCallback(
    async (versionId, entityId, apps) => {
      if (!versionId || !apps.length) return;
      const results = await Promise.allSettled(
        apps.map(async a => {
          const appProjectId = a.project_id ?? projectId;
          const { data: appDetails } = await fetchApplicationDetails({
            projectId: appProjectId,
            applicationId: a.id,
          });
          if (!appDetails?.version_details?.id) return;
          try {
            return await updateApplicationRelation({
              projectId: appProjectId,
              selectedApplicationId: a.id,
              selectedVersionId: appDetails.version_details.id,
              application_id: entityId,
              version_id: versionId,
              has_relation: true,
            }).unwrap();
          } catch (error) {
            throw { name: a.name, entityLabel: a.agent_type === 'pipeline' ? 'pipeline' : 'agent', error };
          }
        }),
      );
      results
        .filter(r => r.status === 'rejected')
        .forEach(r => {
          const { name, entityLabel, error } = r.reason || {};
          const rawMsg = error?.data?.error || buildErrorMessage(error);
          toastWarning(mapAssociationError(rawMsg, name || 'agent', { action: 'add', entityLabel }));
        });
    },
    [fetchApplicationDetails, updateApplicationRelation, projectId, toastWarning],
  );

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

  const handleSave = useCallback(
    async draftData => {
      const newYaml = draftData.pipeline_yaml ?? '';
      await formik.setFieldValue('version_details.instructions', newYaml);

      if (draftData.name) {
        await formik.setFieldValue('name', draftData.name);
      }
      if (draftData.description != null) {
        await formik.setFieldValue('description', draftData.description);
      }

      // Re-initialize the Redux pipeline slice so the flow canvas re-renders with the new YAML.
      // setFieldValue alone only updates Formik; the canvas reads from Redux (selectActivePipeline).
      let parsedYamlJson = {};
      try {
        parsedYamlJson = YAML.load(newYaml) || {};
      } catch {
        // keep empty object — canvas will show an empty pipeline
      }

      const currentSettings = formik.values?.version_details?.pipeline_settings || {};
      const orientation = currentSettings.orientation;

      const { nodes: parsedNodes, edges: parsedEdges } = ParsePipelineHelpers.parseYaml(
        parsedYamlJson,
        orientation,
      );
      const { nodes, edges } = LayoutHelpers.doLayout({
        nodes: parsedNodes,
        edges: parsedEdges,
        orientation,
        flowNodes: currentSettings.nodes || [],
      });
      const convertedNodes = nodes.map(node =>
        FlowEditorHelpers.convertNode(node, currentSettings.layout_version),
      );

      dispatch(editorActions.resetPipelineEditor());
      // On an existing pipeline the draft is an unsaved edit, so Discard must still return to the saved
      // version; the create page has no saved version, so the draft becomes its starting point
      const loadPipeline = isCreateMode ? actions.initThePipeline : actions.applyPipelineDraft;
      dispatch(
        loadPipeline({
          nodes: convertedNodes,
          edges,
          yamlJsonObject: parsedYamlJson,
          yamlCode: newYaml,
          layout_version: currentSettings.layout_version,
          orientation,
        }),
      );

      // In create mode: build full tool entries from selected suggestions and write them into
      // formik so the existing Save button sends them in the create payload.
      // Suggestion objects carry only id/name — fetch full details for every tool type so the
      // BE receives the correct settings (e.g. sharepoint_configuration, url, available_tools).
      if (isCreateMode) {
        const toolkitsToAdd = (draftData.suggested_toolkits || []).filter(t => addToolkitIds.has(t.id));
        const mcpsToAdd = (draftData.suggested_mcp || []).filter(m => addMcpIds.has(m.id));
        const agentsToAdd = (draftData.suggested_agents || []).filter(a => addAgentIds.has(a.id));
        const pipelinesToAdd = (draftData.suggested_pipelines || []).filter(p => addPipelineIds.has(p.id));

        const pendingTools = [];

        // Fetch full toolkit details so settings are populated correctly.
        const toolkitResults = await Promise.allSettled(
          [...toolkitsToAdd, ...mcpsToAdd].map(async t => {
            const tkProjectId = t.project_id ?? projectId;
            const { data: tkDetails } = await fetchToolkitDetails({
              projectId: tkProjectId,
              toolkitId: t.id,
            });
            const isMcp = mcpsToAdd.includes(t);
            return buildToolkitAttachment(tkDetails ?? t, { mcp: isMcp });
          }),
        );
        toolkitResults.forEach(r => {
          if (r.status === 'fulfilled') pendingTools.push(r.value);
        });

        // Applications require a version_id — fetch each before building the attachment.
        const appResults = await Promise.allSettled(
          [...agentsToAdd, ...pipelinesToAdd].map(async a => {
            const appProjectId = a.project_id ?? projectId;
            const { data: appDetails } = await fetchApplicationDetails({
              projectId: appProjectId,
              applicationId: a.id,
            });
            return buildApplicationAttachment(a, appDetails?.version_details);
          }),
        );
        appResults.forEach(r => {
          if (r.status === 'fulfilled') pendingTools.push(r.value);
        });

        // Merge into what the create form already has: keep tools the user did not tick for removal and
        // skip suggestions that are already attached, so applying a draft never wipes earlier work
        const formTools = formik.values?.version_details?.tools || [];
        const kept = formTools.filter(t => !removeToolRecordIds.has(getRemoveId(normaliseCurrentTool(t))));
        const keptKeys = new Set(kept.map(t => getAttachmentKey(t)));
        const added = pendingTools.filter(t => !keptKeys.has(getAttachmentKey(t)));
        await formik.setFieldValue('version_details.tools', [...kept, ...added]);

        // A skill needs a version to attach to, which only exists after the first Save; the create page
        // attaches these once the pipeline is created
        const skillsToAdd = (draftData.suggested_skills || []).filter(s => addSkillIds.has(s.id));
        await formik.setFieldValue('pending_skills', skillsToAdd);
        return;
      }

      // Associate / disassociate tools when editing an existing pipeline (IDs available)
      const entityId = formik.values?.id;
      const versionId = formik.values?.version_details?.id;
      if (entityId && versionId) {
        const toolkitsToAdd = (draftData.suggested_toolkits || []).filter(t => addToolkitIds.has(t.id));
        const mcpsToAdd = (draftData.suggested_mcp || []).filter(m => addMcpIds.has(m.id));
        const agentsToAdd = (draftData.suggested_agents || []).filter(a => addAgentIds.has(a.id));
        const pipelinesToAdd = (draftData.suggested_pipelines || []).filter(p => addPipelineIds.has(p.id));
        const skillsToAdd = (draftData.suggested_skills || []).filter(s => addSkillIds.has(s.id));

        const tools = formik.values?.version_details?.tools || [];
        const toolkitsToRemove = tools.filter(
          t => t.type !== 'application' && t.type?.toLowerCase() !== 'mcp' && removeToolRecordIds.has(t.id),
        );
        const mcpsToRemove = tools.filter(
          t => t.type?.toLowerCase() === 'mcp' && removeToolRecordIds.has(t.id),
        );
        const appsToRemove = tools.filter(t => t.type === 'application' && removeToolRecordIds.has(t.id));

        await associateToolkits(versionId, entityId, [...toolkitsToAdd, ...mcpsToAdd]);
        await associateApplications(versionId, entityId, [...agentsToAdd, ...pipelinesToAdd]);

        if (skillsToAdd.length) {
          await Promise.allSettled(
            skillsToAdd.map(async skill => {
              const skillProjectId = skill.project_id ?? projectId;
              const { data: skillDetails } = await fetchSkillDetails({
                projectId: skillProjectId,
                skillId: skill.id,
              });
              if (!skillDetails?.version_details?.id) return;
              return updateSkillRelation({
                projectId,
                skillId: skill.id,
                entity_version_id: versionId,
                skill_version_id: skillDetails.version_details.id,
                has_relation: true,
              }).unwrap();
            }),
          );
        }

        if (toolkitsToRemove.length || mcpsToRemove.length) {
          await Promise.allSettled(
            [...toolkitsToRemove, ...mcpsToRemove].map(t =>
              associateToolkit({
                projectId,
                toolkitId: t.id,
                entity_version_id: versionId,
                entity_id: entityId,
                entity_type: 'agent',
                has_relation: false,
              }).unwrap(),
            ),
          );
        }

        if (appsToRemove.length) {
          await Promise.allSettled(
            appsToRemove.map(async a => {
              const appVersionId = a.settings?.application_version_id;
              if (!appVersionId) return;
              return updateApplicationRelation({
                projectId,
                selectedApplicationId: a.settings?.application_id,
                selectedVersionId: appVersionId,
                application_id: entityId,
                version_id: versionId,
                has_relation: false,
              }).unwrap();
            }),
          );
        }

        // Read the attached tools back from the version endpoint: it is not the `applicationDetails` query the
        // edit page's Formik reinitializes from, so the AI-applied name, description and YAML stay unsaved
        // edits that Discard and the leave-page warning still see
        const { data: freshVersion } = await fetchVersionDetail({
          projectId,
          applicationId: entityId,
          versionId,
        });
        if (freshVersion?.tools) {
          await formik.setFieldValue('version_details.tools', freshVersion.tools);
        }
      }
    },
    [
      isCreateMode,
      formik,
      dispatch,
      associateToolkits,
      associateApplications,
      associateToolkit,
      updateApplicationRelation,
      updateSkillRelation,
      fetchApplicationDetails,
      fetchToolkitDetails,
      fetchSkillDetails,
      fetchVersionDetail,
      projectId,
      addToolkitIds,
      addMcpIds,
      addAgentIds,
      addPipelineIds,
      addSkillIds,
      removeToolRecordIds,
    ],
  );

  const handleSaveAsVersion = useCallback(draftData => {
    pendingDraftRef.current = draftData;
    setVersionName('');
    setShowVersionModal(true);
  }, []);

  const handleConfirmSaveAsVersion = useCallback(async () => {
    const draftData = pendingDraftRef.current;
    if (!draftData) return;

    setIsSavingAsVersion(true);
    try {
      // Apply the draft to Formik and Redux first (same as "Apply to Editor") so that
      // useSavePipeline's yamlCode selector and pipeline_settings reflect the AI-applied YAML
      // when onCreateNewVersion reads them.
      await handleSave(draftData);
      // onCreateNewVersion reads yamlCode from Redux (via useSavePipeline) and versionDetails
      // from its own hook props, so passing only the version name is sufficient.
      await onCreateNewVersionRef.current?.(versionName || formik.values?.version_details?.name);
      setShowVersionModal(false);
      onClose();
    } catch {
      // error already toasted by useSaveNewVersion
    } finally {
      setIsSavingAsVersion(false);
    }
  }, [handleSave, formik.values, versionName, onClose]);

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
