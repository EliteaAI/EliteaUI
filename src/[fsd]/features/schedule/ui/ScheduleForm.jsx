import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useFormik } from 'formik';

import { Box, Typography } from '@mui/material';

import { getDefaultVersionId } from '@/[fsd]/entities/version/lib/helpers';
import VersionSelect from '@/[fsd]/entities/version/ui/VersionSelect';
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

const TYPE_ITEMS = [
  { value: 'agent', label: 'Agent' },
  { value: 'pipeline', label: 'Pipeline' },
];
const RUN_MODE_ITEMS = [
  { value: 'entry_point', label: 'Entry point' },
  { value: 'prompt', label: 'Prompt' },
];
const TYPE_LABEL = { agent: 'Agent', pipeline: 'Pipeline' };
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

/** `children` fill SCHEDULE SETTINGS; `onSubmit(body)` returns a promise that rejects with the API error. */
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
        if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
        else if (error?.status === 400 || error?.status === 409) setBanner(error.data?.error ?? '');
        else toastError('Failed to save the schedule');
      }
    },
  });
  const { values, errors, touched, setFieldValue, setValues } = formik;
  const fieldError = name => (touched[name] || errors[name] ? errors[name] : '');

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
      setFieldValue('application_id', '');
    }
  }, [lockActive, isDetailsFetching, lock.unavailable, setFieldValue]);

  useEffect(() => {
    if (details && String(details.id) === String(values.application_id) && !values.version_id) {
      setFieldValue('version_id', getDefaultVersionId(details));
    }
  }, [details, values.application_id, values.version_id, setFieldValue]);

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

  const handleTypeChange = useCallback(
    type => {
      setValues(resetWhatToRun(values, type));
      setList({ page: 0, query: '' });
    },
    [setValues, values],
  );

  const handleEntityChange = useCallback(
    id => {
      setValues({ ...values, application_id: id, version_id: '' });
    },
    [setValues, values],
  );

  const handlePromptChange = useCallback(
    event => {
      const prompt = event.target.value;
      setValues({ ...values, prompt, variables: syncPromptVariables(prompt, values.variables) });
    },
    [setValues, values],
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
          displayEmpty
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
            onChange={runMode => setValues({ ...values, run_mode: runMode, prompt: '', variables: [] })}
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

      <Section title="SCHEDULE SETTINGS">{children}</Section>

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
