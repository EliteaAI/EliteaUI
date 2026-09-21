import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { EditEntityModal } from '@/[fsd]/entities/edit-entity-with-ai';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Input, Modal } from '@/[fsd]/shared/ui';
import { useGetApplicationVersionDetailQuery, useUpdateApplicationVersionMutation } from '@/api/applications';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

import {
  useEnhanceFromEvalMutation,
  useEvalBindingsQuery,
  useEvalRunResultsQuery,
  useUpdateEvalBindingMutation,
  useUpdateEvalDatasetCaseMutation,
  useUpdateEvalDimensionMutation,
  useVersionInstructionForkMutation,
} from '../../api';
import { ENHANCE_STEP_KEYS, EVAL_FIX_KIND } from '../../lib/constants';
import {
  applyInstructionPatches,
  computeEnhanceSteps,
  isAutoApplicableEvalFix,
  parseEvalError,
  splitEvalFixes,
  toInstructionPatch,
} from '../../lib/helpers';
import { EnhanceAnalysisStep, EnhanceEvalFixesStep, EnhanceInstructionsStep } from './steps';

const TARGET_PARSE_REGEX = /(>=|<=|==|>|<)\s*([\d.]+)/;
const NO_AUTO_APPLY_MESSAGE = 'could not be applied automatically — edit the target manually.';
const UNVERSIONED_DIMENSION_MESSAGE =
  'Dimension changes are saved to the evaluation setup immediately — they will be updated without versioning.';
const UNVERSIONED_DATASET_MESSAGE =
  'Dataset changes are saved to the evaluation setup immediately — they will be updated without versioning.';

