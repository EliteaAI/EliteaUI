import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, CircularProgress, Typography } from '@mui/material';

import {
  ProjectGovernanceConstants,
  ProjectGovernanceHelpers,
  useCreateCredentialFromChatMutation,
} from '@/[fsd]/features/project-governance';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { Button, Input, Select } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import TabGroupButton from '@/[fsd]/shared/ui/tab-group-button/TabGroupButton';
import { useGetAvailableConfigurationsTypeQuery } from '@/api/configurations';

const PRIVATE = 'personal';
const SHARED = 'project_shared';
const OWNERSHIP_TABS = [
  { value: PRIVATE, label: 'Private', buttonProps: { 'data-testid': 'credential-form-ownership-private' } },
  {
    value: SHARED,
    label: 'Shared with the team',
    buttonProps: { 'data-testid': 'credential-form-ownership-shared' },
  },
];

// (#7228) The chat's credential form: what a governed agent asked for (a type and a title) as one inline card. The
// person types the values here, never into the chat; Create stores them as a governed credential (the server also
// files what the agent needs for approval) and resumes the run with the new reference id only. The typed values live
// in this card's state until the request settles, then are gone (nothing of them reaches Redux, the message or the
// socket). What the agent chose (title, type, purpose) is shown as plain text, never rendered. A sign-in type shows its
// required non-secret fields only and uses the person's own Microsoft sign-in.
const CredentialFormControl = memo(props => {
  const { hitlInterrupt, interruptId, messageId, conversationUuid, onHitlResume, disabled, testId } = props;
  const { credential_type: credentialType, title, purpose } = hitlInterrupt || {};
  const { SIGN_IN_CREDENTIAL_TYPES, SIGN_IN_NOT_MICROSOFT, SIGN_IN_NOT_MICROSOFT_TEXT } =
    ProjectGovernanceConstants;
  const styles = credentialFormControlStyles();
  const projectId = useSelectedProjectId();
  const personalProjectId = useSelector(state => state.user?.personal_project_id);
  const [values, setValues] = useState({});
  const [ownership, setOwnership] = useState(PRIVATE);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(hitlInterrupt?.credential_form_result ?? null);

  const {
    data: types,
    isFetching: typesLoading,
    isError: typesFailed,
    refetch: retryTypes,
  } = useGetAvailableConfigurationsTypeQuery({ section: 'credentials' });
  const [createCredential, { isLoading: isCreating, reset }] = useCreateCredentialFromChatMutation();

  const fields = useMemo(
    () => ProjectGovernanceHelpers.credentialFormFieldsOf(types, credentialType),
    [types, credentialType],
  );
  const isSignIn = SIGN_IN_CREDENTIAL_TYPES.includes(credentialType);
  // a sign-in type asks for what it requires only (its site, say): the app and the sign-in are the platform's
  const shownFields = useMemo(
    () => (fields ?? []).filter(field => !isSignIn || (field.required && !field.secret)),
    [fields, isSignIn],
  );

  // the schema's defaults prefill the form (nothing secret has one)
  useEffect(() => {
    if (!shownFields.length) return;
    setValues(prev => ({
      ...Object.fromEntries(
        shownFields.filter(field => field.defaultValue).map(f => [f.name, f.defaultValue]),
      ),
      ...prev,
    }));
  }, [shownFields]);
  useEffect(() => () => setValues({}), []);

  const offersOwnership = !isSignIn && projectId !== personalProjectId;
  const missingRequired = shownFields.some(field => field.required && !(values[field.name] ?? '').trim());
  const hasSecret = isSignIn || shownFields.some(field => field.secret && (values[field.name] ?? '') !== '');
  const canCreate = !disabled && !isCreating && !missingRequired && hasSecret && Boolean(conversationUuid);

  const handleChange = useCallback(
    name => event => setValues(prev => ({ ...prev, [name]: event.target.value })),
    [],
  );
  const handleSelect = useCallback(name => value => setValues(prev => ({ ...prev, [name]: value })), []);
  const handleOwnership = useCallback((_, value) => value && setOwnership(value), []);

  const handleCancel = useCallback(() => {
    setValues({});
    onHitlResume?.({ action: 'cancel', interruptId });
  }, [interruptId, onHitlResume]);

  const handleCreate = useCallback(async () => {
    setError(null);
    const typed = Object.fromEntries(
      shownFields
        .filter(field => (values[field.name] ?? '') !== '')
        .map(field => [field.name, values[field.name]]),
    );
    try {
      const reply = await createCredential({
        projectId,
        conversationUuid,
        interrupt_id: interruptId,
        message_id: messageId,
        credential_type: credentialType,
        title,
        fields: typed,
        ownership: offersOwnership ? ownership : PRIVATE,
        ...(isSignIn && { auth_mode: 'entra_delegated' }),
      }).unwrap();
      setValues({});
      setResult(reply);
      onHitlResume?.({ action: 'created', value: { reference_id: reply.reference_id }, interruptId });
    } catch (err) {
      setError(ProjectGovernanceHelpers.toGovernanceError(err, 'The credential was not created.'));
    } finally {
      reset(); // the request record held the typed values as its argument: dropped once it settles
    }
  }, [
    conversationUuid,
    createCredential,
    credentialType,
    interruptId,
    isSignIn,
    messageId,
    offersOwnership,
    onHitlResume,
    ownership,
    projectId,
    reset,
    shownFields,
    title,
    values,
  ]);

  const handleContinue = useCallback(() => {
    onHitlResume?.({ action: 'created', value: { reference_id: result?.reference_id }, interruptId });
  }, [interruptId, onHitlResume, result?.reference_id]);

  if (result) {
    return (
      <Box
        sx={styles.root}
        data-testid={`${testId}-result`}
      >
        <Typography
          variant="bodyMedium"
          color="text.secondary"
        >
          {ProjectGovernanceHelpers.credentialFormResultText(result)}
        </Typography>
        {result.check === SIGN_IN_NOT_MICROSOFT && (
          <Typography
            variant="bodySmall"
            color="text.secondary"
            data-testid={`${testId}-not-microsoft`}
          >
            {SIGN_IN_NOT_MICROSOFT_TEXT}
          </Typography>
        )}
        {!disabled && (
          // the run did not take the answer yet (a reload, a resume that did not go through): one click resumes it
          <Box sx={styles.actions}>
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.elitea}
              size="small"
              onClick={handleContinue}
              data-testid={`${testId}-continue`}
            >
              Continue
            </Button.BaseBtn>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={styles.root}
      data-testid={testId}
    >
      <Box sx={styles.message}>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          data-testid={`${testId}-asked`}
        >
          {`The agent asks you to create the credential "${title || credentialType}" (${credentialType}).`}
        </Typography>
        {purpose && (
          <Typography
            variant="bodySmall"
            color="text.secondary"
          >
            {purpose}
          </Typography>
        )}
      </Box>
      {typesLoading ? (
        <CircularProgress
          size={14}
          data-testid={`${testId}-loading`}
        />
      ) : typesFailed ? (
        <Box sx={styles.actions}>
          <Typography
            variant="bodySmall"
            color="error"
            data-testid={`${testId}-types-failed`}
          >
            The credential types could not be read.
          </Typography>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            size="small"
            onClick={retryTypes}
            data-testid={`${testId}-retry`}
          >
            Retry
          </Button.BaseBtn>
        </Box>
      ) : fields === null ? (
        <Typography
          variant="bodySmall"
          color="text.secondary"
          data-testid={`${testId}-unknown-type`}
        >
          Unknown credential type: it cannot be created here.
        </Typography>
      ) : (
        <Box sx={styles.fields}>
          {isSignIn && (
            <Typography
              variant="bodySmall"
              color="text.secondary"
              data-testid={`${testId}-sign-in`}
            >
              It uses your own Microsoft sign-in: nothing secret is typed here, and it stays private to you.
            </Typography>
          )}
          {shownFields.map(field =>
            field.options ? (
              <Box
                key={field.name}
                data-testid={`${testId}-field-${field.name}`}
              >
                <Select.SingleSelect
                  label={field.label}
                  value={values[field.name] ?? ''}
                  options={field.options.map(option => ({ label: option, value: option }))}
                  onValueChange={handleSelect(field.name)}
                  disabled={disabled || isCreating}
                />
              </Box>
            ) : (
              <Input.InputBase
                key={field.name}
                label={field.label}
                required={field.required}
                type={field.secret ? 'password' : 'text'}
                autoComplete={field.secret ? 'new-password' : 'off'}
                value={values[field.name] ?? ''}
                onChange={handleChange(field.name)}
                helperText={field.description || undefined}
                enableAutoBlur={false}
                disabled={disabled || isCreating}
                inputProps={{ 'data-testid': `${testId}-field-${field.name}` }}
              />
            ),
          )}
          {offersOwnership && (
            <TabGroupButton
              arrayBtn={OWNERSHIP_TABS}
              value={ownership}
              onChange={handleOwnership}
              disabled={disabled || isCreating}
              disableTooltip
            />
          )}
        </Box>
      )}
      {error && (
        <Typography
          variant="bodySmall"
          color="error"
          data-testid={`${testId}-error`}
        >
          {error.message}
          {error.code ? ` (${error.code})` : ''}
        </Typography>
      )}
      <Box sx={styles.actions}>
        {fields !== null && !typesLoading && !typesFailed && (
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            size="small"
            onClick={handleCreate}
            disabled={!canCreate}
            data-testid={`${testId}-create`}
          >
            Create
          </Button.BaseBtn>
        )}
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.tertiary}
          size="small"
          onClick={handleCancel}
          disabled={disabled || isCreating}
          data-testid={`${testId}-cancel`}
        >
          Cancel
        </Button.BaseBtn>
      </Box>
    </Box>
  );
});

CredentialFormControl.displayName = 'CredentialFormControl';

/** @type {MuiSx} */
const credentialFormControlStyles = () => ({
  root: ({ palette }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '0.875rem 1rem 0.9375rem',
    gap: '0.75rem',
    borderRadius: '0.625rem',
    background: palette.background.surface.interactive.active,
    alignItems: 'flex-start',
  }),
  message: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  fields: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  actions: {
    display: 'flex',
    gap: '0.625rem',
    alignItems: 'center',
  },
});

export default CredentialFormControl;
