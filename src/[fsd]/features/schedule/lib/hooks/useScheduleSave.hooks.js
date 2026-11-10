import { useCallback, useRef, useState } from 'react';

import { isWebhookRow, toKindNoun } from '@/[fsd]/entities/schedule';
import { APPROVAL_RULE } from '@/[fsd]/entities/schedule/lib/constants';
import { useToast } from '@/[fsd]/shared/lib/hooks';

import { CONNECTIONS_NOT_READY, RISK_NAME_MISMATCH, RISK_SAVE_ERROR } from '../constants';
import {
  connectionsBlockSave,
  isPromptShown,
  splitRiskFindings,
  toCreateBody,
  toFieldErrors,
  toUpdateBody,
} from '../helpers';

// Fields with their own message in the form; a 400 for any other field goes to the banner
const FIELDS_WITH_INPUT = [
  'name',
  'description',
  'application_id',
  'version_id',
  'approval_rule',
  'cron',
  'expires_at',
  'signing_secret_value',
];
const PROMPT_FIELDS = ['prompt', 'variables'];
// Test Run answers 400 with this code when the project does not allow "Run without asking"
const DRAFT_TEST_ERROR = {
  APPROVAL_NOT_ALLOWED: 'approval_rule_not_allowed',
  UNAVAILABLE: 'test_run_unavailable',
};
const TEST_RUN_UNAVAILABLE =
  'Test Run is not ready on this server yet. Ask an administrator to run the schedule migration.';

/**
 * The save flow of the schedule form: the risk review, the save call with its error branches, the warnings
 * dialog, the Run Now that waits for a save and the Test Run of the unsaved form. `submit(values, helpers)` is the Formik submit handler;
 * `riskCheck` is the result of `useScheduleRiskCheck`, read when a save runs; `connections` of `useScheduleConnections`.
 */