const EnhanceWithAiDialog = memo(props => {
  const { open, onClose, applicationId, runId } = props;

  const projectId = useSelectedProjectId();
  const { toastSuccess, toastError, toastWarning } = useToast();

  const [proposal, setProposal] = useState(null);
  const [steps, setSteps] = useState([]);
  const [acceptedAgentFixes, setAcceptedAgentFixes] = useState([]);
  const [acceptedEvalFixes, setAcceptedEvalFixes] = useState([]);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [isSavingAsVersion, setIsSavingAsVersion] = useState(false);

  const [enhanceFromEval, { error: generateError, reset: resetGenerate }] = useEnhanceFromEvalMutation();
  const [versionInstructionFork] = useVersionInstructionForkMutation();
  const [updateApplicationVersion] = useUpdateApplicationVersionMutation();
  const [updateEvalDimension] = useUpdateEvalDimensionMutation();
  const [updateEvalDatasetCase] = useUpdateEvalDatasetCaseMutation();
  const [updateEvalBinding] = useUpdateEvalBindingMutation();

  const versionId = proposal?.version_id;

  const { data: versionDetail, isFetching: isFetchingVersion } = useGetApplicationVersionDetailQuery(
    { projectId, applicationId, versionId },
    { skip: !open || !projectId || !applicationId || !versionId },
  );

  const { data: resultsData } = useEvalRunResultsQuery(
    { projectId, runId },
    { skip: !open || !projectId || !runId },
  );
  const datasetId = resultsData?.run?.snapshot?.dataset_id;
  const suiteId = resultsData?.run?.snapshot?.suite?.id;

  const { data: bindingsData } = useEvalBindingsQuery(
    { projectId, suiteId },
    { skip: !open || !projectId || !suiteId },
  );

  useEffect(() => {
    if (open) return;

    setProposal(null);
    setSteps([]);
    setAcceptedAgentFixes([]);
    setAcceptedEvalFixes([]);
    setShowVersionModal(false);
    setVersionName('');
    setIsSavingAsVersion(false);
  }, [open]);

  const agentFixes = useMemo(() => proposal?.agent_fixes || [], [proposal]);

  const { dimensionFixes, datasetFixes } = useMemo(() => splitEvalFixes(proposal?.eval_fixes), [proposal]);

  // Kept as {fix, index} pairs: the index is the position in proposal.agent_fixes, which is what
  // the accept flags are keyed by, while the patch list itself must stay dense for the server.
  const acceptedPatches = useMemo(
    () => agentFixes.map((fix, index) => ({ fix, index })).filter(({ index }) => acceptedAgentFixes[index]),
    [agentFixes, acceptedAgentFixes],
  );

  const currentInstructions = versionDetail?.instructions || '';

  const { proposedInstructions, conflictIndex } = useMemo(() => {
    const { text, conflictIndex: patchConflict } = applyInstructionPatches(
      currentInstructions,
      acceptedPatches.map(({ fix }) => toInstructionPatch(fix)),
    );

    return {
      proposedInstructions: text,
      conflictIndex: patchConflict === -1 ? -1 : acceptedPatches[patchConflict].index,
    };
  }, [currentInstructions, acceptedPatches]);

  const handleGenerate = useCallback(
    () => enhanceFromEval({ projectId, body: { run_id: runId } }),
    [enhanceFromEval, projectId, runId],
  );

  const handleDraftGenerated = useCallback(result => {
    setProposal(result);
    setSteps(computeEnhanceSteps(result));
    setAcceptedAgentFixes((result.agent_fixes || []).map(() => true));
    setAcceptedEvalFixes((result.eval_fixes || []).map(isAutoApplicableEvalFix));

    return result;
  }, []);

  const handleToggleAgentFix = useCallback(index => {
    setAcceptedAgentFixes(prev => prev.map((accepted, i) => (i === index ? !accepted : accepted)));
  }, []);

  const handleToggleEvalFix = useCallback(index => {
    setAcceptedEvalFixes(prev => prev.map((accepted, i) => (i === index ? !accepted : accepted)));
  }, []);

  // Dimensions and dataset cases are not versioned entities — each accepted fix is a direct write,
  // so a failure is reported per item and never blocks the instruction save that came before it.
  const applyEvalFixes = useCallback(async () => {
    const evalFixes = proposal?.eval_fixes || [];

    for (let index = 0; index < evalFixes.length; index += 1) {
      const fix = evalFixes[index];
      if (!acceptedEvalFixes[index] || !isAutoApplicableEvalFix(fix)) continue;

      const fixLabel = fix.target_name || `Fix ${index + 1}`;

      try {
        if (fix.kind === EVAL_FIX_KIND.dimensionRubric) {
          await updateEvalDimension({
            projectId,
            dimensionId: fix.target_id,
            agentId: applicationId,
            body: { description: fix.proposed_value },
          }).unwrap();
        } else if (fix.kind === EVAL_FIX_KIND.datasetCaseExpected) {
          await updateEvalDatasetCase({
            projectId,
            datasetId,
            caseId: fix.target_id,
            body: { expected_output: fix.proposed_value },
          }).unwrap();
        } else if (fix.kind === EVAL_FIX_KIND.dimensionTarget) {
          const match = TARGET_PARSE_REGEX.exec(fix.proposed_value || '');
          const bindingId = match
            ? bindingsData?.find(binding => binding.dimension_id === fix.target_id)?.id
            : null;

          if (!match || !bindingId) {
            toastWarning(`"${fixLabel}" ${NO_AUTO_APPLY_MESSAGE}`);
            continue;
          }

          await updateEvalBinding({
            projectId,
            suiteId,
            bindingId,
            body: { target: Number(match[2]), target_operator: match[1] },
          }).unwrap();
        }
      } catch (err) {
        toastWarning(`"${fixLabel}": ${parseEvalError(err, 'could not be applied.')}`);
      }
    }
  }, [
    proposal,
    acceptedEvalFixes,
    projectId,
    applicationId,
    datasetId,
    suiteId,
    bindingsData,
    updateEvalDimension,
    updateEvalDatasetCase,
    updateEvalBinding,
    toastWarning,
  ]);

  const handleSave = useCallback(async () => {
    if (acceptedPatches.length > 0) {
      if (conflictIndex !== -1) {
        toastError('Some accepted edits no longer match the current instructions. Uncheck them and retry.');
        throw new Error('instruction patch conflict');
      }

      try {
        await updateApplicationVersion({
          ...(versionDetail ?? {}),
          projectId,
          applicationId,
          versionId,
          instructions: proposedInstructions,
        }).unwrap();
        toastSuccess(`Instructions updated in version "${versionDetail?.name}".`);
      } catch (err) {
        toastError(parseEvalError(err, 'Failed to update the agent instructions.'));
        throw err;
      }
    }

    await applyEvalFixes();
  }, [
    acceptedPatches,
    conflictIndex,
    versionDetail,
    projectId,
    applicationId,
    versionId,
    proposedInstructions,
    updateApplicationVersion,
    applyEvalFixes,
    toastSuccess,
    toastError,
  ]);

  const handleSaveAsVersionClick = useCallback(() => {
    setShowVersionModal(true);
  }, []);

  const handleCancelVersion = useCallback(() => {
    setShowVersionModal(false);
    setVersionName('');
  }, []);

  const handleConfirmVersion = useCallback(async () => {
    const trimmedName = versionName.trim();
    if (!trimmedName || acceptedPatches.length === 0) return;

    setIsSavingAsVersion(true);

    try {
      const forkResult = await versionInstructionFork({
        projectId,
        applicationId,
        versionId,
        body: {
          expected_instructions_sha256: proposal?.instructions_sha256,
          patches: acceptedPatches.map(({ fix }) => toInstructionPatch(fix)),
          new_version_name: trimmedName,
        },
      }).unwrap();

      toastSuccess(`Version "${forkResult?.name || trimmedName}" created with the accepted edits.`);

      await applyEvalFixes();

      setShowVersionModal(false);
      setVersionName('');
      onClose();
    } catch (err) {
      toastError(parseEvalError(err, 'Failed to create the new version.'));
    } finally {
      setIsSavingAsVersion(false);
    }
  }, [
    versionName,
    acceptedPatches,
    versionInstructionFork,
    projectId,
    applicationId,
    versionId,
    proposal,
    applyEvalFixes,
    onClose,
    toastSuccess,
    toastError,
  ]);

  const handleVersionKeyDown = useCallback(
    e => {
      if (e.key === 'Enter' && versionName.trim()) {
        e.preventDefault();
        handleConfirmVersion();
      }
    },
    [versionName, handleConfirmVersion],
  );

  const renderStep = useCallback(
    (stepKey, draftData) => {
      switch (stepKey) {
        case ENHANCE_STEP_KEYS.analysis:
          return <EnhanceAnalysisStep proposal={draftData} />;
        case ENHANCE_STEP_KEYS.instructions:
          return (
            <EnhanceInstructionsStep
              currentInstructions={currentInstructions}
              proposedInstructions={proposedInstructions}
              isLoadingInstructions={isFetchingVersion && !versionDetail}
              agentFixes={agentFixes}
              acceptedFlags={acceptedAgentFixes}
              onToggle={handleToggleAgentFix}
              conflictIndex={conflictIndex}
            />
          );
        case ENHANCE_STEP_KEYS.dimensions:
          return (
            <EnhanceEvalFixesStep
              testId="enhance-dimensions-step"
              fixes={dimensionFixes}
              acceptedFlags={acceptedEvalFixes}
              onToggle={handleToggleEvalFix}
              description="Rubric and target changes the analysis suggests for the dimensions this run scored."
              bannerMessage={UNVERSIONED_DIMENSION_MESSAGE}
            />
          );
        case ENHANCE_STEP_KEYS.datasetCases:
          return (
            <EnhanceEvalFixesStep
              testId="enhance-dataset-cases-step"
              fixes={datasetFixes}
              acceptedFlags={acceptedEvalFixes}
              onToggle={handleToggleEvalFix}
              description="Changes to the dataset the run was scored against."
              bannerMessage={UNVERSIONED_DATASET_MESSAGE}
            />
          );
        default:
          return null;
      }
    },
    [
      currentInstructions,
      proposedInstructions,
      isFetchingVersion,
      versionDetail,
      agentFixes,
      acceptedAgentFixes,
      handleToggleAgentFix,
      conflictIndex,
      dimensionFixes,
      datasetFixes,
      acceptedEvalFixes,
      handleToggleEvalFix,
    ],
  );

  const hasAcceptedEvalFix = acceptedEvalFixes.some(Boolean);
  const hasConflict = conflictIndex !== -1;
  const isSaveDisabled = (acceptedPatches.length === 0 && !hasAcceptedEvalFix) || hasConflict;

  return (
    <>
      <EditEntityModal
        open={open}
        onClose={onClose}
        title="Enhance with AI"
        entityLabel="enhancement"
        skipPrompt
        loadingText="Analyzing run results..."
        onGenerate={handleGenerate}
        generateError={generateError}
        resetGenerate={resetGenerate}
        onDraftGenerated={handleDraftGenerated}
        steps={steps}
        renderStep={renderStep}
        onSave={handleSave}
        onSaveAsVersion={agentFixes.length > 0 ? handleSaveAsVersionClick : undefined}
        isSavingAsVersion={isSavingAsVersion}
        saveDisabled={isSaveDisabled}
        saveAsVersionDisabled={acceptedPatches.length === 0}
        saveLabel="Save"
        savingLabel="Saving..."
        modalTestId="enhance-with-ai-dialog"
        closeButtonTestId="enhance-with-ai-close-button"
        errorAlertTestId="enhance-with-ai-error"
        loadingIndicatorTestId="enhance-with-ai-loading"
        cancelButtonTestId="enhance-with-ai-cancel-button"
        retryButtonTestId="enhance-with-ai-retry-button"
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
        closeButtonTestId="enhance-version-dialog-close-button"
        cancelButtonTestId="enhance-version-dialog-cancel-button"
        confirmButtonTestId="enhance-version-dialog-save-button"
        content={
          <Input.InputBase
            label="Name"
            value={versionName}
            onChange={e => setVersionName(e.target.value)}
            inputProps={{ maxLength: 255, 'data-testid': 'enhance-version-dialog-name-input' }}
            autoFocus
          />
        }
      />
    </>
  );
});

EnhanceWithAiDialog.displayName = 'EnhanceWithAiDialog';

export default EnhanceWithAiDialog;
