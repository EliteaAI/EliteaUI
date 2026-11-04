import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import YAML from 'js-yaml';
import { useDispatch } from 'react-redux';

import { Alert, Box } from '@mui/material';

import {
  EditEntityComparisonLayout,
  EditEntityModal,
  TextDiffHighlight,
} from '@/[fsd]/entities/edit-entity-with-ai';
import { useGeneratePipelineDraftMutation } from '@/[fsd]/features/pipelines/api/generatePipelineApi';
import {
  FlowEditorHelpers,
  LayoutHelpers,
  ParsePipelineHelpers,
} from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { toggleSet } from '@/[fsd]/features/pipelines/lib/helpers';
import { useLazySkillDetailsQuery, useUpdateSkillRelationMutation } from '@/[fsd]/features/skill/api';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { Input, Modal } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import {
  useLazyApplicationDetailsQuery,
  useToolkitAssociateMutation,
  useUpdateApplicationRelationMutation,
} from '@/api';
import { eliteaApi } from '@/api/eliteaApi';
import { buildErrorMessage } from '@/common/utils';
import { mapAssociationError } from '@/hooks/application/useAgentPipelineAssociation';
import useSaveNewVersion from '@/hooks/application/useSaveNewVersion';
import { actions } from '@/slices/pipeline';
import { actions as editorActions } from '@/slices/pipelineEditor';

import PipelineToolsDiffStep from './PipelineToolsDiffStep';
import PipelineYamlDiffStep from './PipelineYamlDiffStep';