export const useScheduleSave = ({
  formik,
  riskCheck,
  connections,
  schedule,
  onSubmit,
  onSaved,
  onRunNow,
  onDraftTestRun,
}) => {
  const { setFieldValue } = formik;
  const { toastError, toastWarning } = useToast();
  const [banner, setBanner] = useState('');
  const [saved, setSaved] = useState(null);
  const [ruleChanged, setRuleChanged] = useState(false);
  const [savedRule, setSavedRule] = useState('');
  const [runNowPending, setRunNowPending] = useState(false);
  const [runNowError, setRunNowError] = useState('');
  const [draftTestPending, setDraftTestPending] = useState(false);
  const [draftTestError, setDraftTestError] = useState('');
  // review: the values and the pending Run Now of a save that waits for the risk review dialog
  const [review, setReview] = useState(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  // afterSave: the Run Now that replaces onSaved after this save; afterWarnings keeps it until the dialog closes
  const afterSave = useRef(null);
  const afterWarnings = useRef(null);

  // A 409 of the risk scan opens the review again or shows the block box; riskAck answers the review
  const saveSchedule = async (values, { setErrors, resetForm: resetTo }, runAfterSave, riskAck) => {
    setBanner('');
    let answer;
    try {
      const body = (schedule ? toUpdateBody : toCreateBody)(values);
      answer = await onSubmit(riskAck ? { ...body, risk_ack: riskAck } : body);
    } catch (error) {
      // Branch on the machine code; `error` is the human text
      const code = error?.data?.code;
      if (error?.status === 400 && code === RISK_NAME_MISMATCH && review) {
        riskCheck.applyFindings(error.data);
        setReview({ ...review, nameError: error.data.error });
        return;
      }
      if (error?.status === 409 && code === CONNECTIONS_NOT_READY) {
        setReview(null);
        if (!connections?.applyRows(error.data.rows)) setBanner(error.data.error ?? '');
        return;
      }
      const riskError = error?.status === 409 ? code : null;
      if (Object.values(RISK_SAVE_ERROR).includes(riskError)) {
        riskCheck.applyFindings(error.data);
        setReview(
          riskError === RISK_SAVE_ERROR.BLOCKED
            ? null
            : { values, runAfterSave, changed: riskError === RISK_SAVE_ERROR.CHANGED },
        );
        return;
      }
      setReview(null);
      const fieldErrors = error?.status === 400 ? toFieldErrors(error) : {};
      const shownFields = isPromptShown(values)
        ? [...FIELDS_WITH_INPUT, ...PROMPT_FIELDS]
        : FIELDS_WITH_INPUT;
      if (Object.keys(fieldErrors).some(field => shownFields.includes(field))) setErrors(fieldErrors);
      else if (error?.status === 400 || error?.status === 409) setBanner(error.data?.error ?? '');
      else toastError(`Failed to save the ${toKindNoun(values.trigger_kind)}`);
      return;
    }
    setReview(null);
    if (answer?.governance_notice) toastWarning(answer.governance_notice);
    const approvalRule = answer?.approval_rule ?? values.approval_rule;
    const hasWarnings = answer?.warnings?.length > 0;
    // The saved values are the new baseline, so the leave-page blocker stays shut
    // The pasted GitLab token is stored now, so the form keeps no copy of it
    resetTo({ values: { ...values, approval_rule: approvalRule, signing_secret_value: '' } });
    const changed = approvalRule !== values.approval_rule;
    setRuleChanged(changed);
    setSavedRule(approvalRule);
    // onSaved runs outside the try, so an error there never shows as a failed save
    if (hasWarnings || changed) {
      afterWarnings.current = runAfterSave;
      setSaved(answer);
    } else await (runAfterSave ?? onSaved)?.(answer);
  };

  const submit = async (values, helpers) => {
    setBanner('');
    // Enter in a field or Run Now can submit while the connections hold Save; the server would refuse it
    if (connections && connectionsBlockSave(isWebhookRow(values), connections)) return;
    const runAfterSave = afterSave.current;
    // A fresh check on Save: a blocked or failed check shows in the form, sensitive tools open the review
    const risk = await riskCheck.runCheck();
    if (!risk) return toastError('The risk check did not run. Try again.');
    // Under "Pause and ask me" a missing credential or sign-in does not stop the save: the run waits
    if (splitRiskFindings(risk, values.approval_rule, isWebhookRow(values)).blocking.length) return;
    // An edit that keeps the stored "Run without asking" consent saves without a new review
    const keepsConsent = risk.confirmed && values.approval_rule === APPROVAL_RULE.RUN_WITHOUT_ASKING;
    if (risk.sensitive?.length && !keepsConsent) setReview({ values, runAfterSave, changed: false });
    else await saveSchedule(values, helpers, runAfterSave);
  };

  // A rule other than the form field sets the field, then saves
  const handleReviewConfirm = async ({ rule, confirmedName }) => {
    if (rule !== formik.values.approval_rule) setFieldValue('approval_rule', rule);
    const { fingerprint } = riskCheck.result ?? {};
    setReview({ ...review, nameError: '' });
    setReviewSaving(true);
    try {
      await saveSchedule(
        { ...review.values, approval_rule: rule },
        formik,
        review.runAfterSave,
        confirmedName ? { fingerprint, confirmed_name: confirmedName } : { fingerprint },
      );
    } finally {
      setReviewSaving(false);
    }
  };
  const handleReviewCancel = useCallback(() => setReview(null), []);

  // The "Needs re-confirm" badge: the review opens even when the stored consent would let a save through
  const reconfirm = async () => {
    const risk = await riskCheck.runCheck();
    if (!risk) return toastError('The risk check did not run. Try again.');
    if (splitRiskFindings(risk, formik.values.approval_rule, isWebhookRow(formik.values)).blocking.length)
      return;
    if (risk.sensitive?.length) setReview({ values: formik.values, runAfterSave: null, changed: false });
  };

  // A clean form runs at once; a changed one saves first, and a failed or invalid save never reaches the run
  const runNow = useCallback(async () => {
    setRunNowPending(true);
    try {
      await onRunNow();
      return true;
    } catch (error) {
      if (error?.status === 400 || error?.status === 409) setRunNowError(error.data?.error ?? '');
      else toastError('Failed to start the run');
      return false;
    } finally {
      setRunNowPending(false);
    }
  }, [onRunNow, toastError]);

  const handleRunNow = async () => {
    setRunNowError('');
    setRunNowPending(true);
    // true only when the run started; a failed or invalid save never reaches the run
    let started = false;
    try {
      if (formik.dirty) {
        afterSave.current = async () => {
          started = await runNow();
        };
        await formik.submitForm();
      } else started = await runNow();
      return started;
    } finally {
      afterSave.current = null;
      setRunNowPending(false);
    }
  };
  // Test Run starts from the unsaved form: nothing is saved, and the server runs it as a run with no schedule.
  // An invalid form shows its field errors, as a Save would, and sends nothing.
  const handleDraftTestRun = async () => {
    setDraftTestError('');
    const isShownField = field =>
      (isPromptShown(formik.values) ? [...FIELDS_WITH_INPUT, ...PROMPT_FIELDS] : FIELDS_WITH_INPUT).includes(
        field,
      );
    const formErrors = await formik.validateForm();
    if (Object.keys(formErrors).length) {
      await formik.submitForm();
      return false;
    }
    setDraftTestPending(true);
    try {
      await onDraftTestRun(toCreateBody(formik.values));
      return true;
    } catch (error) {
      const code = error?.data?.code;
      if (error?.status === 400 && code === DRAFT_TEST_ERROR.APPROVAL_NOT_ALLOWED)
        formik.setErrors({ approval_rule: error.data.error });
      else if (error?.status === 400 && Object.keys(toFieldErrors(error)).some(isShownField))
        formik.setErrors(toFieldErrors(error));
      // An older server answers a 404 with no text; the toast below tells the user, as for any other failure
      else if ([400, 404, 409].includes(error?.status) && error.data?.error)
        setDraftTestError(error.data.error);
      // The server has not run the schedule migration yet; a fixed text keeps server detail off the page
      else if (error?.status === 503 && code === DRAFT_TEST_ERROR.UNAVAILABLE)
        setDraftTestError(TEST_RUN_UNAVAILABLE);
      else toastError('Failed to start the test run');
      return false;
    } finally {
      setDraftTestPending(false);
    }
  };

  // The dialog close is the post-save point: a pending Run Now starts here, else onSaved
  const handleWarningsClose = useCallback(() => {
    const next = afterWarnings.current ?? onSaved;
    afterWarnings.current = null;
    setSaved(null);
    next?.(saved);
  }, [onSaved, saved]);

  return {
    banner,
    saved,
    ruleChanged,
    savedRule,
    review,
    reviewSaving,
    runNowPending,
    runNowError,
    submit,
    handleReviewConfirm,
    handleReviewCancel,
    reconfirm,
    handleRunNow,
    draftTestPending,
    draftTestError,
    handleDraftTestRun,
    handleWarningsClose,
  };
};
