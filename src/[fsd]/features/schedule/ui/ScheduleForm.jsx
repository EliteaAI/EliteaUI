import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormik } from 'formik';
import { Link as RouterLink } from 'react-router-dom';

import { Box, CircularProgress, Grid, Link, Typography } from '@mui/material';

import { GenerateEntityButton } from '@/[fsd]/entities/generate-entity-with-ai';
import { useGetScheduleSettingsQuery } from '@/[fsd]/entities/schedule';
import { VersionSelect, getDefaultVersionId } from '@/[fsd]/entities/version';
import {
  getEntityLock,
  isPromptShown,
  resetWhatToRun,
  scheduleFormSchema,
  syncPromptVariables,
  toCreateBody,
  toFieldErrors,
  toUpdateBody,
} from '@/[fsd]/features/schedule/lib/helpers';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import BannerMessage from '@/[fsd]/shared/ui/banner-message/BannerMessage';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import BaseBtn from '@/[fsd]/shared/ui/button/BaseBtn';
import RadioButtonGroup from '@/[fsd]/shared/ui/checkbox/RadioButtonGroup';
import EntityTypeIcon from '@/[fsd]/shared/ui/icon/EntityTypeIcon';
import StyledInputEnhancer from '@/[fsd]/shared/ui/input/StyledInputEnhancer';
import LazySelect from '@/[fsd]/shared/ui/select/LazySelect';
import { useApplicationDetailsQuery, useApplicationListQuery } from '@/api/applications';
import { MAX_DESCRIPTION_LENGTH, PERMISSIONS } from '@/common/constants';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import StyledTabs from '@/components/StyledTabs';
import VariableList from '@/components/VariableList';
import useCheckPermission from '@/hooks/useCheckPermission';
import useNavBlocker from '@/hooks/useNavBlocker';
import { StyledGridContainer, TabBarItems } from '@/pages/Common/Components/StyledComponents';
import RouteDefinitions from '@/routes';

import { APPROVAL_RULE, RISK_CHECK_STATUS, RISK_NAME_MISMATCH, RISK_SAVE_ERROR } from '../lib/constants';
import { useScheduleRiskCheck } from '../lib/hooks';
import BuildScheduleWithAiModal from './BuildScheduleWithAiModal';
import RiskReviewDialog from './RiskReviewDialog';
import SaveWarningsDialog from './SaveWarningsDialog';
import ScheduleRiskBlockBox from './ScheduleRiskBlockBox';

const TYPE_ITEMS = [
  { value: 'agent', label: 'Agent' },
  { value: 'pipeline', label: 'Pipeline' },
];
const RUN_MODE_ITEMS = [
  { value: 'entry_point', label: 'Entry point' },
  { value: 'prompt', label: 'Prompt' },
];
const APPROVAL_RULE_ITEMS = [
  { value: APPROVAL_RULE.PAUSE_AND_ASK, label: 'Pause and ask me' },
  { value: APPROVAL_RULE.RUN_WITHOUT_ASKING, label: 'Run without asking' },
];
const TYPE_LABEL = Object.fromEntries(TYPE_ITEMS.map(({ value, label }) => [value, label]));
// Fields with their own message in the form; a 400 for any other field goes to the banner (R6.3)
const FIELDS_WITH_INPUT = ['name', 'description', 'application_id', 'version_id', 'approval_rule', 'cron', 'expires_at'];
const PROMPT_FIELDS = ['prompt', 'variables'];
const AGENTS_TYPE = { agent: 'classic', pipeline: 'pipeline' };
// The risk check states that keep Save disabled (owner CR 2026-10-21)
const RISK_STATES_WITHOUT_SAVE = [
  RISK_CHECK_STATUS.CHECKING,
  RISK_CHECK_STATUS.BLOCKED,
  RISK_CHECK_STATUS.FAILED,
];
const RISK_HINT_ID = 'schedule-risk-hint';
// "21 Oct 2026" for the line of who confirmed "Run without asking"
const CONFIRMED_DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// "Confirmed by X on <date>"; a missing or invalid date leaves "Confirmed by X" (format() throws on an invalid date)
const formatConfirmation = (by, at) => {
  const date = at ? new Date(at) : null;
  return date && !Number.isNaN(date.getTime())
    ? `Confirmed by ${by} on ${CONFIRMED_DATE.format(date)}`
    : `Confirmed by ${by}`;
};

