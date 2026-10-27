import { useCallback, useRef, useState } from 'react';

import { useToast } from '@/[fsd]/shared/lib/hooks';

import { APPROVAL_RULE, RISK_NAME_MISMATCH, RISK_SAVE_ERROR } from '../constants';
import { isPromptShown, toCreateBody, toFieldErrors, toUpdateBody } from '../helpers';

// Fields with their own message in the form; a 400 for any other field goes to the banner
const FIELDS_WITH_INPUT = [
  'name',
  'description',
  'application_id',
  'version_id',
  'approval_rule',
  'cron',
  'expires_at',
];
const PROMPT_FIELDS = ['prompt', 'variables'];

/**
 * The save flow of the schedule form: the risk review, the save call with its error branches, the warnings
 * dialog and the Test run that waits for a save. `submit(values, helpers)` is the Formik submit handler;
 * `riskCheck` is the result of `useScheduleRiskCheck`, read when a save runs.
 */
export const useScheduleSave = ({ formik, riskCheck, schedule, onSubmit, onSaved, onTestRun }) => {
  const { setFieldValue } = formik;
  const { toastError } = useToast();
  const [banner, setBanner] = useState('');
  const [saved, setSaved] = useState(null);
  const [ruleChanged, setRuleChanged] = useState(false);
  const [savedRule, setSavedRule] = useState('');
  const [testRunPending, setTestRunPending] = useState(false);
  const [testRunError, setTestRunError] = useState('');
  // review: the values and the pending Test run of a save that waits for the risk review dialog
  const [review, setReview] = useState(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  // afterSave: the Test run that replaces onSaved after this save; afterWarnings keeps it until the dialog closes
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
      else toastError('Failed to save the schedule');
      return;
    }
    setReview(null);
    const approvalRule = answer?.approval_rule ?? values.approval_rule;
    const hasWarnings = answer?.warnings?.length > 0;
    // The saved values are the new baseline, so the leave-page blocker stays shut
    resetTo({ values: { ...values, approval_rule: approvalRule } });
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
    const runAfterSave = afterSave.current;
    // A fresh check on Save: a blocked or failed check shows in the form, sensitive tools open the review
    const risk = await riskCheck.runCheck();
    if (!risk) return toastError('The risk check did not run. Try again.');
    if (risk.blocking?.length) return;
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

  // A clean form runs at once; a changed one saves first, and a failed or invalid save never reaches the run
  const runTest = useCallback(async () => {
    setTestRunPending(true);
    try {
      await onTestRun();
    } catch (error) {
      if (error?.status === 400 || error?.status === 409) setTestRunError(error.data?.error ?? '');
      else toastError('Failed to start the test run');
    } finally {
      setTestRunPending(false);
    }
  }, [onTestRun, toastError]);

  const handleTestRun = async () => {
    setTestRunError('');
    setTestRunPending(true);
    try {
      if (formik.dirty) {
        afterSave.current = runTest;
        await formik.submitForm();
      } else await runTest();
    } finally {
      afterSave.current = null;
      setTestRunPending(false);
    }
  };
  // The dialog close is the post-save point: a pending Test run starts here, else onSaved
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
    testRunPending,
    testRunError,
    submit,
    handleReviewConfirm,
    handleReviewCancel,
    handleTestRun,
    handleWarningsClose,
  };
};
