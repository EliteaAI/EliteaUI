import { memo, useCallback, useRef, useState } from 'react';

import { useFormikContext } from 'formik';

import { EditEntityModal } from '@/[fsd]/entities/edit-entity-with-ai';
import { useGenerateAgentDraftMutation } from '@/[fsd]/features/agent/api';
import { EDIT_STEP_KEYS } from '@/[fsd]/features/agent/lib/constants';
import { AgentAIEditionStepsHelpers } from '@/[fsd]/features/agent/lib/helpers';
import { useLazySkillDetailsQuery, useUpdateSkillRelationMutation } from '@/[fsd]/features/skill/api';
import {
  useLazyApplicationDetailsQuery,
  useToolkitAssociateMutation,
  useUpdateApplicationRelationMutation,
} from '@/api';
import { filterEmptyStrings } from '@/common/applicationUtils';
import { buildErrorMessage } from '@/common/utils';
import { mapAssociationError } from '@/hooks/application/useAgentPipelineAssociation';
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

  const formik = useFormikContext();
  const projectId = useSelectedProjectId();
  const { toastWarning } = useToast();

  const [generateDraft, { error: generateError, reset: resetGenerate }] = useGenerateAgentDraftMutation();
  const [associateToolkit] = useToolkitAssociateMutation();
  const [updateApplicationRelation] = useUpdateApplicationRelationMutation();
  const [updateSkillRelation] = useUpdateSkillRelationMutation();
  const [fetchApplicationDetails] = useLazyApplicationDetailsQuery();
  const [fetchSkillDetails] = useLazySkillDetailsQuery();

  const [steps, setSteps] = useState([]);
  const [fieldApplyFlags, setFieldApplyFlags] = useState(DEFAULT_FIELD_FLAGS);
  const [toolSelections, setToolSelections] = useState({ toAdd: new Set(), toRemove: new Set() });

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

  const handleDraftGenerated = useCallback(draftData => {
    const visibleSteps = AgentAIEditionStepsHelpers.computeVisibleSteps(currentDataRef.current, draftData);

    setSteps(visibleSteps);
    setFieldApplyFlags({ ...DEFAULT_FIELD_FLAGS });

    const addIds = new Set([
      ...(draftData.suggested_toolkits || []).map(t => t.id),
      ...(draftData.suggested_mcp || []).map(m => m.id),
      ...(draftData.suggested_agents || []).map(a => a.id),
      ...(draftData.suggested_pipelines || []).map(p => p.id),
      ...(draftData.suggested_skills || []).map(s => s.id),
    ]);

    const removeIds = new Set([
      ...(draftData.tools_to_remove || []).map(t => t.id),
      ...(draftData.skills_to_remove || []).map(s => s.id),
    ]);

    setToolSelections({ toAdd: addIds, toRemove: removeIds });
  }, []);

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
    async draftData => {
      const entityId = formik.values.id;
      const versionId = formik.values.version_details?.id;

      if (!versionId) return;

      const selectedAddToolkits = [
        ...(draftData.suggested_toolkits || []),
        ...(draftData.suggested_mcp || []),
      ].filter(t => toolSelections.toAdd.has(t.id));

      const selectedAddAgents = (draftData.suggested_agents || []).filter(a =>
        toolSelections.toAdd.has(a.id),
      );

      const selectedAddPipelines = (draftData.suggested_pipelines || []).filter(p =>
        toolSelections.toAdd.has(p.id),
      );

      const selectedAddSkills = (draftData.suggested_skills || []).filter(s =>
        toolSelections.toAdd.has(s.id),
      );

      const selectedRemoveToolkits = (draftData.tools_to_remove || []).filter(t =>
        toolSelections.toRemove.has(t.id),
      );

      const selectedRemoveSkills = (draftData.skills_to_remove || []).filter(s =>
        toolSelections.toRemove.has(s.id),
      );

      if (selectedAddToolkits.length > 0) {
        await Promise.allSettled(
          selectedAddToolkits.map(t =>
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

      if (selectedRemoveToolkits.length > 0) {
        await Promise.allSettled(
          selectedRemoveToolkits.map(t =>
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

      const addApps = [...selectedAddAgents, ...selectedAddPipelines];

      if (addApps.length > 0) {
        const results = await Promise.allSettled(
          addApps.map(async a => {
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

      if (selectedAddSkills.length > 0) {
        await Promise.allSettled(
          selectedAddSkills.map(async skill => {
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

      if (selectedRemoveSkills.length > 0) {
        await Promise.allSettled(
          selectedRemoveSkills.map(async skill => {
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
      associateToolkit,
      updateApplicationRelation,
      updateSkillRelation,
      fetchApplicationDetails,
      fetchSkillDetails,
      projectId,
      toastWarning,
    ],
  );

  const handleSave = useCallback(
    async draftData => {
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

      await applyToolAssociations(draftData);
    },
    [fieldApplyFlags, formik, applyToolAssociations],
  );

  const currentData = currentDataRef.current || formik.values;

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
              draftData={draftData}
              toolSelections={toolSelections}
              onToggleTool={handleToggleTool}
            />
          );
        case EDIT_STEP_KEYS.SUMMARY:
          return (
            <SummaryStep
              currentData={currentData}
              draftData={draftData}
              onDraftChange={newDraft => setDraftData(newDraft)}
              fieldApplyFlags={fieldApplyFlags}
            />
          );
        default:
          return null;
      }
    },
    [currentData, fieldApplyFlags, handleToggleField, toolSelections, handleToggleTool],
  );

  return (
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
      saveLabel="Save Agent"
      savingLabel="Saving..."
      modalTestId="ai-edit-agent-modal"
      closeButtonTestId="ai-edit-agent-close-button"
      promptInputTestId="ai-edit-agent-prompt-input"
      errorAlertTestId="ai-edit-agent-error-alert"
      loadingIndicatorTestId="ai-edit-agent-loading-indicator"
      generateButtonTestId="ai-edit-agent-generate-button"
      cancelButtonTestId="ai-edit-agent-cancel-button"
    />
  );
});

AIEditAgentModal.displayName = 'AIEditAgentModal';

export default AIEditAgentModal;
