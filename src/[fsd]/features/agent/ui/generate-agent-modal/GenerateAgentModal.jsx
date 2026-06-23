import { memo, useCallback, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Alert, Box, CircularProgress, TextField, Typography } from '@mui/material';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { generateLLMSettings } from '@/[fsd]/shared/lib/utils/llmSettings.utils';
import { Modal } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
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
import { buildErrorMessage } from '@/common/utils.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import RouteDefinitions from '@/routes';

import GenerateAgentReviewForm from './GenerateAgentReviewForm';

const STEPS = {
  INPUT: 'input',
  LOADING: 'loading',
  REVIEW: 'review',
};

const GenerateAgentModal = memo(props => {
  const { open, onClose, onAgentCreated } = props;

  const navigate = useNavigate();
  const projectId = useSelectedProjectId();

  const { toastError } = useToast();
  const styles = generateAgentModalStyles();

  const [createApplication] = useApplicationCreateMutation();
  const [associateToolkit] = useToolkitAssociateMutation();
  const [updateApplicationRelation] = useUpdateApplicationRelationMutation();
  const [fetchApplicationDetails] = useLazyApplicationDetailsQuery();

  const [generateDraft, { error: generateError, reset: resetGenerate }] = useGenerateAgentDraftMutation();

  const { data: modelsData = { items: [] } } = useListModelsQuery(
    { projectId, include_shared: true },
    { skip: !projectId },
  );

  const defaultModel = modelsData.items.find(m => m.default) || modelsData.items[0] || null;

  const [step, setStep] = useState(STEPS.INPUT);
  const [description, setDescription] = useState('');
  const [draftData, setDraftData] = useState(null);
  const [selectedToolkitIds, setSelectedToolkitIds] = useState(new Set());
  const [selectedAgentIds, setSelectedAgentIds] = useState(new Set());
  const [selectedMcpIds, setSelectedMcpIds] = useState(new Set());
  const [selectedPipelineIds, setSelectedPipelineIds] = useState(new Set());
  const [isApproving, setIsApproving] = useState(false);
  const [isDraftValid, setIsDraftValid] = useState(true);
  const generatePromiseRef = useRef(null);

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return;

    setStep(STEPS.LOADING);
    resetGenerate();

    try {
      const promise = generateDraft({
        projectId,
        user_description: description,
      });
      generatePromiseRef.current = promise;
      const result = await promise.unwrap();

      generatePromiseRef.current = null;
      setDraftData(result);
      setSelectedToolkitIds(new Set());
      setSelectedAgentIds(new Set());
      setSelectedMcpIds(new Set());
      setSelectedPipelineIds(new Set());
      setStep(STEPS.REVIEW);
    } catch {
      generatePromiseRef.current = null;
      setStep(STEPS.INPUT);
    }
  }, [description, generateDraft, projectId, resetGenerate]);

  const handleBack = useCallback(() => {
    setStep(STEPS.INPUT);
    setDraftData(null);
    resetGenerate();
  }, [resetGenerate]);

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

  const handleApprove = useCallback(async () => {
    if (!draftData) return;
    setIsApproving(true);

    try {
      const result = await createApplication({
        projectId,
        name: (draftData.name || '').trim(),
        description: draftData.description || '',
        type: 'interface',
        versions: [
          {
            name: LATEST_VERSION_NAME,
            instructions: draftData.instructions || '',
            variables: [],
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

      await associateToolkits(versionId, entityId, [...selectedToolkits, ...selectedMcps]);
      await associateApplications(versionId, entityId, [...selectedAgents, ...selectedPipelines]);

      onClose();
      if (onAgentCreated) onAgentCreated(result);
      else redirectToAgent(entityId, result.name);
    } catch (err) {
      setIsApproving(false);
      toastError(buildErrorMessage(err));
    }
  }, [
    draftData,
    selectedToolkitIds,
    selectedAgentIds,
    selectedMcpIds,
    selectedPipelineIds,
    createApplication,
    associateToolkits,
    associateApplications,
    redirectToAgent,
    onAgentCreated,
    projectId,
    onClose,
    toastError,
    defaultModel,
  ]);

  const handleClose = useCallback(() => {
    if (generatePromiseRef.current) {
      generatePromiseRef.current.abort();
      generatePromiseRef.current = null;
    }
    setStep(STEPS.INPUT);
    setDescription('');
    setDraftData(null);
    setSelectedToolkitIds(new Set());
    setSelectedAgentIds(new Set());
    setSelectedMcpIds(new Set());
    setSelectedPipelineIds(new Set());
    setIsApproving(false);
    resetGenerate();
    onClose();
  }, [onClose, resetGenerate]);

  const handleKeyDown = useCallback(
    e => {
      if (e.key === 'Enter' && !e.shiftKey && step === STEPS.INPUT) {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate, step],
  );

  const renderContent = () => {
    if (step === STEPS.LOADING) {
      return (
        <Box sx={styles.loadingContainer}>
          <CircularProgress size={24} />
          <Typography
            color="text.secondary"
            sx={{ fontSize: '0.875rem' }}
          >
            Generating agent draft...
          </Typography>
        </Box>
      );
    }

    if (step === STEPS.REVIEW && draftData) {
      return (
        <GenerateAgentReviewForm
          draft={draftData}
          onChange={setDraftData}
          onValidationChange={setIsDraftValid}
          selectedToolkitIds={selectedToolkitIds}
          onToggleToolkit={handleToggleToolkit}
          selectedAgentIds={selectedAgentIds}
          onToggleAgent={handleToggleAgent}
          selectedMcpIds={selectedMcpIds}
          onToggleMcp={handleToggleMcp}
          selectedPipelineIds={selectedPipelineIds}
          onTogglePipeline={handleTogglePipeline}
        />
      );
    }

    return (
      <Box sx={styles.inputContainer}>
        <TextField
          fullWidth
          multiline
          minRows={10}
          maxRows={16}
          placeholder="Describe your agent's goal, key tasks, and preferred tone or behavior."
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          variant="standard"
          sx={styles.textField}
          slotProps={{ input: { disableUnderline: true } }}
        />
        {generateError && (
          <Alert
            severity="error"
            sx={styles.errorAlert}
          >
            {generateError?.data?.error ||
              generateError?.data?.detail ||
              'Failed to generate. Please try again.'}
          </Alert>
        )}
      </Box>
    );
  };

  const renderActions = () => {
    if (step === STEPS.LOADING) return null;

    if (step === STEPS.REVIEW) {
      return (
        <>
          <BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            size="small"
            onClick={handleBack}
            disabled={isApproving}
          >
            Back to prompt
          </BaseBtn>
          <BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            size="small"
            onClick={handleApprove}
            disabled={isApproving || !isDraftValid}
            sx={{ margin: '0 !important' }}
          >
            {isApproving ? 'Creating...' : 'Create Agent'}
          </BaseBtn>
        </>
      );
    }

    return (
      <>
        <Box sx={{ flex: 1 }} />
        <BaseBtn
          variant={BUTTON_VARIANTS.secondary}
          size="small"
          onClick={handleClose}
        >
          Cancel
        </BaseBtn>
        <BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          size="small"
          disabled={!description.trim()}
          onClick={handleGenerate}
          sx={{ margin: '0 !important' }}
        >
          Generate
        </BaseBtn>
      </>
    );
  };

  return (
    <Modal.BaseModal
      open={open}
      title="Build with AI"
      onClose={handleClose}
      content={renderContent()}
      actions={renderActions()}
      dialogSx={styles.dialogContent}
      sx={styles.dialog}
    />
  );
});

GenerateAgentModal.displayName = 'GenerateAgentModal';

const generateAgentModalStyles = () => ({
  dialog: () => ({
    '& .MuiDialog-paper': {
      width: '45rem !important',
      maxWidth: '80% !important',
    },
  }),
  dialogContent: {
    maxHeight: 'calc(100vh - 16rem)',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '2rem 0',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '16rem',
  },
  textField: ({ palette }) => ({
    '& .MuiInputBase-root': {
      padding: 0,
      fontSize: '0.875rem',
      color: palette.text.secondary,
    },
  }),
  errorAlert: {
    mt: 1,
  },
});

export default GenerateAgentModal;
