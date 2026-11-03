import { memo, useCallback, useMemo, useState } from 'react';

import { useFormik } from 'formik';

import { Box, Grid } from '@mui/material';

import { GenerateEntityButton } from '@/[fsd]/entities/generate-entity-with-ai';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import BannerMessage from '@/[fsd]/shared/ui/banner-message/BannerMessage';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { PERMISSIONS } from '@/common/constants';
import StyledTabs from '@/components/StyledTabs';
import useCheckPermission from '@/hooks/useCheckPermission';
import useNavBlocker from '@/hooks/useNavBlocker';
import { StyledGridContainer } from '@/pages/Common/Components/StyledComponents';

import { RISK_CHECK_STATUS } from '../lib/constants';
import { resetWhatToRun, scheduleFormSchema } from '../lib/helpers';
import { useScheduleEntityDetails, useScheduleRiskCheck, useScheduleSave } from '../lib/hooks';
import BuildScheduleWithAiModal from './BuildScheduleWithAiModal';
import RiskReviewDialog from './RiskReviewDialog';
import SaveWarningsDialog from './SaveWarningsDialog';
import ScheduleApprovalSection, { APPROVAL_RULE_ITEMS } from './ScheduleApprovalSection';
import ScheduleEntitySection from './ScheduleEntitySection';
import styles from './ScheduleForm.styles';
import ScheduleFormActions from './ScheduleFormActions';
import ScheduleGeneralSection from './ScheduleGeneralSection';
import ScheduleLockedEntity from './ScheduleLockedEntity';
import SchedulePromptSection from './SchedulePromptSection';
import ScheduleRiskNotices from './ScheduleRiskNotices';
import ScheduleSettingsHeader from './ScheduleSettingsHeader';
import ScheduleVersionField from './ScheduleVersionField';

// The risk check states that keep Save disabled
const RISK_STATES_WITHOUT_SAVE = [
  RISK_CHECK_STATUS.CHECKING,
  RISK_CHECK_STATUS.BLOCKED,
  RISK_CHECK_STATUS.FAILED,
];

