import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormik } from 'formik';

import { Box, Grid, Typography } from '@mui/material';

import { GenerateEntityButton } from '@/[fsd]/entities/generate-entity-with-ai';
import { useGetScheduleListQuery } from '@/[fsd]/entities/schedule';
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
import StyledTabs from '@/components/StyledTabs';
import VariableList from '@/components/VariableList';
import useNavBlocker from '@/hooks/useNavBlocker';
import { StyledGridContainer, TabBarItems } from '@/pages/Common/Components/StyledComponents';

import { APPROVAL_RULE } from '../lib/constants';
import BuildScheduleWithAiModal from './BuildScheduleWithAiModal';
import SaveWarningsDialog from './SaveWarningsDialog';

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
const FIELDS_WITH_INPUT = ['name', 'description', 'application_id', 'version_id', 'approval_rule'];
const PROMPT_FIELDS = ['prompt', 'variables'];
const AGENTS_TYPE = { agent: 'classic', pipeline: 'pipeline' };

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
 * `children({ values, setFieldValue, dirty, setValues })` fills SCHEDULE SETTINGS from the form values (cron, expires_at);
 * `onSubmit(body)` returns a promise of the save answer and rejects with the API error;
 * `onSaved(answer)` runs at once after a save without warnings, else when the warnings dialog closes.
 * `schedule` turns on edit mode: read-only Owner and update body. `entityName` names the page.
 * `sidePanel({ onTestRun, testRunPending, testRunError })` renders a card right of the form, as the
 * Agents editor puts its chat; its `onTestRun` saves a changed form, then calls the `onTestRun()` prop
 * (a promise) in the place of `onSaved` at the same post-save point.
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
    children,
  } = props;

  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const [list, setList] = useState({ page: 0, query: '' });
  const [lockFailed, setLockFailed] = useState(false);
  const [banner, setBanner] = useState('');
  const [saved, setSaved] = useState(null);
  const [ruleChanged, setRuleChanged] = useState(false);
  const [savedRule, setSavedRule] = useState('');
  const [testRunPending, setTestRunPending] = useState(false);
  const [testRunError, setTestRunError] = useState('');
  // afterSave: the Test run that replaces onSaved after this save; afterWarnings keeps it until the dialog closes
  const afterSave = useRef(null);
  const afterWarnings = useRef(null);

  const formik = useFormik({
    initialValues,
    validationSchema: scheduleFormSchema,
    onSubmit: async (values, { setErrors, resetForm: resetTo }) => {
      setBanner('');
      const runAfterSave = afterSave.current;
      let answer;
      try {
        answer = await onSubmit((schedule ? toUpdateBody : toCreateBody)(values));
      } catch (error) {
        const fieldErrors = error?.status === 400 ? toFieldErrors(error) : {};
        const shownFields = isPromptShown(values)
          ? [...FIELDS_WITH_INPUT, ...PROMPT_FIELDS]
          : FIELDS_WITH_INPUT;
        if (Object.keys(fieldErrors).some(field => shownFields.includes(field))) setErrors(fieldErrors);
        else if (error?.status === 400 || error?.status === 409) setBanner(error.data?.error ?? '');
        else toastError('Failed to save the schedule');
        return;
      }
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
    },
  });
  const { values, errors, submitCount, setFieldValue, setValues, resetForm } = formik;

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

  const { data: listData, isFetching } = useApplicationListQuery({
    projectId,
    page: list.page,
    params: { query: list.query, agents_type: AGENTS_TYPE[values.type] },
  });
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
      const versionId = getDefaultVersionId(details);
      // The preset for the URL entity belongs to the baseline: opening and leaving asks nothing (R1.3)
      if (!formik.dirty && String(values.application_id) === String(initialValues.application_id))
        resetForm({ values: { ...values, version_id: versionId } });
      else setFieldValue('version_id', versionId);
    }
  }, [details, lockRejected, values, initialValues.application_id, formik.dirty, resetForm, setFieldValue]);

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

  const { data: scheduleList } = useGetScheduleListQuery({ projectId, pageSize: 1 }, { skip: !projectId });
  // Three states: undefined while loading or on error, then true or false; only an explicit false shows the hint
  const runWithoutAskingAllowed = scheduleList?.runWithoutAskingAllowed;
  const showHint = runWithoutAskingAllowed === false || ruleChanged;
  const ruleNote = ruleChanged
    ? `The schedule was saved with the rule "${APPROVAL_RULE_ITEMS.find(item => item.value === savedRule)?.label ?? savedRule}".`
    : '';
  const approvalRuleItems = APPROVAL_RULE_ITEMS.map(item => ({
    ...item,
    disabled: item.value === APPROVAL_RULE.RUN_WITHOUT_ASKING && runWithoutAskingAllowed !== true,
  }));

  const showPrompt = isPromptShown(values);

  const sections = [
    {
      title: 'GENERAL',
      testId: 'schedule-section-general',
      summaryAction: (
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
        </Box>
      ),
    },
    {
      title: 'WHAT TO RUN',
      testId: 'schedule-section-what-to-run',
      content: (
        <Box sx={styles.section}>
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
          <VersionSelect
            entityId={values.application_id}
            versions={details?.versions}
            defaultVersionID={getDefaultVersionId(details)}
            value={values.version_id}
            onChange={versionId => setFieldValue('version_id', versionId)}
            disabled={!values.application_id}
          />
          <FieldError message={fieldError('version_id')} />
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
        </Box>
      ),
    },
    {
      title: 'SCHEDULE SETTINGS',
      testId: 'schedule-section-settings',
      content: (
        <Box sx={styles.section}>
          {children?.({ values, setFieldValue, dirty: formik.dirty, setValues })}
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
            </Typography>
          )}
          <FieldError message={fieldError('approval_rule')} />
        </Box>
      ),
    },
  ];

  // The same header bar, column and collapsible sections as New Agent (CreateApplication)
  return (
    <>
      <StyledTabs
        leftPart={<Breadcrumbs entityName={entityName} />}
        tabs={[
          {
            tabBarItems: (
              <TabBarItems>
                <BaseBtn
                  data-testid="schedule-save-button"
                  variant="elitea"
                  color="primary"
                  disabled={formik.isSubmitting}
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
              </TabBarItems>
            ),
            content: (
              // With a side panel: the Agents editor split (ConfigurationTab), stacked below the lg breakpoint
              <StyledGridContainer
                container
                columnSpacing="2rem"
                rowSpacing="1.5rem"
                sx={sidePanel && styles.split}
              >
                <Grid
                  size={{ xs: 12, lg: sidePanel ? 6 : 12 }}
                  component="form"
                  noValidate
                  onSubmit={formik.handleSubmit}
                >
                  <Box sx={styles.root}>
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
                    size={{ xs: 12, lg: 6 }}
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
  root: { margin: '0.75rem auto 0', maxWidth: '40.1875rem' },
  // the ConfigurationTab grid padding
  split: { padding: '0 1.5rem 1.5rem' },
  sidePanel: { paddingTop: '0.75rem' },
  accordion: ({ palette }) => ({ background: `${palette.background.default.tertiary} !important` }),
  section: { display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1.5rem' },
};
