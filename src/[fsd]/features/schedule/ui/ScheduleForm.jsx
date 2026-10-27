import { memo, useCallback, useMemo, useState } from 'react';

import { useFormik } from 'formik';

import { Box, Grid } from '@mui/material';

import { GenerateEntityButton } from '@/[fsd]/entities/generate-entity-with-ai';
import { VersionSelect, getDefaultVersionId } from '@/[fsd]/entities/version';
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
import FieldError from './FieldError';
import RiskReviewDialog from './RiskReviewDialog';
import SaveWarningsDialog from './SaveWarningsDialog';
import ScheduleApprovalSection, { APPROVAL_RULE_ITEMS } from './ScheduleApprovalSection';
import ScheduleEntitySection from './ScheduleEntitySection';
import ScheduleFormActions from './ScheduleFormActions';
import ScheduleGeneralSection from './ScheduleGeneralSection';
import SchedulePromptSection from './SchedulePromptSection';
import ScheduleRiskNotices from './ScheduleRiskNotices';

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
  });
  const save = useScheduleSave({ formik, riskCheck, schedule, onSubmit, onSaved, onTestRun });
  // Without edit in allowed_actions the server refuses a save, so the form only shows the values
  const readOnly = Array.isArray(schedule?.allowed_actions) && !schedule.allowed_actions.includes('edit');
  const riskBlocksSave = RISK_STATES_WITHOUT_SAVE.includes(riskCheck.status);

  // Unsaved changes open the leave dialog; a save in progress never does
  const blockOptions = useMemo(
    () => ({ blockCondition: formik.dirty && !formik.isSubmitting }),
    [formik.dirty, formik.isSubmitting],
  );
  useNavBlocker(blockOptions);
  // Messages show after the first Save, so a half-filled form shows no required errors
  const fieldError = name => (submitCount ? errors[name] : '');

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
      blocking={riskCheck.result?.blocking}
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
  // A form nested in an editor takes the entity and version from the route: its selectors and WHAT TO RUN
  // are hidden and the prompt fields move under GENERAL
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
        <Box
          component="fieldset"
          disabled={readOnly}
          sx={styles.section}
        >
          <ScheduleEntitySection
            type={values.type}
            applicationId={values.application_id}
            details={details}
            lockActive={lockActive}
            lockFailed={lockFailed}
            readOnly={readOnly}
            error={fieldError('application_id')}
            onTypeChange={handleTypeChange}
            onEntityChange={handleEntityChange}
          />
          {riskNotices}
          <VersionSelect
            entityId={values.application_id}
            versions={details?.versions}
            defaultVersionID={getDefaultVersionId(details)}
            value={values.version_id}
            onChange={handleVersionChange}
            disabled={!values.application_id || readOnly}
          />
          <FieldError message={fieldError('version_id')} />
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
          {children?.({ values, setFieldValue, dirty: formik.dirty, setValues, fieldError })}
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
  ].filter(Boolean);

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
                onCancel={onCancel}
                headerActions={headerActions}
              />
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
                    size={{ xs: 12, xl: 6 }}
                    sx={styles.sidePanel}
                  >
                    {sidePanel({
                      onTestRun: save.handleTestRun,
                      testRunPending: formik.isSubmitting || save.testRunPending,
                      testRunError: save.testRunError,
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
  // A fieldset, so `disabled` reaches every input inside; its default border, margin and min width are reset
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    border: 0,
    margin: 0,
    padding: '0 0 1.5rem',
    minWidth: 0,
  },
};
