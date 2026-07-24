import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import { flushSync } from 'react-dom';

import { EditEntityModal } from '@/[fsd]/entities/edit-entity-with-ai';
import { resolveEntityType } from '@/[fsd]/entities/edit-entity-with-ai/lib/helpers';
import { useGenerateAgentDraftMutation } from '@/[fsd]/features/agent/api';
import { EDIT_STEP_KEYS } from '@/[fsd]/features/agent/lib/constants';
import { AgentAIEditionStepsHelpers } from '@/[fsd]/features/agent/lib/helpers';
import {
  useGetApplicationSkillsQuery,
  useLazySkillDetailsQuery,
  useUpdateSkillRelationMutation,
} from '@/[fsd]/features/skill/api';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Input, Modal } from '@/[fsd]/shared/ui';
import {
  useLazyApplicationDetailsQuery,
  useToolkitAssociateMutation,
  useUpdateApplicationRelationMutation,
} from '@/api';
import { filterEmptyStrings } from '@/common/applicationUtils';
import { buildErrorMessage } from '@/common/utils';
import { mapAssociationError } from '@/hooks/application/useAgentPipelineAssociation';
import useSaveNewVersion from '@/hooks/application/useSaveNewVersion';
import useSaveVersion from '@/hooks/application/useSaveVersion';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

import { GeneralStep, InstructionsStep, SummaryStep, ToolsSkillsStep, UserInteractionStep } from './steps';

const DEFAULT_FIELD_FLAGS = {
  name: true,
  description: true,
  instructions: true,
  welcome_message: true,
  conversation_starters: true,
};