/**
 * `children({ values, setFieldValue, dirty, setValues, fieldError })` fills SCHEDULE SETTINGS from the form values (cron, expires_at);
 * `onSubmit(body)` returns a promise of the save answer and rejects with the API error;
 * `onSaved(answer)` runs at once after a save without warnings, else when the warnings dialog closes.
 * `schedule` turns on edit mode: read-only Owner and update body. `entityName` names the page.
 * `sidePanel({ values, onRunNow, runNowPending, runNowError, onTestRun, testRunPending, testRunError })`
 * renders a card right of the form, as the Agents editor puts its chat. `onRunNow` saves a changed form, then
 * calls the `onRunNow()` prop at the post-save point. `onTestRun` runs the unsaved form through the
 * `onDraftTestRun(body)` prop and saves nothing. The card fills the right column from lg, and sits under the
 * form below it.
 * `sidePanelFirst` puts the panel above the form below lg, for a card the owner must see at once.
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
    onRunNow,
    onDraftTestRun,
    onCancel,
    sidePanel,
    sidePanelFirst = false,
    headerActions,
    children,
  } = props;

  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  // Only a project admin can change the setting, so only an admin gets the link to it
  const canChangeProjectSettings = checkPermission(PERMISSIONS.schedules.admin);
  const [lockFailed, setLockFailed] = useState(false);

  const formik = useFormik({
    initialValues,
    validationSchema: scheduleFormSchema,
    // Runs after validation, so the review never opens on an invalid form
    onSubmit: (formValues, helpers) => save.submit(formValues, helpers),
  });
  const { values, errors, submitCount, setFieldValue, setValues } = formik;
  const riskCheck = useScheduleRiskCheck({
    projectId,
    entityType: values.type,
    applicationId: values.application_id,
    versionId: values.version_id,
    scheduleId: schedule?.id,
    approvalRule: values.approval_rule,
  });
  const save = useScheduleSave({ formik, riskCheck, schedule, onSubmit, onSaved, onRunNow, onDraftTestRun });
  // Without edit in allowed_actions the server refuses a save, so the form only shows the values
  const readOnly = Array.isArray(schedule?.allowed_actions) && !schedule.allowed_actions.includes('edit');
  const riskBlocksSave = RISK_STATES_WITHOUT_SAVE.includes(riskCheck.status);

  // Unsaved changes open the leave dialog; a save in progress never does
  const blockOptions = useMemo(
    () => ({ blockCondition: formik.dirty && !formik.isSubmitting }),
    [formik.dirty, formik.isSubmitting],
  );
  useNavBlocker(blockOptions);
  const fieldError = name => (submitCount ? errors[name] : '');

  // An editor route or a saved schedule fixes the entity: it is shown, not changeable
  const { details, lockActive } = useScheduleEntityDetails({
    projectId,
    formik,
    initialValues,
    lockedEntity,
    lockFailed,
    setLockFailed,
  });

  // setFieldValue changes one field only, so a fast second change keeps the first; radio clicks reset many fields
  const handleTypeChange = useCallback(type => setValues(prev => resetWhatToRun(prev, type)), [setValues]);

  const handleEntityChange = useCallback(
    id => {
      setFieldValue('application_id', id);
      setFieldValue('version_id', '');
    },
    [setFieldValue],
  );

  const handleVersionChange = useCallback(
    versionId => setFieldValue('version_id', versionId),
    [setFieldValue],
  );
  const handleRuleChange = useCallback(rule => setFieldValue('approval_rule', rule), [setFieldValue]);
  const handleEnabledChange = useCallback(enabled => setFieldValue('enabled', enabled), [setFieldValue]);

  // The page drops the hidden Test draft of this form when the user leaves without saving
  const handleCancel = useCallback(() => onCancel?.(values), [onCancel, values]);

  const ruleNote = save.ruleChanged
    ? `The schedule was saved with the rule "${APPROVAL_RULE_ITEMS.find(item => item.value === save.savedRule)?.label ?? save.savedRule}".`
    : '';

  const versionName = details?.versions?.find(
    version => String(version.id) === String(values.version_id),
  )?.name;
  const entityLabel = [details?.name, versionName].filter(Boolean).join(' ');

  const riskNotices = (
    <ScheduleRiskNotices
      status={riskCheck.status}
      blocking={riskCheck.blocking}
      waiting={riskCheck.waiting}
      entityType={values.type}
      entityId={values.application_id}
      versionId={values.version_id}
      projectId={projectId}
      onRetry={riskCheck.runCheck}
    />
  );
  const promptFields = (
    <SchedulePromptSection
      type={values.type}
      runMode={values.run_mode}
      prompt={values.prompt}
      variables={values.variables}
      promptError={fieldError('prompt')}
      variablesError={typeof errors.variables === 'string' ? errors.variables : ''}
      setFieldValue={setFieldValue}
      setValues={setValues}
    />
  );
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
        <Box
          component="fieldset"
          disabled={readOnly}
          sx={styles.section}
        >
          <ScheduleGeneralSection
            showOwner={!!schedule}
            owner={schedule?.owner}
            name={values.name}
            description={values.description}
            nameError={fieldError('name')}
            descriptionError={fieldError('description')}
            setFieldValue={setFieldValue}
          />
        </Box>
      ),
    },
    {
      title: 'WHAT TO RUN',
      testId: 'schedule-section-what-to-run',
      content: (
        <Box
          component="fieldset"
          disabled={readOnly}
          sx={styles.section}
        >
          {lockActive || (schedule?.id && values.application_id) ? (
            <ScheduleLockedEntity
              type={values.type}
              name={details?.name}
              editing={!!schedule}
            />
          ) : (
            <ScheduleEntitySection
              type={values.type}
              applicationId={values.application_id}
              details={details}
              lockFailed={lockFailed}
              readOnly={readOnly}
              error={fieldError('application_id')}
              onTypeChange={handleTypeChange}
              onEntityChange={handleEntityChange}
            />
          )}
          {riskNotices}
          <ScheduleVersionField
            versions={details?.versions}
            value={values.version_id}
            onChange={handleVersionChange}
            disabled={!values.application_id || readOnly}
            error={fieldError('version_id')}
          />
          {promptFields}
        </Box>
      ),
    },
    {
      title: 'SCHEDULE SETTINGS',
      testId: 'schedule-section-settings',
      content: (
        <Box
          component="fieldset"
          disabled={readOnly}
          sx={styles.section}
        >
          <Box sx={styles.panel}>
            {children?.({ values, setFieldValue, dirty: formik.dirty, setValues, fieldError })}
          </Box>
          <ScheduleApprovalSection
            rule={values.approval_rule}
            ruleChanged={save.ruleChanged}
            confirmedBy={schedule?.approval_confirmed_by}
            confirmedAt={schedule?.approval_confirmed_at}
            canChangeProjectSettings={canChangeProjectSettings}
            error={fieldError('approval_rule')}
            onChange={handleRuleChange}
          />
        </Box>
      ),
    },
  ];

  // The same header bar, column and collapsible sections as New Agent (CreateApplication)
  return (
    <>
      <StyledTabs
        leftPart={<Breadcrumbs entityName={entityName} />}
        isCreatePage
        tabsSX={styles.noTabIndicator}
        tabs={[
          {
            tabBarItems: (
              <ScheduleFormActions
                riskStatus={riskCheck.status}
                riskBlocksSave={riskBlocksSave}
                saveDisabled={
                  formik.isSubmitting || riskBlocksSave || readOnly || (!!schedule && !formik.dirty)
                }
                onSave={formik.handleSubmit}
                onCancel={handleCancel}
                headerActions={headerActions}
              />
            ),
            content: (
              // With a side panel: the Agents editor split (ConfigurationTab). The split starts at lg (1200 px),
              // so a 1366 px laptop shows the settings and the Runs card side by side; below it the card goes
              // under the form, where each half would be too narrow.
              <StyledGridContainer
                container
                columnSpacing="2rem"
                rowSpacing="1.5rem"
                sx={sidePanel && styles.split}
              >
                <Grid size={{ xs: 12, lg: sidePanel ? 6 : 12 }}>
                  <ScheduleSettingsHeader
                    schedule={schedule}
                    enabled={values.enabled}
                    readOnly={readOnly}
                    onEnabledChange={handleEnabledChange}
                  />
                  <Box
                    component="form"
                    noValidate
                    onSubmit={formik.handleSubmit}
                    sx={styles.root}
                  >
                    {save.banner && (
                      <BannerMessage
                        message={save.banner}
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
                    sx={[styles.sidePanel, sidePanelFirst && styles.sidePanelFirst]}
                  >
                    {sidePanel({
                      values,
                      onRunNow: save.handleRunNow,
                      runNowPending: formik.isSubmitting || save.runNowPending,
                      runNowError: save.runNowError,
                      onTestRun: save.handleDraftTestRun,
                      testRunPending: save.draftTestPending,
                      testRunError: save.draftTestError,
                    })}
                  </Grid>
                )}
              </StyledGridContainer>
            ),
          },
        ]}
      />
      <RiskReviewDialog
        open={!!save.review}
        entityLabel={entityLabel}
        scheduleName={save.review?.values.name}
        tools={riskCheck.result?.sensitive}
        waiting={riskCheck.waiting}
        runWithoutAskingAllowed={riskCheck.result?.run_without_asking_allowed === true}
        scanIncomplete={riskCheck.result?.notices?.some(notice => notice.code === 'scan_incomplete')}
        showSettingsLink={canChangeProjectSettings}
        changed={save.review?.changed}
        nameError={save.review?.nameError}
        saving={save.reviewSaving}
        onCancel={save.handleReviewCancel}
        onConfirm={save.handleReviewConfirm}
      />
      <SaveWarningsDialog
        open={!!save.saved}
        warnings={save.saved?.warnings}
        note={ruleNote}
        onClose={save.handleWarningsClose}
      />
    </>
  );
});

ScheduleForm.displayName = 'ScheduleForm';

export default ScheduleForm;
