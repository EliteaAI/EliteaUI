import { memo, useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { GenerateEntityModal } from '@/[fsd]/entities/generate-entity-with-ai';
import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { useLazySkillDetailsQuery, useUpdateSkillRelationMutation } from '@/[fsd]/features/skill/api';
import { generateLLMSettings } from '@/[fsd]/shared/lib/utils/llmSettings.utils';
import {
  useApplicationCreateMutation,
  useGenerateAgentDraftMutation,
  useLazyApplicationDetailsQuery,
  useListModelsQuery,
  useToolkitAssociateMutation,
  useUpdateApplicationRelationMutation,
} from '@/api';
import { filterEmptyStrings } from '@/common/applicationUtils';
import { PrivateApplicationTabs, SearchParams, ViewMode } from '@/common/constants';
import { contextResolver } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions from '@/routes';

import GenerateAgentReviewForm from './GenerateAgentReviewForm';

const GenerateAgentModal = memo(props => {
  const { open, onClose, onAgentCreated } = props;

  const navigate = useNavigate();
  const projectId = useSelectedProjectId();

  const [createApplication] = useApplicationCreateMutation();
  const [associateToolkit] = useToolkitAssociateMutation();
  const [updateApplicationRelation] = useUpdateApplicationRelationMutation();
  const [updateSkillRelation] = useUpdateSkillRelationMutation();
  const [fetchApplicationDetails] = useLazyApplicationDetailsQuery();
  const [fetchSkillDetails] = useLazySkillDetailsQuery();

  const [generateDraft, { error: generateError, reset: resetGenerate }] = useGenerateAgentDraftMutation();

  const { data: modelsData = { items: [] } } = useListModelsQuery(
    { projectId, include_shared: true },
    { skip: !projectId },
  );

  const defaultModel = modelsData.items.find(m => m.default) || modelsData.items[0] || null;

  const [selectedToolkitIds, setSelectedToolkitIds] = useState(new Set());
  const [selectedAgentIds, setSelectedAgentIds] = useState(new Set());
  const [selectedMcpIds, setSelectedMcpIds] = useState(new Set());
  const [selectedPipelineIds, setSelectedPipelineIds] = useState(new Set());
  const [selectedSkillIds, setSelectedSkillIds] = useState(new Set());

  const handleToggleToolkit = useCallback(id => {
    setSelectedToolkitIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleAgent = useCallback(id => {
    setSelectedAgentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleMcp = useCallback(id => {
    setSelectedMcpIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleTogglePipeline = useCallback(id => {
    setSelectedPipelineIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleSkill = useCallback(id => {
    setSelectedSkillIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleGenerate = useCallback(
    description => generateDraft({ projectId, user_description: description }),
    [generateDraft, projectId],
  );

  const handleDraftGenerated = useCallback(() => {
    setSelectedToolkitIds(new Set());
    setSelectedAgentIds(new Set());
    setSelectedMcpIds(new Set());
    setSelectedPipelineIds(new Set());
    setSelectedSkillIds(new Set());
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
      await Promise.allSettled(
        apps.map(async a => {
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
            has_relation: true,
          }).unwrap();
        }),
      );
    },
    [fetchApplicationDetails, updateApplicationRelation, projectId],
  );

  const associateSkills = useCallback(
    async (versionId, skills) => {
      if (!versionId || !skills.length) return;
      await Promise.allSettled(
        skills.map(async skill => {
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
    },
    [fetchSkillDetails, updateSkillRelation, projectId],
  );

  const redirectToAgent = useCallback(
    (entityId, name) => {
      const pathname = `${RouteDefinitions.Applications}/${PrivateApplicationTabs[0]}/${entityId}`;
      const search = `${SearchParams.DestTab}=configuration&name=${encodeURIComponent(name)}&${SearchParams.ViewMode}=${ViewMode.Owner}`;
      setTimeout(() => {
        navigate(
          { pathname, search },
          {
            replace: true,
            state: {
              routeStack: [
                {
                  breadCrumb: name,
                  viewMode: ViewMode.Owner,
                  pagePath: `${pathname}?${search}`,
                },
              ],
            },
          },
        );
      }, 0);
    },
    [navigate],
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
            instructions: draftData.instructions || '',
            variables: contextResolver(draftData.instructions).map(name => ({ name, value: '' })),
            tools: [],
            tags: [],
            llm_settings: generateLLMSettings(defaultModel, {}, { includeModelInfo: true }),
            conversation_starters: filterEmptyStrings(draftData.conversation_starters),
            agent_type: 'openai',
            welcome_message: draftData.welcome_message || '',
            meta: {
              step_limit: 25,
            },
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
      const selectedSkills = (draftData.suggested_skills || []).filter(s => selectedSkillIds.has(s.id));

      await associateToolkits(versionId, entityId, [...selectedToolkits, ...selectedMcps]);
      await associateApplications(versionId, entityId, [...selectedAgents, ...selectedPipelines]);
      await associateSkills(versionId, selectedSkills);

      if (onAgentCreated) onAgentCreated(result);
      else redirectToAgent(entityId, result.name);
    },
    [
      selectedToolkitIds,
      selectedAgentIds,
      selectedMcpIds,
      selectedPipelineIds,
      selectedSkillIds,
      createApplication,
      associateToolkits,
      associateApplications,
      associateSkills,
      redirectToAgent,
      onAgentCreated,
      projectId,
      defaultModel,
    ],
  );

  const renderReview = useCallback(
    (draft, onChange, onValidationChange) => (
      <GenerateAgentReviewForm
        draft={draft}
        onChange={onChange}
        onValidationChange={onValidationChange}
        selectedToolkitIds={selectedToolkitIds}
        onToggleToolkit={handleToggleToolkit}
        selectedAgentIds={selectedAgentIds}
        onToggleAgent={handleToggleAgent}
        selectedMcpIds={selectedMcpIds}
        onToggleMcp={handleToggleMcp}
        selectedPipelineIds={selectedPipelineIds}
        onTogglePipeline={handleTogglePipeline}
        selectedSkillIds={selectedSkillIds}
        onToggleSkill={handleToggleSkill}
      />
    ),
    [
      selectedToolkitIds,
      handleToggleToolkit,
      selectedAgentIds,
      handleToggleAgent,
      selectedMcpIds,
      handleToggleMcp,
      selectedPipelineIds,
      handleTogglePipeline,
      selectedSkillIds,
      handleToggleSkill,
    ],
  );

  return (
    <GenerateEntityModal
      open={open}
      onClose={handleClose}
      entityLabel="agent"
      placeholder="Describe your agent's goal, key tasks, and preferred tone or behavior."
      onGenerate={handleGenerate}
      generateError={generateError}
      resetGenerate={resetGenerate}
      onDraftGenerated={handleDraftGenerated}
      renderReview={renderReview}
      onApprove={handleApprove}
    />
  );
});

GenerateAgentModal.displayName = 'GenerateAgentModal';

export default GenerateAgentModal;
