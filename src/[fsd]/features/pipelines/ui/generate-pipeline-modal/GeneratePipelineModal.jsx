import { memo, useCallback, useState } from 'react';

import { GenerateEntityModal } from '@/[fsd]/entities/generate-entity-with-ai';
import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version';
import { useGeneratePipelineDraftMutation } from '@/[fsd]/features/pipelines/api/generatePipelineApi';
import { toggleSet } from '@/[fsd]/features/pipelines/lib/helpers';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import {
  useApplicationCreateMutation,
  useLazyApplicationDetailsQuery,
  useToolkitAssociateMutation,
  useUpdateApplicationRelationMutation,
} from '@/api';
import { buildErrorMessage } from '@/common/utils';
import { mapAssociationError } from '@/hooks/application/useAgentPipelineAssociation';

import GeneratePipelineReviewForm from './GeneratePipelineReviewForm';

const GeneratePipelineModal = memo(props => {
  const { open, onClose, onPipelineCreated } = props;

  const projectId = useSelectedProjectId();
  const { toastWarning } = useToast();

  const [createApplication] = useApplicationCreateMutation();
  const [associateToolkit] = useToolkitAssociateMutation();
  const [updateApplicationRelation] = useUpdateApplicationRelationMutation();
  const [fetchApplicationDetails] = useLazyApplicationDetailsQuery();

  const [generateDraft, { error: generateError, reset: resetGenerate }] = useGeneratePipelineDraftMutation();

  const [selectedToolkitIds, setSelectedToolkitIds] = useState(new Set());
  const [selectedAgentIds, setSelectedAgentIds] = useState(new Set());
  const [selectedMcpIds, setSelectedMcpIds] = useState(new Set());
  const [selectedPipelineIds, setSelectedPipelineIds] = useState(new Set());

  const handleToggleToolkit = useCallback(id => toggleSet(setSelectedToolkitIds)(id), []);
  const handleToggleMcp = useCallback(id => toggleSet(setSelectedMcpIds)(id), []);
  const handleToggleAgent = useCallback(id => toggleSet(setSelectedAgentIds)(id), []);
  const handleTogglePipeline = useCallback(id => toggleSet(setSelectedPipelineIds)(id), []);

  const handleGenerate = useCallback(
    description => generateDraft({ projectId, user_description: description }),
    [generateDraft, projectId],
  );

  const handleDraftGenerated = useCallback(() => {
    setSelectedToolkitIds(new Set());
    setSelectedAgentIds(new Set());
    setSelectedMcpIds(new Set());
    setSelectedPipelineIds(new Set());
  }, []);

  const handleClose = useCallback(() => {
    handleDraftGenerated();
    onClose();
  }, [handleDraftGenerated, onClose]);

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

  const handleApprove = useCallback(
    async draftData => {
      const result = await createApplication({
        projectId,
        name: (draftData.name || '').trim(),
        description: draftData.description || '',
        type: 'interface',
        versions: [
          {
            name: LATEST_VERSION_NAME,
            instructions: draftData.pipeline_yaml || '',
            tools: [],
            tags: [],
            agent_type: 'pipeline',
            meta: { step_limit: 25 },
          },
        ],
      }).unwrap();

      const entityId = result.id;
      const versionId = result.version_details?.id;

      const selectedToolkits = (draftData.suggested_toolkits || []).filter(t => selectedToolkitIds.has(t.id));
      const selectedMcps = (draftData.suggested_mcp || []).filter(m => selectedMcpIds.has(m.id));
      const selectedAgents = (draftData.suggested_agents || []).filter(a => selectedAgentIds.has(a.id));
      const selectedPipelines = (draftData.suggested_pipelines || []).filter(p =>
        selectedPipelineIds.has(p.id),
      );

      await associateToolkits(versionId, entityId, [...selectedToolkits, ...selectedMcps]);
      await associateApplications(versionId, entityId, [...selectedAgents, ...selectedPipelines]);

      if (onPipelineCreated) onPipelineCreated(result);
    },
    [
      selectedToolkitIds,
      selectedMcpIds,
      selectedAgentIds,
      selectedPipelineIds,
      createApplication,
      associateToolkits,
      associateApplications,
      onPipelineCreated,
      projectId,
    ],
  );

  const renderReview = useCallback(
    (draft, onChange) => (
      <GeneratePipelineReviewForm
        draft={draft}
        onChange={onChange}
        selectedToolkitIds={selectedToolkitIds}
        onToggleToolkit={handleToggleToolkit}
        selectedMcpIds={selectedMcpIds}
        onToggleMcp={handleToggleMcp}
        selectedAgentIds={selectedAgentIds}
        onToggleAgent={handleToggleAgent}
        selectedPipelineIds={selectedPipelineIds}
        onTogglePipeline={handleTogglePipeline}
      />
    ),
    [
      selectedToolkitIds,
      handleToggleToolkit,
      selectedMcpIds,
      handleToggleMcp,
      selectedAgentIds,
      handleToggleAgent,
      selectedPipelineIds,
      handleTogglePipeline,
    ],
  );

  return (
    <GenerateEntityModal
      open={open}
      onClose={handleClose}
      entityLabel="pipeline"
      placeholder="Describe your pipeline's goal, the steps it should perform, and any tools it should use."
      onGenerate={handleGenerate}
      generateError={generateError}
      resetGenerate={resetGenerate}
      onDraftGenerated={handleDraftGenerated}
      renderReview={renderReview}
      onApprove={handleApprove}
      approveLabel="Create Pipeline"
      approvingLabel="Creating..."
      modalTestId="generate-pipeline-modal"
      closeButtonTestId="generate-pipeline-close-button"
      promptInputTestId="generate-pipeline-prompt-input"
      errorAlertTestId="generate-pipeline-error-alert"
      loadingIndicatorTestId="generate-pipeline-loading-indicator"
      generateButtonTestId="generate-pipeline-submit-button"
      cancelButtonTestId="generate-pipeline-cancel-button"
      backButtonTestId="generate-pipeline-back-button"
      approveButtonTestId="generate-pipeline-approve-button"
    />
  );
});

GeneratePipelineModal.displayName = 'GeneratePipelineModal';

export default GeneratePipelineModal;