const AIEditPipelineModal = memo(props => {
  const { open, onClose, isCreateMode = false } = props;

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

  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [isSavingAsVersion, setIsSavingAsVersion] = useState(false);
  const pendingDraftRef = useRef(null);

  // Tools diff state — populated when a draft is generated
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

  const steps = useMemo(
    () =>
      isCreateMode
        ? [
            { key: 'yaml', label: 'Pipeline YAML' },
            { key: 'run-settings', label: 'Run settings' },
          ]
        : [
            { key: 'yaml', label: 'Pipeline YAML' },
            { key: 'run-settings', label: 'Run settings' },
            { key: 'tools-skills', label: 'Tools & Skills' },
          ],
    [isCreateMode],
  );

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
      const tools = formik.values?.version_details?.tools || [];
      const currentToolkitIds = new Set(
        tools.filter(t => t.type !== 'application' && t.type?.toLowerCase() !== 'mcp').map(t => t.id),
      );
      const currentMcpIds = new Set(tools.filter(t => t.type?.toLowerCase() === 'mcp').map(t => t.id));
      const currentAgentAppIds = new Set(
        tools
          .filter(t => t.type === 'application' && t.agent_type === 'agent')
          .map(t => t.settings?.application_id)
          .filter(Boolean),
      );
      const currentPipelineAppIds = new Set(
        tools
          .filter(t => t.type === 'application' && t.agent_type === 'pipeline')
          .map(t => t.settings?.application_id)
          .filter(Boolean),
      );

      // Pre-select new suggested items (not already associated); deselect removes by default
      setAddToolkitIds(
        new Set(
          (draftData?.suggested_toolkits || []).filter(t => !currentToolkitIds.has(t.id)).map(t => t.id),
        ),
      );
      setAddMcpIds(
        new Set((draftData?.suggested_mcp || []).filter(m => !currentMcpIds.has(m.id)).map(m => m.id)),
      );
      setAddAgentIds(
        new Set(
          (draftData?.suggested_agents || []).filter(a => !currentAgentAppIds.has(a.id)).map(a => a.id),
        ),
      );
      setAddPipelineIds(
        new Set(
          (draftData?.suggested_pipelines || []).filter(p => !currentPipelineAppIds.has(p.id)).map(p => p.id),
        ),
      );
      // Skills are tracked separately — select any suggested skill not already attached.
      // (current skills come from formik as a separate skills list, but we don't have that here;
      // pre-select all suggested skills and let the user deselect.)
      setAddSkillIds(new Set((draftData?.suggested_skills || []).map(s => s.id)));
      setRemoveToolRecordIds(new Set());
      return draftData;
    },
    [formik.values?.version_details?.tools],
  );

  const handleSave = useCallback(
    async draftData => {
      const newYaml = draftData.pipeline_yaml ?? '';
      await formik.setFieldValue('version_details.instructions', newYaml);

      // Apply proposed name/description when present so the Run Settings diff is not cosmetic-only.
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
      dispatch(
        actions.initThePipeline({
          nodes: convertedNodes,
          edges,
          yamlJsonObject: parsedYamlJson,
          yamlCode: newYaml,
          layout_version: currentSettings.layout_version,
          orientation,
        }),
      );

      // Associate / disassociate tools when editing an existing pipeline (IDs available)
      const entityId = formik.values?.id;
      const versionId = formik.values?.version_details?.id;
      if (entityId && versionId) {
        const toolkitsToAdd = (draftData.suggested_toolkits || []).filter(t => addToolkitIds.has(t.id));
        const mcpsToAdd = (draftData.suggested_mcp || []).filter(m => addMcpIds.has(m.id));
        const agentsToAdd = (draftData.suggested_agents || []).filter(a => addAgentIds.has(a.id));
        const pipelinesToAdd = (draftData.suggested_pipelines || []).filter(p => addPipelineIds.has(p.id));
        const skillsToAdd = (draftData.suggested_skills || []).filter(s => addSkillIds.has(s.id));

        // Disassociate tools the user chose to remove
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

        // Associate selected skills
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

        // Disassociate: toolkit/mcp records use has_relation: false
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
        // Disassociate: application records need their version id
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

        // Fetch fresh tools without triggering Formik reinitialization.
        // fetchApplicationDetails updates the global RTK cache; with enableReinitialize on the
        // parent Formik the cache update would recompute initialValues from the stale server YAML
        // and overwrite the AI-applied YAML that was just dispatched to Redux.
        // Instead, fetch once then patch only version_details.tools in the existing cache entry
        // while preserving the AI-applied YAML, so the cache key stays consistent with what
        // lastInitYamlRef already guards.
        const { data: freshData } = await fetchApplicationDetails({
          projectId,
          applicationId: entityId,
        });
        if (freshData?.version_details?.tools) {
          const freshTools = freshData.version_details.tools;
          await formik.setFieldValue('version_details.tools', freshTools);
          dispatch(
            eliteaApi.util.updateQueryData(
              'applicationDetails',
              { projectId, applicationId: entityId },
              draft => {
                if (draft?.version_details) {
                  draft.version_details.tools = freshTools;
                  // Keep the AI-applied YAML so the cache key matches lastInitYamlRef and
                  // the useApplicationInitialValues guard skips re-initialization.
                  draft.version_details.instructions =
                    formik.values?.version_details?.instructions ?? draft.version_details.instructions;
                }
              },
            ),
          );
        }
      }
    },
    [
      formik,
      dispatch,
      associateToolkits,
      associateApplications,
      associateToolkit,
      updateApplicationRelation,
      updateSkillRelation,
      fetchApplicationDetails,
      fetchSkillDetails,
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

  const renderStep = useCallback(
    (stepKey, draftData) => {
      const warnings = draftData?.validation_result?.warnings ?? [];
      const warningBanner =
        warnings.length > 0 ? (
          <Alert
            severity="warning"
            sx={{ mx: '1.5rem', mt: '0.5rem', flexShrink: 0 }}
          >
            {warnings.map((w, i) => (
              <Box
                key={i}
                component="span"
                sx={{ display: 'block', fontSize: '0.8125rem' }}
              >
                {w.node_id ? `[${w.node_id}] ` : ''}
                {w.message}
              </Box>
            ))}
          </Alert>
        ) : null;

      if (stepKey === 'yaml') {
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {warningBanner}
            <PipelineYamlDiffStep
              originalYaml={formik.values?.version_details?.instructions ?? ''}
              proposedYaml={draftData?.pipeline_yaml ?? ''}
            />
          </Box>
        );
      }

      if (stepKey === 'run-settings') {
        const currentName = formik.values?.name ?? '';
        const currentDescription = formik.values?.description ?? '';
        const proposedName = draftData?.name ?? '';
        const proposedDescription = draftData?.description ?? '';
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {warningBanner}
            <EditEntityComparisonLayout
              currentContent={
                <Box sx={runSettingsColumnStyles}>
                  <Box sx={runSettingsFieldStyles}>
                    <Box sx={runSettingsLabelStyles}>Name</Box>
                    <Box sx={runSettingsReadCardStyles}>
                      <TextDiffHighlight
                        original={currentName}
                        modified={proposedName}
                        mode="original"
                      />
                    </Box>
                  </Box>
                  <Box sx={runSettingsFieldStyles}>
                    <Box sx={runSettingsLabelStyles}>Description</Box>
                    <Box sx={runSettingsReadCardStyles}>
                      {currentDescription ? (
                        <TextDiffHighlight
                          original={currentDescription}
                          modified={proposedDescription}
                          mode="original"
                        />
                      ) : (
                        <Box sx={runSettingsEmptyTextStyles}>No description</Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              }
              suggestedContent={
                <Box sx={runSettingsColumnStyles}>
                  <Box sx={runSettingsFieldStyles}>
                    <Box sx={runSettingsLabelStyles}>Name</Box>
                    <Box sx={runSettingsReadCardStyles}>
                      <TextDiffHighlight
                        original={currentName}
                        modified={proposedName}
                        mode="modified"
                      />
                    </Box>
                  </Box>
                  <Box sx={runSettingsFieldStyles}>
                    <Box sx={runSettingsLabelStyles}>Description</Box>
                    <Box sx={runSettingsReadCardStyles}>
                      {proposedDescription ? (
                        <TextDiffHighlight
                          original={currentDescription}
                          modified={proposedDescription}
                          mode="modified"
                        />
                      ) : (
                        <Box sx={runSettingsEmptyTextStyles}>No description</Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              }
            />
          </Box>
        );
      }

      if (stepKey === 'tools-skills') {
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {warningBanner}
            <PipelineToolsDiffStep
              currentTools={currentTools}
              draftData={draftData}
              addToolkitIds={addToolkitIds}
              onToggleAddToolkit={handleToggleAddToolkit}
              addMcpIds={addMcpIds}
              onToggleAddMcp={handleToggleAddMcp}
              addAgentIds={addAgentIds}
              onToggleAddAgent={handleToggleAddAgent}
              addPipelineIds={addPipelineIds}
              onToggleAddPipeline={handleToggleAddPipeline}
              addSkillIds={addSkillIds}
              onToggleAddSkill={handleToggleAddSkill}
              removeToolRecordIds={removeToolRecordIds}
              onToggleRemoveTool={handleToggleRemoveTool}
            />
          </Box>
        );
      }

      return null;
    },
    [
      formik.values,
      currentTools,
      addToolkitIds,
      handleToggleAddToolkit,
      addMcpIds,
      handleToggleAddMcp,
      addAgentIds,
      handleToggleAddAgent,
      addPipelineIds,
      handleToggleAddPipeline,
      addSkillIds,
      handleToggleAddSkill,
      removeToolRecordIds,
      handleToggleRemoveTool,
    ],
  );

  return (
    <>
      <EditEntityModal
        open={open}
        onClose={onClose}
        title="Edit Pipeline with AI"
        entityLabel="pipeline"
        placeholder="Describe the changes you want to make to this pipeline."
        onGenerate={handleGenerate}
        generateError={generateError}
        resetGenerate={resetGenerate}
        onDraftGenerated={handleDraftGenerated}
        steps={steps}
        renderStep={renderStep}
        onSave={handleSave}
        onSaveAsVersion={handleSaveAsVersion}
        isSavingAsVersion={isSavingAsVersion}
        saveLabel="Apply to Editor"
        savingLabel="Applying..."
        modalTestId="ai-edit-pipeline-modal"
        closeButtonTestId="ai-edit-pipeline-close-button"
        promptInputTestId="ai-edit-pipeline-prompt-input"
        errorAlertTestId="ai-edit-pipeline-error-alert"
        loadingIndicatorTestId="ai-edit-pipeline-loading-indicator"
        generateButtonTestId="ai-edit-pipeline-submit-button"
        cancelButtonTestId="ai-edit-pipeline-cancel-button"
        loadingText={isCreateMode ? 'Building pipeline...' : 'Generating pipeline changes...'}
      />

      {showVersionModal && (
        <Modal.BaseModal
          open={showVersionModal}
          title="Save as New Version"
          onClose={() => setShowVersionModal(false)}
          content={
            <Box sx={{ padding: '1rem 1.5rem' }}>
              <Input.InputBase
                label="Version name"
                fullWidth
                size="small"
                value={versionName}
                onChange={e => setVersionName(e.target.value)}
                autoFocus
                inputProps={{ 'data-testid': 'ai-edit-pipeline-version-name-input' }}
              />
            </Box>
          }
          actions={
            <>
              <Box sx={{ flex: 1 }} />
              <BaseBtn
                variant={BUTTON_VARIANTS.secondary}
                size="small"
                onClick={() => setShowVersionModal(false)}
                disabled={isSavingAsVersion}
              >
                Cancel
              </BaseBtn>
              <BaseBtn
                variant={BUTTON_VARIANTS.elitea}
                size="small"
                onClick={handleConfirmSaveAsVersion}
                disabled={isSavingAsVersion || !versionName.trim()}
                data-testid="ai-edit-pipeline-save-version-button"
              >
                {isSavingAsVersion ? 'Saving...' : 'Save Version'}
              </BaseBtn>
            </>
          }
        />
      )}
    </>
  );
});

AIEditPipelineModal.displayName = 'AIEditPipelineModal';

/** @type {MuiSx} */
const runSettingsColumnStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  padding: '1.5rem 2rem',
};

/** @type {MuiSx} */
const runSettingsFieldStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

/** @type {MuiSx} */
const runSettingsLabelStyles = {
  fontSize: '0.875rem',
  fontWeight: 500,
  lineHeight: '1.5rem',
  color: 'text.primary',
};

/** @type {MuiSx} */
const runSettingsReadCardStyles = ({ palette }) => ({
  padding: '0.5rem 1rem',
  borderRadius: '0.5rem',
  backgroundColor: palette.background.surface.interactive.default,
  border: `0.0625rem solid ${palette.border.lines}`,
  minHeight: '2.5rem',
});

/** @type {MuiSx} */
const runSettingsEmptyTextStyles = {
  fontSize: '0.75rem',
  color: 'text.primary',
  fontStyle: 'italic',
};

export default AIEditPipelineModal;
