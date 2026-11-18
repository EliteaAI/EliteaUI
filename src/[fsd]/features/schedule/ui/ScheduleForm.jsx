import { memo, useCallback, useMemo, useState } from 'react';

import { useFormik } from 'formik';

import { Box, Grid } from '@mui/material';

import { GenerateEntityButton } from '@/[fsd]/entities/generate-entity-with-ai';
import { isWebhookRow, toKindNoun } from '@/[fsd]/entities/schedule';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { WebhookHelpers } from '@/[fsd]/shared/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import BannerMessage from '@/[fsd]/shared/ui/banner-message/BannerMessage';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { useToolkitsDetailsQuery } from '@/api/toolkits';
import { PERMISSIONS } from '@/common/constants';
import StyledTabs from '@/components/StyledTabs';
import useCheckPermission from '@/hooks/useCheckPermission';
import useNavBlocker from '@/hooks/useNavBlocker';
import { StyledGridContainer } from '@/pages/Common/Components/StyledComponents';

import { RISK_CHECK_STATUS } from '../lib/constants';
import {
  connectionsBlockSave,
  connectionsHint,
  isIndexType,
  resetWhatToRun,
  scheduleFormSchema,
} from '../lib/helpers';
import {
  useScheduleConnections,
  useScheduleEntityDetails,
  useScheduleRiskCheck,
  useScheduleSave,
} from '../lib/hooks';
import BuildScheduleWithAiModal from './BuildScheduleWithAiModal';
import ReconfirmBadge from './ReconfirmBadge';
import RiskReviewDialog from './RiskReviewDialog';
import SaveWarningsDialog from './SaveWarningsDialog';
import ScheduleApprovalSection, { APPROVAL_RULE_ITEMS } from './ScheduleApprovalSection';
import ScheduleConnectionsPanel from './ScheduleConnectionsPanel';
import ScheduleEntitySection from './ScheduleEntitySection';
import ScheduleFormActions from './ScheduleFormActions';
import ScheduleGeneralSection from './ScheduleGeneralSection';
import ScheduleLockedEntity from './ScheduleLockedEntity';
import SchedulePromptSection from './SchedulePromptSection';
import ScheduleReenableBanner from './ScheduleReenableBanner';
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
    settingsTitle = 'SCHEDULE SETTINGS',
    children,
  } = props;

  const styles = scheduleFormStyles();
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
    toolkitId: values.toolkit_id,
    indexName: values.index_name,
    scheduleId: schedule?.id,
    approvalRule: values.approval_rule,
    isWebhook: isWebhookRow(values),
  });
  const connections = useScheduleConnections({
    projectId,
    entityType: values.type,
    applicationId: values.application_id,
    versionId: values.version_id,
    scheduleId: schedule?.id,
    isWebhook: isWebhookRow(values),
  });
  const save = useScheduleSave({
    formik,
    riskCheck,
    connections,
    schedule,
    onSubmit,
    onSaved,
    onRunNow,
    onDraftTestRun,
  });
  // Without edit in allowed_actions the server refuses a save, so the form only shows the values
  const readOnly = Array.isArray(schedule?.allowed_actions) && !schedule.allowed_actions.includes('edit');
  const riskBlocksSave = RISK_STATES_WITHOUT_SAVE.includes(riskCheck.status);
  // A webhook runs with no one signed in, so it saves only when every connection is OK (#7401)
  const connectionsHoldSave = connectionsBlockSave(isWebhookRow(values), connections);

  // Unsaved changes open the leave dialog; a save in progress never does
  const blockOptions = useMemo(
    () => ({ blockCondition: formik.dirty && !formik.isSubmitting }),
    [formik.dirty, formik.isSubmitting],
  );
  useNavBlocker(blockOptions);
  const fieldError = name => (submitCount ? errors[name] : '');

  // An editor route or a saved schedule fixes the entity: it is shown, not changeable
  // A toolkit index has no application to load: the entity-details lock check would reject it
  const isIndex = isIndexType(values.type);
  const { details, lockActive: applicationLocked } = useScheduleEntityDetails({
    projectId,
    formik,
    initialValues,
    lockedEntity: isIndex ? undefined : lockedEntity,
    lockFailed,
    setLockFailed,
  });
  const { currentData: toolkitDetails } = useToolkitsDetailsQuery(
    { projectId, toolkitId: values.toolkit_id },
    { skip: !isIndex || !values.toolkit_id },
  );
  const lockActive = applicationLocked || (isIndex && (!!lockedEntity || !!schedule?.id));

  // setFieldValue changes one field only, so a fast second change keeps the first; radio clicks reset many fields
  const handleTypeChange = useCallback(type => setValues(prev => resetWhatToRun(prev, type)), [setValues]);

  const handleEntityChange = useCallback(
    id => {
      setFieldValue('application_id', id);
      setFieldValue('version_id', '');
    },
    [setFieldValue],
  );

  // The index belongs to one toolkit, so a new toolkit clears it
  const handleToolkitChange = useCallback(
    id => setValues(prev => ({ ...prev, toolkit_id: id, index_name: '' })),
    [setValues],
  );
  const handleIndexChange = useCallback(name => setFieldValue('index_name', name), [setFieldValue]);

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
      entityId={isIndex ? values.toolkit_id : values.application_id}
      indexName={isIndex ? values.index_name : undefined}
      versionId={values.version_id}
      projectId={projectId}
      kind={toKindNoun(values.trigger_kind)}
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
      // Build with AI writes a cron; a webhook has none
      summaryAction: !schedule?.id && !isWebhookRow(values) && (
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
              name={isIndex ? (toolkitDetails?.toolkit_name ?? toolkitDetails?.name) : details?.name}
              indexName={values.index_name}
              editing={!!schedule}
              isWebhook={isWebhookRow(values)}
            />
          ) : (
            <ScheduleEntitySection
              type={values.type}
              applicationId={values.application_id}
              toolkitId={values.toolkit_id}
              indexName={values.index_name}
              details={isIndex ? toolkitDetails : details}
              lockFailed={lockFailed}
              readOnly={readOnly}
              isWebhook={isWebhookRow(values)}
              error={fieldError(isIndex ? 'toolkit_id' : 'application_id')}
              indexError={fieldError('index_name')}
              onTypeChange={handleTypeChange}
              onEntityChange={handleEntityChange}
              onToolkitChange={handleToolkitChange}
              onIndexChange={handleIndexChange}
            />
          )}
          {riskNotices}
          {/* an index runs with its saved settings: no version, no connections, no prompt */}
          {!isIndex && (
            <>
              <ScheduleVersionField
                versions={details?.versions}
                value={values.version_id}
                onChange={handleVersionChange}
                disabled={!values.application_id || readOnly}
                error={fieldError('version_id')}
              />
              <ScheduleConnectionsPanel
                connections={connections}
                isWebhook={isWebhookRow(values)}
              />
              {promptFields}
            </>
          )}
        </Box>
      ),
    },
    {
      title: settingsTitle,
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
        </Box>
      ),
    },
    {
      title: 'APPROVAL RULE',
      testId: 'schedule-section-approval',
      content: (
        <Box
          component="fieldset"
          disabled={readOnly}
          sx={styles.section}
        >
          <ScheduleApprovalSection
            rule={values.approval_rule}
            ruleChanged={save.ruleChanged}
            confirmedBy={schedule?.approval_confirmed_by}
            confirmedAt={schedule?.approval_confirmed_at}
            canChangeProjectSettings={canChangeProjectSettings}
            webhookSigned={
              isWebhookRow(values)
                ? WebhookHelpers.isSignedWebhook(values.webhook_type, values.gitlab_auth_method)
                : undefined
            }
            error={fieldError('approval_rule')}
            onChange={handleRuleChange}
          />
        </Box>
      ),
    },
    // An index schedule keeps the default rule: the server refuses another one, so the section is hidden
  ].filter(section => !(isIndex && section.testId === 'schedule-section-approval'));

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
                connectionsHint={connectionsHint(isWebhookRow(values), connections)}
                saveDisabled={
                  formik.isSubmitting ||
                  riskBlocksSave ||
                  connectionsHoldSave ||
                  readOnly ||
                  (!!schedule && !formik.dirty)
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
                columnSpacing={0}
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
                  {isWebhookRow(schedule) && schedule.needs_reconfirm === true && !readOnly && (
                    <ReconfirmBadge onReview={save.reconfirm} />
                  )}
                  <Box
                    component="form"
                    noValidate
                    onSubmit={formik.handleSubmit}
                    sx={styles.root}
                  >
                    <ScheduleReenableBanner
                      schedule={schedule}
                      onRefused={connections.recheck}
                    />
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

/** @type {MuiSx} */
const scheduleFormStyles = () => ({
  root: { order: 1, width: '100%', margin: '1rem auto 0', padding: '0 1.5rem', maxWidth: '40.1875rem' },
  // StyledTabs pads its content by 1.5rem; the header bars of both columns run to the edges, so the grid cancels it
  split: { margin: '0 -1.5rem', width: 'calc(100% + 3rem)', padding: 0 },
  sidePanel: ({ palette }) => ({
    order: 2,
    minHeight: '100%',
    borderLeft: `0.0625rem solid ${palette.border.lines}`,
  }),
  // Below lg the panel is stacked under the form; an urgent card goes above it, so it is seen first
  sidePanelFirst: ({ breakpoints }) => ({ order: -1, [breakpoints.up('lg')]: { order: 2 } }),
  noTabIndicator: { '& .MuiTabs-indicator': { display: 'none' } },
  accordion: ({ palette }) => ({ background: `${palette.background.default.tertiary} !important` }),
  panel: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
  }),
  // A fieldset, so `disabled` reaches every input inside; its default border, margin and min width are reset
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    border: 0,
    margin: 0,
    padding: '0.5625rem 0 1.5rem',
    minWidth: 0,
  },
});

export default ScheduleForm;