const AIEditAgentModal = memo(props => {
  const { open, onClose } = props;

  const currentDataRef = useRef(null);
  const pendingDraftDataRef = useRef(null);
  const onCreateNewVersionRef = useRef(null);
  const saveVersionRef = useRef(null);

  const formik = useFormikContext();
  const projectId = useSelectedProjectId();
  const { toastWarning, toastError, toastSuccess } = useToast();

  const [generateDraft, { error: generateError, reset: resetGenerate }] = useGenerateAgentDraftMutation();
  const [associateToolkit] = useToolkitAssociateMutation();
  const [updateApplicationRelation] = useUpdateApplicationRelationMutation();
  const [updateSkillRelation] = useUpdateSkillRelationMutation();
  const [fetchApplicationDetails] = useLazyApplicationDetailsQuery();
  const [fetchSkillDetails] = useLazySkillDetailsQuery();

  const [steps, setSteps] = useState([]);
  const [fieldApplyFlags, setFieldApplyFlags] = useState(DEFAULT_FIELD_FLAGS);
  const [toolSelections, setToolSelections] = useState({
    toAdd: new Set(),
    toRemove: new Set(),
    toKeep: new Set(),
  });
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [isSavingAsVersion, setIsSavingAsVersion] = useState(false);

  const { onCreateNewVersion } = useSaveNewVersion({
    toastError,
    toastSuccess,
    applicationId: formik.values.id,
    versionDetails: {
      ...formik.values.version_details,
      id: undefined,
    },
    sourceVersionId: formik.values.version_details?.id,
    webhook_secret: formik.values.webhook_secret,
  });

  onCreateNewVersionRef.current = onCreateNewVersion;

  const { onSave: saveVersion } = useSaveVersion();
  saveVersionRef.current = saveVersion;

  useEffect(() => {
    if (!open) {
      setSteps([]);
      setFieldApplyFlags(DEFAULT_FIELD_FLAGS);
      setToolSelections({ toAdd: new Set(), toRemove: new Set(), toKeep: new Set() });
      setShowVersionModal(false);
      setVersionName('');
      setIsSavingAsVersion(false);
      currentDataRef.current = null;
      pendingDraftDataRef.current = null;
    }
  }, [open]);

  const entityVersionId = formik.values.version_details?.id;
  const { data: applicationSkills } = useGetApplicationSkillsQuery(
    { projectId, appVersionId: entityVersionId },
    { skip: !projectId || !entityVersionId },
  );

  const handleGenerate = useCallback(
    description => {
      currentDataRef.current = structuredClone(formik.values);

      return generateDraft({
        projectId,
        user_description: description,
        application_id: formik.values.id,
        version_id: formik.values.version_details?.id,
        llm_settings: formik.values.version_details?.llm_settings,
      });
    },
    [generateDraft, projectId, formik.values],
  );

  const handleDraftGenerated = useCallback(
    draftData => {
      const currentAppId = currentDataRef.current?.id;

      const filtered = {
        ...draftData,
        suggested_agents: (draftData.suggested_agents || []).filter(a => a.application_id !== currentAppId),
        suggested_pipelines: (draftData.suggested_pipelines || []).filter(
          p => p.application_id !== currentAppId,
        ),
      };

      const visibleSteps = AgentAIEditionStepsHelpers.computeVisibleSteps(currentDataRef.current, filtered);

      setSteps(visibleSteps);
      setFieldApplyFlags({ ...DEFAULT_FIELD_FLAGS });

      const snapshotTools = (currentDataRef.current?.version_details?.tools || []).map(t =>
        t.type === 'application' ? { ...t, id: t.settings?.application_id ?? t.id } : t,
      );
      const snapshotSkills = (applicationSkills?.skills || []).map(s => ({
        ...s,
        id: s.skill_id,
        type: 'skill',
      }));
      const allCurrentTools = [...snapshotTools, ...snapshotSkills];

      const currentKeys = new Set(allCurrentTools.map(t => `${resolveEntityType(t)}:${t.id}`));

      const allSuggestedKeys = new Set([
        ...(filtered.suggested_toolkits || []).map(t => `toolkit:${t.id}`),
        ...(filtered.suggested_mcp || []).map(m => `mcp:${m.id}`),
        ...(filtered.suggested_agents || []).map(a => `agent:${a.id}`),
        ...(filtered.suggested_pipelines || []).map(p => `pipeline:${p.id}`),
        ...(filtered.suggested_skills || []).map(s => `skill:${s.id}`),
      ]);

      const addIds = new Set([...allSuggestedKeys].filter(key => !currentKeys.has(key)));
      const keepIds = new Set([...allSuggestedKeys].filter(key => currentKeys.has(key)));
      const removeIds = new Set([...currentKeys].filter(key => !allSuggestedKeys.has(key)));

      setToolSelections({ toAdd: addIds, toRemove: removeIds, toKeep: keepIds });

      return filtered;
    },
    [applicationSkills?.skills],
  );

  const handleToggleField = useCallback(field => {
    setFieldApplyFlags(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const handleToggleTool = useCallback((group, id) => {
    setToolSelections(prev => {
      const next = new Set(prev[group]);

      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, [group]: next };
    });
  }, []);

  const applyToolAssociations = useCallback(
    async (draftData, targetVersionId) => {
      const entityId = formik.values.id;
      const versionId = targetVersionId || formik.values.version_details?.id;

      if (!versionId) return;

      const snapshotTools = (formik.values.version_details?.tools || []).map(t =>
        t.type === 'application' ? { ...t, id: t.settings?.application_id ?? t.id } : t,
      );
      const snapshotSkills = (applicationSkills?.skills || []).map(s => ({
        ...s,
        id: s.skill_id,
        type: 'skill',
      }));
      const allCurrent = [...snapshotTools, ...snapshotSkills];

      const allSuggestedKeys = new Set([
        ...(draftData.suggested_toolkits || []).map(t => `toolkit:${t.id}`),
        ...(draftData.suggested_mcp || []).map(m => `mcp:${m.id}`),
        ...(draftData.suggested_agents || []).map(a => `agent:${a.id}`),
        ...(draftData.suggested_pipelines || []).map(p => `pipeline:${p.id}`),
        ...(draftData.suggested_skills || []).map(s => `skill:${s.id}`),
      ]);

      const toolkitsToRemove = [];
      const appsToRemove = [];
      const skillsToRemove = [];

      allCurrent.forEach(t => {
        const type = resolveEntityType(t);
        const key = `${type}:${t.id}`;

        const shouldRemove = allSuggestedKeys.has(key)
          ? !toolSelections.toKeep.has(key)
          : toolSelections.toRemove.has(key);

        if (!shouldRemove) return;

        if (type === 'skill') skillsToRemove.push(t);
        else if (t.type === 'application') appsToRemove.push(t);
        else toolkitsToRemove.push(t);
      });

      const toolkitsToAdd = [
        ...(draftData.suggested_toolkits || []).filter(t => toolSelections.toAdd.has(`toolkit:${t.id}`)),
        ...(draftData.suggested_mcp || []).filter(m => toolSelections.toAdd.has(`mcp:${m.id}`)),
      ];

      const appsToAdd = [
        ...(draftData.suggested_agents || []).filter(a => toolSelections.toAdd.has(`agent:${a.id}`)),
        ...(draftData.suggested_pipelines || []).filter(p => toolSelections.toAdd.has(`pipeline:${p.id}`)),
      ];

      const skillsToAdd = (draftData.suggested_skills || []).filter(s =>
        toolSelections.toAdd.has(`skill:${s.id}`),
      );

      if (toolkitsToAdd.length > 0) {
        await Promise.allSettled(
          toolkitsToAdd.map(t =>
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
      }

      if (toolkitsToRemove.length > 0) {
        await Promise.allSettled(
          toolkitsToRemove.map(t =>
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

      if (appsToAdd.length > 0) {
        const results = await Promise.allSettled(
          appsToAdd.map(async a => {
            const { data: appDetails } = await fetchApplicationDetails({
              projectId,
              applicationId: a.id,
            });

            if (!appDetails?.version_details?.id) return;
            try {
              return await updateApplicationRelation({
                projectId,
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
      }

      if (appsToRemove.length > 0) {
        await Promise.allSettled(
          appsToRemove.map(async a => {
            const { data: appDetails } = await fetchApplicationDetails({
              projectId,
              applicationId: a.id,
            });

            if (!appDetails?.version_details?.id) return;
            return updateApplicationRelation({
              projectId,
              selectedApplicationId: a.id,
              selectedVersionId: appDetails.version_details.id,
              application_id: entityId,
              version_id: versionId,
              has_relation: false,
            }).unwrap();
          }),
        );
      }

      if (skillsToAdd.length > 0) {
        await Promise.allSettled(
          skillsToAdd.map(async skill => {
            const { data: skillDetails } = await fetchSkillDetails({
              projectId,
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

      if (skillsToRemove.length > 0) {
        await Promise.allSettled(
          skillsToRemove.map(async skill => {
            const { data: skillDetails } = await fetchSkillDetails({
              projectId,
              skillId: skill.id,
            });

            if (!skillDetails?.version_details?.id) return;

            return updateSkillRelation({
              projectId,
              skillId: skill.id,
              entity_version_id: versionId,
              skill_version_id: skillDetails.version_details.id,
              has_relation: false,
            }).unwrap();
          }),
        );
      }
    },
    [
      formik.values,
      toolSelections,
      applicationSkills?.skills,
      associateToolkit,
      updateApplicationRelation,
      updateSkillRelation,
      fetchApplicationDetails,
      fetchSkillDetails,
      projectId,
      toastWarning,
    ],
  );

  const applyFieldChanges = useCallback(
    draftData => {
      if (fieldApplyFlags.name) formik.setFieldValue('name', draftData.name || '');

      if (fieldApplyFlags.description) formik.setFieldValue('description', draftData.description || '');

      if (fieldApplyFlags.instructions)
        formik.setFieldValue('version_details.instructions', draftData.instructions || '');

      if (fieldApplyFlags.welcome_message)
        formik.setFieldValue('version_details.welcome_message', draftData.welcome_message || '');

      if (fieldApplyFlags.conversation_starters)
        formik.setFieldValue(
          'version_details.conversation_starters',
          filterEmptyStrings(draftData.conversation_starters),
        );
    },
    [fieldApplyFlags, formik],
  );

  const handleSave = useCallback(
    async draftData => {
      // flushSync forces a synchronous re-render so useSaveVersion picks up
      // the updated formik values before saveVersionRef.current is called below.
      flushSync(() => {
        applyFieldChanges(draftData);
      });
      await applyToolAssociations(draftData);
      await saveVersionRef.current();

      // useSaveVersion resets formik with stale version_details.tools (it reads
      // tools from formik which was not updated by applyToolAssociations).
      // Refetch application details to get the updated tools list.
      const { data: freshData } = await fetchApplicationDetails({
        projectId,
        applicationId: formik.values.id,
      });
      if (freshData) {
        formik.resetForm({ values: freshData });
      }
    },
    [applyFieldChanges, applyToolAssociations, fetchApplicationDetails, projectId, formik],
  );

  const handleSaveAsVersionClick = useCallback(draftData => {
    pendingDraftDataRef.current = draftData;
    setShowVersionModal(true);
  }, []);

  const handleConfirmVersion = useCallback(async () => {
    const trimmedName = versionName.trim();
    if (!trimmedName) return;

    const versions = formik.values.versions || [];
    if (versions.find(v => v.name === trimmedName)) {
      toastError('A version with that name already exists. Please pick a unique name.');
      return;
    }

    const draftData = pendingDraftDataRef.current;
    if (!draftData) return;

    setIsSavingAsVersion(true);

    try {
      // Name/description are application-level (shared across versions).
      // Save them via the proven useSaveVersion path before creating the new version.
      if (fieldApplyFlags.name || fieldApplyFlags.description) {
        flushSync(() => {
          if (fieldApplyFlags.name) formik.setFieldValue('name', (draftData.name || '').trim());
          if (fieldApplyFlags.description) formik.setFieldValue('description', draftData.description || '');
        });
        await saveVersionRef.current();
      }

      // Apply version-level fields to formik so useSaveNewVersion picks them up.
      flushSync(() => {
        if (fieldApplyFlags.instructions)
          formik.setFieldValue('version_details.instructions', draftData.instructions || '');
        if (fieldApplyFlags.welcome_message)
          formik.setFieldValue('version_details.welcome_message', draftData.welcome_message || '');
        if (fieldApplyFlags.conversation_starters)
          formik.setFieldValue(
            'version_details.conversation_starters',
            filterEmptyStrings(draftData.conversation_starters),
          );
      });

      // Create the new version — tools are applied to it afterwards.
      const result = await onCreateNewVersionRef.current(trimmedName);
      const newVersionId = result?.data?.id;

      if (newVersionId) {
        await applyToolAssociations(draftData, newVersionId);
      }

      setShowVersionModal(false);
      setVersionName('');
      pendingDraftDataRef.current = null;
      onClose();
    } catch {
      setIsSavingAsVersion(false);
    }
  }, [versionName, formik, toastError, fieldApplyFlags, applyToolAssociations, onClose]);

  const handleCancelVersion = useCallback(() => {
    setShowVersionModal(false);
    setVersionName('');
    pendingDraftDataRef.current = null;
  }, []);

  const handleVersionKeyDown = useCallback(
    e => {
      if (e.key === 'Enter' && versionName.trim()) {
        e.preventDefault();
        handleConfirmVersion();
      }
    },
    [versionName, handleConfirmVersion],
  );

  const currentData = currentDataRef.current || formik.values;

  const currentTools = useMemo(() => {
    const tools = (currentData?.version_details?.tools || []).map(t =>
      t.type === 'application' ? { ...t, id: t.settings?.application_id ?? t.id } : t,
    );
    const skills = (applicationSkills?.skills || []).map(s => ({ ...s, id: s.skill_id, type: 'skill' }));
    return [...tools, ...skills];
  }, [currentData?.version_details?.tools, applicationSkills?.skills]);

  const renderStep = useCallback(
    (stepKey, draftData, setDraftData) => {
      const stepProps = {
        currentData,
        draftData,
        onDraftChange: newDraft => setDraftData(newDraft),
        fieldApplyFlags,
        onToggleField: handleToggleField,
      };

      switch (stepKey) {
        case EDIT_STEP_KEYS.GENERAL:
          return <GeneralStep {...stepProps} />;
        case EDIT_STEP_KEYS.INSTRUCTIONS:
          return <InstructionsStep {...stepProps} />;
        case EDIT_STEP_KEYS.USER_INTERACTION:
          return <UserInteractionStep {...stepProps} />;
        case EDIT_STEP_KEYS.TOOLS_SKILLS:
          return (
            <ToolsSkillsStep
              currentTools={currentTools}
              draftData={draftData}
              toolSelections={toolSelections}
              onToggleTool={handleToggleTool}
            />
          );
        case EDIT_STEP_KEYS.SUMMARY:
          return (
            <SummaryStep
              currentData={currentData}
              currentTools={currentTools}
              draftData={draftData}
              onDraftChange={newDraft => setDraftData(newDraft)}
              fieldApplyFlags={fieldApplyFlags}
              onToggleField={handleToggleField}
              toolSelections={toolSelections}
            />
          );
        default:
          return null;
      }
    },
    [currentData, currentTools, fieldApplyFlags, handleToggleField, toolSelections, handleToggleTool],
  );

  return (
    <>
      <EditEntityModal
        open={open}
        onClose={onClose}
        entityLabel="agent"
        placeholder="Describe the changes you'd like to make to the agent. AI can help update its description, instructions, tools, skills, and other configuration details."
        onGenerate={handleGenerate}
        generateError={generateError}
        resetGenerate={resetGenerate}
        onDraftGenerated={handleDraftGenerated}
        steps={steps}
        renderStep={renderStep}
        onSave={handleSave}
        onSaveAsVersion={handleSaveAsVersionClick}
        isSavingAsVersion={isSavingAsVersion}
        saveLabel="Save"
        savingLabel="Saving..."
        modalTestId="ai-edit-agent-modal"
        closeButtonTestId="ai-edit-agent-close-button"
        promptInputTestId="ai-edit-agent-prompt-input"
        errorAlertTestId="ai-edit-agent-error-alert"
        loadingIndicatorTestId="ai-edit-agent-loading-indicator"
        generateButtonTestId="ai-edit-agent-generate-button"
        cancelButtonTestId="ai-edit-agent-cancel-button"
      />
      <Modal.BaseModal
        open={showVersionModal}
        variant={ModalConstants.MODAL_VARIANT.simple}
        titleIcon={ModalConstants.MODAL_ICON_TYPE.success}
        title="Create version"
        onClose={isSavingAsVersion ? undefined : handleCancelVersion}
        onConfirm={handleConfirmVersion}
        confirmButtonText="Save"
        confirming={!versionName.trim() || isSavingAsVersion}
        onKeyDown={handleVersionKeyDown}
        closeButtonTestId="ai-edit-version-dialog-close-button"
        cancelButtonTestId="ai-edit-version-dialog-cancel-button"
        confirmButtonTestId="ai-edit-version-dialog-save-button"
        content={
          <Input.InputBase
            label="Name"
            value={versionName}
            onChange={e => setVersionName(e.target.value)}
            inputProps={{ maxLength: 255, 'data-testid': 'ai-edit-version-dialog-name-input' }}
            autoFocus
          />
        }
      />
    </>
  );
});

AIEditAgentModal.displayName = 'AIEditAgentModal';

export default AIEditAgentModal;