const getEntityType = details => (details?.version_details?.agent_type === 'pipeline' ? 'pipeline' : 'agent');

const FieldError = ({ message }) =>
  message ? (
    <Typography
      role="alert"
      variant="labelSmall"
      color="error"
    >
      {message}
    </Typography>
  ) : null;

const ownerName = owner => owner?.name || owner?.email || '-';

/**
 * `children({ values, setFieldValue, dirty, setValues, fieldError })` fills SCHEDULE SETTINGS from the form values (cron, expires_at);
 * `onSubmit(body)` returns a promise of the save answer and rejects with the API error;
 * `onSaved(answer)` runs at once after a save without warnings, else when the warnings dialog closes.
 * `schedule` turns on edit mode: read-only Owner and update body. `entityName` names the page.
 * `sidePanel({ onTestRun, testRunPending, testRunError })` renders a card right of the form, as the
 * Agents editor puts its chat; its `onTestRun` saves a changed form, then calls the `onTestRun()` prop
 * (a promise) in the place of `onSaved` at the same post-save point. What `sidePanel` returns (the panel and
 * the Runs section under it) fills the right column from xl, and sits under the form below it.
 * `headerActions` (a node) sits in the header bar after Cancel, for example the page's 3-dots menu.
 */
const ScheduleForm = memo(props => {
  const {
    initialValues,
    lockedEntity,
    schedule,
    entityName,
    onSubmit,
    onSaved,
    onTestRun,
    onCancel,
    sidePanel,
    headerActions,
    children,
  } = props;

  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const { checkPermission } = useCheckPermission();
  // Only a project admin can change the setting, so only an admin gets the link to it
  const canChangeProjectSettings = checkPermission(PERMISSIONS.schedules.admin);
  const [list, setList] = useState({ page: 0, query: '' });
  const [lockFailed, setLockFailed] = useState(false);
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

  const formik = useFormik({
    initialValues,
    validationSchema: scheduleFormSchema,
    // Runs after validation, so the review never opens on an invalid form
    onSubmit: async (values, helpers) => {
      setBanner('');
      const runAfterSave = afterSave.current;
      // A fresh check on Save: a blocked or failed check shows in the form, sensitive tools open the review
      const risk = await riskCheck.runCheck();
      if (!risk || risk.blocking?.length) return;
      // An edit that keeps the stored "Run without asking" consent saves without a new review (R2.6)
      const keepsConsent = risk.confirmed && values.approval_rule === APPROVAL_RULE.RUN_WITHOUT_ASKING;
      if (risk.sensitive?.length && !keepsConsent) setReview({ values, runAfterSave, changed: false });
      else await saveSchedule(values, helpers, runAfterSave);
    },
  });
  const { values, errors, submitCount, setFieldValue, setValues, resetForm } = formik;
  const riskCheck = useScheduleRiskCheck({
    projectId,
    entityType: values.type,
    applicationId: values.application_id,
    versionId: values.version_id,
    scheduleId: schedule?.id,
  });
  const riskBlocksSave = RISK_STATES_WITHOUT_SAVE.includes(riskCheck.status);

  // A rule other than the form field sets the field, then saves
  const handleReviewConfirm = async ({ rule, confirmedName }) => {
    if (rule !== values.approval_rule) setFieldValue('approval_rule', rule);
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
  // Unsaved changes open the leave dialog (R1.3); a save in progress never does
  const blockOptions = useMemo(
    () => ({ blockCondition: formik.dirty && !formik.isSubmitting }),
    [formik.dirty, formik.isSubmitting],
  );
  useNavBlocker(blockOptions);
  // Messages show after the first Save, so a half-filled form shows no required errors
  const fieldError = name => (submitCount ? errors[name] : '');

  const {
    data: listData,
    isFetching,
    isError: isListError,
    originalArgs: listArgs,
  } = useApplicationListQuery({
    projectId,
    page: list.page,
    params: { query: list.query, agents_type: AGENTS_TYPE[values.type] },
  });
  // A failed page keeps the loaded items and gives its page back, so the next scroll asks the same offset (R1.4)
  useEffect(() => {
    if (isListError && list.page > 0 && listArgs?.page === list.page)
      setList(prev => ({ ...prev, page: prev.page - 1 }));
  }, [isListError, listArgs, list.page]);
  const { currentData: details, isFetching: isDetailsFetching } = useApplicationDetailsQuery(
    { projectId, applicationId: values.application_id },
    { skip: !values.application_id },
  );

  const lockActive = !!lockedEntity && !lockFailed;
  const lock = getEntityLock(lockedEntity, details && { type: getEntityType(details) });

  useEffect(() => {
    if (lockActive && !isDetailsFetching && lock.unavailable) {
      setLockFailed(true);
      // Clear the entity in the baseline too, so only the user's own edits make the form dirty (R1.3)
      resetForm({ values: { ...initialValues, application_id: '' } });
      setValues(prev => ({ ...prev, application_id: '' }), false);
    }
  }, [lockActive, isDetailsFetching, lock.unavailable, initialValues, resetForm, setValues]);

  const lockRejected = lockActive && lock.unavailable;
  useEffect(() => {
    if (
      details &&
      !lockRejected &&
      String(details.id) === String(values.application_id) &&
      !values.version_id
    ) {
      // A form nested in an editor keeps the editor's version (R5.3)
      const versionId = lockedEntity?.versionId ?? getDefaultVersionId(details);
      // The preset for the URL entity belongs to the baseline: opening and leaving asks nothing (R1.3)
      if (!formik.dirty && String(values.application_id) === String(initialValues.application_id))
        resetForm({ values: { ...values, version_id: versionId } });
      else setFieldValue('version_id', versionId);
    }
  }, [
    details,
    lockRejected,
    lockedEntity?.versionId,
    values,
    initialValues.application_id,
    formik.dirty,
    resetForm,
    setFieldValue,
  ]);

  const options = useMemo(() => {
    const rows = listData?.rows ?? [];
    const withSelected = details && !rows.some(row => row.id === details.id) ? [details, ...rows] : rows;
    return withSelected.map(({ id, name }) => ({
      value: id,
      label: name,
      icon: (
        <EntityTypeIcon
          type={values.type}
          showBigIcon={false}
        />
      ),
    }));
  }, [listData, details, values.type]);

  // setFieldValue changes one field only, so a fast second change keeps the first; radio clicks reset many fields
  const handleTypeChange = useCallback(
    type => {
      setValues(prev => resetWhatToRun(prev, type));
      setList({ page: 0, query: '' });
    },
    [setValues],
  );

  const handleEntityChange = useCallback(
    id => {
      setFieldValue('application_id', id);
      setFieldValue('version_id', '');
    },
    [setFieldValue],
  );

  const handlePromptChange = useCallback(
    event => {
      const prompt = event.target.value;
      setFieldValue('prompt', prompt);
      setFieldValue('variables', syncPromptVariables(prompt, values.variables));
    },
    [setFieldValue, values.variables],
  );

  const handleRunModeChange = useCallback(
    runMode => setValues(prev => ({ ...prev, run_mode: runMode, prompt: '', variables: [] })),
    [setValues],
  );

  const handleVariableChange = useCallback(
    (name, value) =>
      setFieldValue(
        'variables',
        values.variables.map(variable => (variable.name === name ? { ...variable, value } : variable)),
      ),
    [setFieldValue, values.variables],
  );

  // The dialog close is the post-save point: a pending Test run starts here, else onSaved
  const handleWarningsClose = useCallback(() => {
    const next = afterWarnings.current ?? onSaved;
    afterWarnings.current = null;
    setSaved(null);
    next?.(saved);
  }, [onSaved, saved]);

  const { data: scheduleSettings } = useGetScheduleSettingsQuery({ projectId }, { skip: !projectId });
  // Three states: undefined while loading or on error, then true or false; only an explicit false shows the hint
  const runWithoutAskingAllowed = scheduleSettings?.allow_run_without_asking;
  const showHint = runWithoutAskingAllowed === false || ruleChanged;
  const ruleNote = ruleChanged
    ? `The schedule was saved with the rule "${APPROVAL_RULE_ITEMS.find(item => item.value === savedRule)?.label ?? savedRule}".`
    : '';
  const approvalRuleItems = APPROVAL_RULE_ITEMS.map(item => ({
    ...item,
    disabled: item.value === APPROVAL_RULE.RUN_WITHOUT_ASKING && runWithoutAskingAllowed !== true,
  }));

  const showPrompt = isPromptShown(values);
  const versionName = details?.versions?.find(
    version => String(version.id) === String(values.version_id),
  )?.name;
  const entityLabel = [details?.name, versionName].filter(Boolean).join(' ');

  const entityPicker = (
    <>
      {lockFailed && (
        <BannerMessage
          message="The entity is not available."
          variant="warning"
        />
      )}
      <RadioButtonGroup
        testId="schedule-type"
        items={TYPE_ITEMS}
        value={values.type}
        onChange={handleTypeChange}
        disabled={lockActive}
      />
      <LazySelect
        required
        showOptionIcon
        showEmptyPlaceholder={false}
        label={TYPE_LABEL[values.type]}
        value={values.application_id}
        onValueChange={handleEntityChange}
        options={options}
        total={listData?.total}
        isFetching={isFetching}
        onLoadMore={() => setList(prev => ({ ...prev, page: prev.page + 1 }))}
        searchString={list.query}
        onSearch={query => setList({ page: 0, query })}
        disabled={lockActive}
        error={!!fieldError('application_id')}
        helperText={fieldError('application_id')}
      />
      {/* the borderless select shows no helper text itself */}
      {fieldError('application_id') && (
        <Typography
          variant="bodySmall"
          color="error"
        >
          {fieldError('application_id')}
        </Typography>
      )}
    </>
  );
  const riskNotices = (
    <>
      {riskCheck.status === RISK_CHECK_STATUS.BLOCKED && (
        <ScheduleRiskBlockBox
          blocking={riskCheck.result.blocking}
          entityType={values.type}
          entityId={values.application_id}
          versionId={values.version_id}
          projectId={projectId}
        />
      )}
      {riskCheck.status === RISK_CHECK_STATUS.FAILED && (
        <BannerMessage variant="warning">
          <Box sx={styles.riskFailed}>
            <Typography variant="bodySmall">The risk check did not run. Try again.</Typography>
            <BaseBtn
              type="button"
              variant="elitea"
              color="secondary"
              onClick={riskCheck.runCheck}
            >
              Retry
            </BaseBtn>
          </Box>
        </BannerMessage>
      )}
    </>
  );
  const versionPicker = (
    <>
      <VersionSelect
        entityId={values.application_id}
        versions={details?.versions}
        defaultVersionID={getDefaultVersionId(details)}
        value={values.version_id}
        onChange={versionId => setFieldValue('version_id', versionId)}
        disabled={!values.application_id}
      />
      <FieldError message={fieldError('version_id')} />
    </>
  );
  const promptFields = (
    <>
      {values.type === 'pipeline' && (
        <RadioButtonGroup
          testId="schedule-run-mode"
          items={RUN_MODE_ITEMS}
          value={values.run_mode}
          onChange={handleRunModeChange}
        />
      )}
      {showPrompt && (
        <>
          <StyledInputEnhancer
            required
            multiline
            label="Prompt"
            value={values.prompt}
            onChange={handlePromptChange}
            error={!!fieldError('prompt')}
            helperText={fieldError('prompt')}
          />
          <VariableList
            variables={values.variables}
            onChangeVariable={handleVariableChange}
          />
          <FieldError message={typeof errors.variables === 'string' ? errors.variables : ''} />
        </>
      )}
    </>
  );
  // A form nested in an editor takes the entity and version from the route: its selectors and WHAT TO RUN
  // are hidden and the prompt fields move under GENERAL (R5.3, R5.4)
  const hideWhatToRun = lockActive;

  const sections = [
    {
      title: 'GENERAL',
      testId: 'schedule-section-general',
      summaryAction: !schedule?.id && (
        <GenerateEntityButton
          permission={PERMISSIONS.schedules.create}
          buttonTestId="generate-schedule-open-button"
          renderModal={({ open, onClose }) => (
            <BuildScheduleWithAiModal
              open={open}
              onClose={onClose}
              formik={formik}
              lockedEntity={lockedEntity}
            />
          )}
        />
      ),
      content: (
        <Box sx={styles.section}>
          {schedule && (
            <StyledInputEnhancer
              disabled
              label="Owner"
              value={ownerName(schedule.owner)}
            />
          )}
          <StyledInputEnhancer
            required
            label="Name"
            value={values.name}
            onChange={event => setFieldValue('name', event.target.value)}
            error={!!fieldError('name')}
            helperText={fieldError('name')}
          />
          <StyledInputEnhancer
            multiline
            label="Description"
            value={values.description}
            onChange={event => setFieldValue('description', event.target.value)}
            inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
            error={!!fieldError('description')}
            helperText={fieldError('description')}
          />
          {hideWhatToRun && (
            <>
              {riskNotices}
              {promptFields}
            </>
          )}
        </Box>
      ),
    },
    !hideWhatToRun && {
      title: 'WHAT TO RUN',
      testId: 'schedule-section-what-to-run',
      content: (
        <Box sx={styles.section}>
          {entityPicker}
          {riskNotices}
          {versionPicker}
          {promptFields}
        </Box>
      ),
    },
    {
      title: 'SCHEDULE SETTINGS',
      testId: 'schedule-section-settings',
      content: (
        <Box sx={styles.section}>
          {children?.({ values, setFieldValue, dirty: formik.dirty, setValues, fieldError })}
          <Typography
            id="schedule-approval-rule-label"
            variant="labelMedium"
          >
            Approval rule
          </Typography>
          <Box
            role="group"
            data-testid="schedule-approval-rule-group"
            aria-describedby={showHint ? 'schedule-approval-rule-hint' : undefined}
          >
            <RadioButtonGroup
              testId="schedule-approval-rule"
              items={approvalRuleItems}
              value={values.approval_rule}
              onChange={rule => setFieldValue('approval_rule', rule)}
            />
          </Box>
          {showHint && (
            <Typography
              id="schedule-approval-rule-hint"
              variant="bodySmall"
              color="text.secondary"
            >
              This project does not allow running without asking.
              {canChangeProjectSettings && (
                <>
                  {' '}
                  <Link
                    component={RouterLink}
                    to={RouteDefinitions.SettingsProjectGeneral}
                  >
                    Change it in Settings &gt; Project General
                  </Link>
                </>
              )}
            </Typography>
          )}
          {schedule?.approval_confirmed_by && (
            <Typography
              variant="bodySmall"
              color="text.secondary"
            >
              {formatConfirmation(schedule.approval_confirmed_by, schedule.approval_confirmed_at)}
            </Typography>
          )}
          <FieldError message={fieldError('approval_rule')} />
        </Box>
      ),
    },
  ].filter(Boolean);

  // The same header bar, column and collapsible sections as New Agent (CreateApplication)
  return (
    <>
      <StyledTabs
        leftPart={<Breadcrumbs entityName={entityName} />}
        tabsSX={styles.noTabIndicator}
        tabs={[
          {
            tabBarItems: (
              <TabBarItems>
                {riskCheck.status === RISK_CHECK_STATUS.CHECKING && (
                  <Box sx={styles.riskStatus}>
                    <CircularProgress size="1rem" />
                    <Typography variant="labelMedium">Checking risks</Typography>
                  </Box>
                )}
                {riskCheck.status === RISK_CHECK_STATUS.BLOCKED && (
                  <Box
                    id={RISK_HINT_ID}
                    sx={styles.riskStatus}
                  >
                    <Box
                      component={AttentionIcon}
                      aria-hidden
                      sx={styles.riskIcon}
                    />
                    <Typography variant="labelMedium">Fix the risk check to save</Typography>
                  </Box>
                )}
                <BaseBtn
                  data-testid="schedule-save-button"
                  variant="elitea"
                  color="primary"
                  disabled={formik.isSubmitting || riskBlocksSave || (!!schedule && !formik.dirty)}
                  aria-disabled={riskBlocksSave || undefined}
                  aria-describedby={riskCheck.status === RISK_CHECK_STATUS.BLOCKED ? RISK_HINT_ID : undefined}
                  onClick={formik.handleSubmit}
                >
                  Save
                </BaseBtn>
                <BaseBtn
                  data-testid="schedule-cancel-button"
                  variant="elitea"
                  color="secondary"
                  onClick={onCancel}
                >
                  Cancel
                </BaseBtn>
                {headerActions}
              </TabBarItems>
            ),
            content: (
              // With a side panel: the Agents editor split (ConfigurationTab). The Settings menu takes about
              // 30 rem more than the Agents page, so the split starts at xl (1536 px), not lg, and the card
              // goes under the form below it, where each half would be narrower than the Agents halves.
              <StyledGridContainer
                container
                columnSpacing="2rem"
                rowSpacing="1.5rem"
                sx={sidePanel && styles.split}
              >
                <Grid size={{ xs: 12, xl: sidePanel ? 6 : 12 }}>
                  <Box
                    component="form"
                    noValidate
                    onSubmit={formik.handleSubmit}
                    sx={styles.root}
                  >
                    {banner && (
                      <BannerMessage
                        message={banner}
                        variant="error"
                      />
                    )}
                    <BasicAccordion
                      showMode={AccordionConstants.AccordionShowMode.LeftMode}
                      accordionSX={styles.accordion}
                      items={sections}
                    />
                  </Box>
                </Grid>
                {sidePanel && (
                  <Grid
                    size={{ xs: 12, xl: 6 }}
                    sx={styles.sidePanel}
                  >
                    {sidePanel({
                      onTestRun: handleTestRun,
                      testRunPending: formik.isSubmitting || testRunPending,
                      testRunError,
                    })}
                  </Grid>
                )}
              </StyledGridContainer>
            ),
          },
        ]}
      />
      <RiskReviewDialog
        open={!!review}
        entityLabel={entityLabel}
        scheduleName={review?.values.name}
        tools={riskCheck.result?.sensitive}
        runWithoutAskingAllowed={riskCheck.result?.run_without_asking_allowed === true}
        scanIncomplete={riskCheck.result?.notices?.some(notice => notice.code === 'scan_incomplete')}
        showSettingsLink={canChangeProjectSettings}
        changed={review?.changed}
        nameError={review?.nameError}
        saving={reviewSaving}
        onCancel={handleReviewCancel}
        onConfirm={handleReviewConfirm}
      />
      <SaveWarningsDialog
        open={!!saved}
        warnings={saved?.warnings}
        note={ruleNote}
        onClose={handleWarningsClose}
      />
    </>
  );
});

ScheduleForm.displayName = 'ScheduleForm';

export default ScheduleForm;

/** @type {MuiSx} */
const styles = {
  // the New Agent form column (CreateAgentForm)
  root: { order: 1, width: '100%', margin: '0.75rem auto 0', maxWidth: '40.1875rem' },
  // the ConfigurationTab grid padding
  split: { padding: '0 1.5rem 1.5rem' },
  sidePanel: { order: 2, paddingTop: '0.75rem' },
  // The header holds one unlabelled tab, so its selected-tab indicator is a stray line under the crumbs
  noTabIndicator: { '& .MuiTabs-indicator': { display: 'none' } },
  accordion: ({ palette }) => ({ background: `${palette.background.default.tertiary} !important` }),
  section: { display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1.5rem' },
  riskStatus: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  riskIcon: { width: '1rem', height: '1rem' },
  riskFailed: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flex: 1,
  },
};
