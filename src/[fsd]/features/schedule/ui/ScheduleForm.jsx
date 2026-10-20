import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useFormik } from 'formik';

import { Box, Typography } from '@mui/material';

import { VersionSelect, getDefaultVersionId } from '@/[fsd]/entities/version';
import {
  getEntityLock,
  isPromptShown,
  resetWhatToRun,
  scheduleFormSchema,
  syncPromptVariables,
  toCreateBody,
  toFieldErrors,
} from '@/[fsd]/features/schedule/lib/helpers';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import BannerMessage from '@/[fsd]/shared/ui/banner-message/BannerMessage';
import BaseBtn from '@/[fsd]/shared/ui/button/BaseBtn';
import RadioButtonGroup from '@/[fsd]/shared/ui/checkbox/RadioButtonGroup';
import EntityTypeIcon from '@/[fsd]/shared/ui/icon/EntityTypeIcon';
import StyledInputEnhancer from '@/[fsd]/shared/ui/input/StyledInputEnhancer';
import LazySelect from '@/[fsd]/shared/ui/select/LazySelect';
import { useApplicationDetailsQuery, useApplicationListQuery } from '@/api/applications';
import { MAX_DESCRIPTION_LENGTH } from '@/common/constants';
import VariableList from '@/components/VariableList';
import useNavBlocker from '@/hooks/useNavBlocker';

const TYPE_ITEMS = [
  { value: 'agent', label: 'Agent' },
  { value: 'pipeline', label: 'Pipeline' },
];
const RUN_MODE_ITEMS = [
  { value: 'entry_point', label: 'Entry point' },
  { value: 'prompt', label: 'Prompt' },
];
const TYPE_LABEL = Object.fromEntries(TYPE_ITEMS.map(({ value, label }) => [value, label]));
// Fields with their own message in the form; a 400 for any other field goes to the banner (R6.3)
const FIELDS_WITH_INPUT = ['name', 'description', 'application_id', 'version_id'];
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

const Section = ({ title, children }) => (
  <Box
    component="section"
    sx={styles.section}
  >
    <Typography
      component="h2"
      variant="labelSmall"
    >
      {title}
    </Typography>
    {children}
  </Box>
);

/**
 * `children({ values, setFieldValue })` fills SCHEDULE SETTINGS from the form values (cron, expires_at);
 * `onSubmit(body)` returns a promise that rejects with the API error.
 */
const ScheduleForm = memo(props => {
  const { initialValues, lockedEntity, onSubmit, onCancel, children } = props;

  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const [list, setList] = useState({ page: 0, query: '' });
  const [lockFailed, setLockFailed] = useState(false);
  const [banner, setBanner] = useState('');

  const formik = useFormik({
    initialValues,
    validationSchema: scheduleFormSchema,
    onSubmit: async (values, { setErrors }) => {
      setBanner('');
      try {
        await onSubmit(toCreateBody(values));
      } catch (error) {
        const fieldErrors = error?.status === 400 ? toFieldErrors(error) : {};
        const shownFields = isPromptShown(values)
          ? [...FIELDS_WITH_INPUT, ...PROMPT_FIELDS]
          : FIELDS_WITH_INPUT;
        if (Object.keys(fieldErrors).some(field => shownFields.includes(field))) setErrors(fieldErrors);
        else if (error?.status === 400 || error?.status === 409) setBanner(error.data?.error ?? '');
        else toastError('Failed to save the schedule');
      }
    },
  });
  const { values, errors, submitCount, setFieldValue, setValues, resetForm } = formik;
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

  const showPrompt = isPromptShown(values);

  return (
    <Box
      component="form"
      noValidate
      onSubmit={formik.handleSubmit}
      sx={styles.form}
    >
      {banner && (
        <BannerMessage
          message={banner}
          variant="error"
        />
      )}

      <Section title="GENERAL">
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
      </Section>

      <Section title="WHAT TO RUN">
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
      </Section>

      <Section title="SCHEDULE SETTINGS">{children?.({ values, setFieldValue })}</Section>

      <Box sx={styles.actions}>
        <BaseBtn
          variant="secondary"
          color="secondary"
          onClick={onCancel}
        >
          Cancel
        </BaseBtn>
        <BaseBtn
          type="submit"
          variant="contained"
          color="primary"
          disabled={formik.isSubmitting}
        >
          Save
        </BaseBtn>
      </Box>
    </Box>
  );
});

ScheduleForm.displayName = 'ScheduleForm';

export default ScheduleForm;

/** @type {MuiSx} */
const styles = {
  form: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  section: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' },
};
