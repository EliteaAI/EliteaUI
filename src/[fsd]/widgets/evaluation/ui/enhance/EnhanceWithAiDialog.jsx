import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Alert, Box, CircularProgress, Typography } from '@mui/material';

import { Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
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
import { parseEvalError } from '../../lib/helpers';
import EnhanceFixRow, { FIX_ROW_MODE } from './EnhanceFixRow';

const STEPS = {
  loading: 'loading',
  error: 'error',
  review: 'review',
  applying: 'applying',
  done: 'done',
};

const EVAL_FIX_KIND = {
  dimensionRubric: 'dimension_rubric',
  dimensionTarget: 'dimension_target',
  datasetCaseExpected: 'dataset_case_expected',
  datasetCoverageGap: 'dataset_coverage_gap',
};

const TARGET_PARSE_REGEX = /(>=|<=|==|>|<)\s*([\d.]+)/;
const NO_AUTO_APPLY_MESSAGE = 'Could not auto-apply — edit the target manually.';

const EnhanceWithAiDialog = memo(props => {
  const { open, onClose, applicationId, runId } = props;

  const projectId = useSelectedProjectId();
  const { toastSuccess } = useToast();

  const [step, setStep] = useState(STEPS.loading);
  const [proposal, setProposal] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [checkedAgentFixes, setCheckedAgentFixes] = useState([]);
  const [checkedEvalFixes, setCheckedEvalFixes] = useState([]);
  const [agentApplyResult, setAgentApplyResult] = useState(null);
  const [evalApplyResults, setEvalApplyResults] = useState([]);
  const generatePromiseRef = useRef(null);

  const [enhanceFromEval] = useEnhanceFromEvalMutation();
  const [versionInstructionFork] = useVersionInstructionForkMutation();
  const [updateEvalDimension] = useUpdateEvalDimensionMutation();
  const [updateEvalDatasetCase] = useUpdateEvalDatasetCaseMutation();
  const [updateEvalBinding] = useUpdateEvalBindingMutation();

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

  const loadProposal = useCallback(() => {
    setStep(STEPS.loading);
    setErrorMessage('');
    const promise = enhanceFromEval({ projectId, body: { run_id: runId } });
    generatePromiseRef.current = promise;
    promise
      .unwrap()
      .then(result => {
        generatePromiseRef.current = null;
        setProposal(result);
        setCheckedAgentFixes((result.agent_fixes || []).map(() => true));
        setCheckedEvalFixes(
          (result.eval_fixes || []).map(fix => fix.kind !== EVAL_FIX_KIND.datasetCoverageGap),
        );
        setStep(STEPS.review);
      })
      .catch(err => {
        generatePromiseRef.current = null;
        if (err?.name === 'AbortError') return;
        setErrorMessage(parseEvalError(err, 'Failed to generate suggestions.'));
        setStep(STEPS.error);
      });
  }, [enhanceFromEval, projectId, runId]);

  useEffect(() => {
    if (open && projectId && runId) {
      setProposal(null);
      setAgentApplyResult(null);
      setEvalApplyResults([]);
      loadProposal();
    }
    // Only re-run when the dialog is (re)opened for a given run — loadProposal is stable enough
    // for the fields it closes over, and re-running on every render would refetch endlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId, runId]);

  const handleClose = useCallback(() => {
    if (generatePromiseRef.current) {
      generatePromiseRef.current.abort();
      generatePromiseRef.current = null;
    }
    onClose();
  }, [onClose]);

  const toggleAgentFix = useCallback(index => {
    setCheckedAgentFixes(prev => prev.map((checked, i) => (i === index ? !checked : checked)));
  }, []);

  const toggleEvalFix = useCallback(
    index => {
      if (proposal?.eval_fixes?.[index]?.kind === EVAL_FIX_KIND.datasetCoverageGap) return;
      setCheckedEvalFixes(prev => prev.map((checked, i) => (i === index ? !checked : checked)));
    },
    [proposal],
  );

  const handleApply = useCallback(async () => {
    if (!proposal) return;
    setStep(STEPS.applying);

    const agentFixes = proposal.agent_fixes || [];
    const evalFixes = proposal.eval_fixes || [];
    const agentIndexes = agentFixes.map((_, i) => i).filter(i => checkedAgentFixes[i]);
    const evalIndexes = evalFixes.map((_, i) => i).filter(i => checkedEvalFixes[i]);

    let agentResult = null;
    if (agentIndexes.length > 0) {
      const patches = agentIndexes.map(i => ({
        old_text: agentFixes[i].old_text,
        replacement: agentFixes[i].replacement,
        replace_all: agentFixes[i].replace_all || false,
      }));
      try {
        const forkResult = await versionInstructionFork({
          projectId,
          applicationId,
          versionId: proposal.version_id,
          body: { expected_instructions_sha256: proposal.instructions_sha256, patches },
        }).unwrap();
        agentResult = { indexes: agentIndexes, status: 'success' };
        toastSuccess(`Agent instructions forked into version "${forkResult?.name || forkResult?.id}".`);
      } catch (err) {
        agentResult = {
          indexes: agentIndexes,
          status: 'error',
          message: parseEvalError(err, 'Failed to apply agent fixes.'),
        };
      }
    }
    setAgentApplyResult(agentResult);

    const evalResults = [];
    for (const i of evalIndexes) {
      const fix = evalFixes[i];
      try {
        if (fix.kind === EVAL_FIX_KIND.dimensionRubric) {
          await updateEvalDimension({
            projectId,
            dimensionId: fix.target_id,
            agentId: applicationId,
            body: { description: fix.proposed_value },
          }).unwrap();
          evalResults.push({ index: i, status: 'success' });
        } else if (fix.kind === EVAL_FIX_KIND.datasetCaseExpected) {
          await updateEvalDatasetCase({
            projectId,
            datasetId,
            caseId: fix.target_id,
            body: { expected_output: fix.proposed_value },
          }).unwrap();
          evalResults.push({ index: i, status: 'success' });
        } else if (fix.kind === EVAL_FIX_KIND.dimensionTarget) {
          const match = TARGET_PARSE_REGEX.exec(fix.proposed_value || '');
          const bindingId = match
            ? bindingsData?.find(binding => binding.dimension_id === fix.target_id)?.id
            : null;
          if (!match || !bindingId) {
            evalResults.push({ index: i, status: 'error', message: NO_AUTO_APPLY_MESSAGE });
            continue;
          }
          await updateEvalBinding({
            projectId,
            suiteId,
            bindingId,
            body: { target: Number(match[2]), target_operator: match[1] },
          }).unwrap();
          evalResults.push({ index: i, status: 'success' });
        }
      } catch (err) {
        evalResults.push({ index: i, status: 'error', message: parseEvalError(err, 'Failed to apply fix.') });
      }
    }
    setEvalApplyResults(evalResults);
    setStep(STEPS.done);
  }, [
    proposal,
    checkedAgentFixes,
    checkedEvalFixes,
    projectId,
    applicationId,
    datasetId,
    suiteId,
    bindingsData,
    versionInstructionFork,
    updateEvalDimension,
    updateEvalDatasetCase,
    updateEvalBinding,
    toastSuccess,
  ]);

  const styles = enhanceWithAiDialogStyles();

  const renderLoading = () => (
    <Box
      sx={styles.loadingContainer}
      data-testid="enhance-with-ai-loading"
    >
      <CircularProgress size={24} />
      <Typography
        color="text.secondary"
        sx={styles.loadingText}
      >
        Analyzing run results...
      </Typography>
    </Box>
  );

  const renderError = () => (
    <Alert
      severity="error"
      data-testid="enhance-with-ai-error"
    >
      {errorMessage}
    </Alert>
  );

  const renderAgentFix = (fix, index) => (
    <EnhanceFixRow
      key={`agent-${index}`}
      testId={`enhance-agent-fix-${index}`}
      mode={step === STEPS.review ? FIX_ROW_MODE.checkbox : FIX_ROW_MODE.status}
      checked={checkedAgentFixes[index]}
      onToggle={() => toggleAgentFix(index)}
      status={agentApplyResult?.indexes?.includes(index) ? agentApplyResult.status : undefined}
      statusMessage={agentApplyResult?.indexes?.includes(index) ? agentApplyResult.message : undefined}
      before={fix.replace_all ? 'Rewrites the entire instructions' : fix.old_text}
      after={fix.replacement}
      rationale={fix.rationale}
    />
  );

  const renderEvalFix = (fix, index) => {
    const isCoverageGap = fix.kind === EVAL_FIX_KIND.datasetCoverageGap;
    const applyResult = evalApplyResults.find(result => result.index === index);
    return (
      <EnhanceFixRow
        key={`eval-${index}`}
        testId={`enhance-eval-fix-${index}`}
        mode={step === STEPS.review ? FIX_ROW_MODE.checkbox : FIX_ROW_MODE.status}
        checked={checkedEvalFixes[index]}
        onToggle={() => toggleEvalFix(index)}
        disabled={isCoverageGap}
        status={applyResult?.status}
        statusMessage={isCoverageGap ? 'Not auto-applied — review manually.' : applyResult?.message}
        title={fix.target_name}
        dimensionTier={fix.dimension_tier}
        before={isCoverageGap ? null : fix.current_value}
        after={isCoverageGap ? 'New case' : fix.proposed_value}
        rationale={fix.rationale}
      />
    );
  };

  const renderReviewOrResults = () => {
    const agentFixes = proposal?.agent_fixes || [];
    const evalFixes = proposal?.eval_fixes || [];
    const isEmpty = agentFixes.length === 0 && evalFixes.length === 0;

    if (isEmpty) {
      return (
        <Typography
          variant="bodyMedium"
          sx={styles.emptyText}
          data-testid="enhance-with-ai-empty"
        >
          No suggestions — the agent and evaluation look consistent for this run.
        </Typography>
      );
    }

    return (
      <Box sx={styles.reviewContainer}>
        {proposal?.diagnosis && <Typography variant="bodyMedium">{proposal.diagnosis}</Typography>}
        {proposal?.coverage && (
          <Typography
            variant="bodySmall"
            sx={styles.coverageText}
          >
            Based on {proposal.coverage.total_cases} cases, {proposal.coverage.missed_bindings} missed
            targets.
          </Typography>
        )}
        {agentFixes.length > 0 && (
          <Box sx={styles.section}>
            <Typography sx={styles.sectionLabel}>Agent Fixes</Typography>
            <Box sx={styles.cardList}>{agentFixes.map(renderAgentFix)}</Box>
          </Box>
        )}
        {evalFixes.length > 0 && (
          <Box sx={styles.section}>
            <Typography sx={styles.sectionLabel}>Evaluation Fixes</Typography>
            <Box sx={styles.cardList}>{evalFixes.map(renderEvalFix)}</Box>
          </Box>
        )}
      </Box>
    );
  };

  const renderContent = () => {
    if (step === STEPS.loading) return renderLoading();
    if (step === STEPS.error) return renderError();
    return renderReviewOrResults();
  };

  const hasAnyFixes = (proposal?.agent_fixes?.length || 0) + (proposal?.eval_fixes?.length || 0) > 0;

  const renderActions = () => {
    if (step === STEPS.loading || step === STEPS.applying) return null;

    if (step === STEPS.error) {
      return (
        <>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.secondary}
            onClick={handleClose}
            data-testid="enhance-with-ai-cancel-button"
          >
            Close
          </Button.BaseBtn>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.primary}
            onClick={loadProposal}
            data-testid="enhance-with-ai-retry-button"
          >
            Try again
          </Button.BaseBtn>
        </>
      );
    }

    if (step === STEPS.done) {
      return (
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.primary}
          onClick={handleClose}
          data-testid="enhance-with-ai-done-button"
        >
          Close
        </Button.BaseBtn>
      );
    }

    return (
      <>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.secondary}
          onClick={handleClose}
          data-testid="enhance-with-ai-decline-button"
        >
          Decline
        </Button.BaseBtn>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.primary}
          onClick={handleApply}
          disabled={!hasAnyFixes}
          data-testid="enhance-with-ai-apply-button"
        >
          Apply
        </Button.BaseBtn>
      </>
    );
  };

  return (
    <Modal.BaseModal
      open={open}
      title="Enhance with AI"
      onClose={handleClose}
      content={renderContent()}
      actions={renderActions()}
      sx={styles.dialogPaper}
      dialogSx={styles.dialogBody}
      data-testid="enhance-with-ai-dialog"
    />
  );
});

EnhanceWithAiDialog.displayName = 'EnhanceWithAiDialog';

/** @type {MuiSx} */
const enhanceWithAiDialogStyles = () => ({
  dialogPaper: {
    '& .MuiDialog-paper': {
      width: '45rem !important',
      maxWidth: '80% !important',
    },
  },
  dialogBody: {
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
  loadingText: {
    fontSize: '0.875rem',
  },
  emptyText: ({ palette }) => ({
    color: palette.text.primary,
    padding: '2rem 0',
    textAlign: 'center',
  }),
  reviewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  coverageText: ({ palette }) => ({
    color: palette.text.primary,
  }),
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  sectionLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    letterSpacing: '0.045rem',
    textTransform: 'uppercase',
    color: 'text.primary',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
});

export default EnhanceWithAiDialog;
