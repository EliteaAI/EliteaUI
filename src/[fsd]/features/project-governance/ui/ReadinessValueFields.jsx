import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import {
  useLazyGetMyCredentialReferencesQuery,
  usePutMyCredentialValueMutation,
} from '@/[fsd]/features/project-governance/api/projectGovernanceApi';
import * as GovernanceHelpers from '@/[fsd]/features/project-governance/lib/helpers/projectGovernance.helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { Button, Input } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { useGetAvailableConfigurationsTypeQuery } from '@/api/configurations';

// (#7269) Write the value of your own personal credential where the Save card asks for it: the secret fields of its
// type, masked, sent once with the generation you last saw (write-only: never shown, kept or logged). The reference then
// waits for a check and an approval; the card reads again. A refusal reads inline.
const ReadinessValueFields = memo(props => {
  const { item, testId, onDone } = props;
  const styles = readinessValueFieldsStyles();
  const projectId = useSelectedProjectId();
  const [values, setValues] = useState({});
  const [error, setError] = useState(null);

  const [readOwn, { data: own, isFetching: ownLoading, isError: ownFailed }] =
    useLazyGetMyCredentialReferencesQuery();
  const { data: types, isFetching: typesLoading } = useGetAvailableConfigurationsTypeQuery({
    section: 'credentials',
  });
  const [putValue, { isLoading: isStoring }] = usePutMyCredentialValueMutation();

  useEffect(() => {
    readOwn({ projectId });
    return () => setValues({});
  }, [projectId, readOwn]);

  const reference = useMemo(() => (own?.rows ?? []).find(row => row.id === item.ref), [own?.rows, item.ref]);
  const fields = useMemo(
    () => (reference ? GovernanceHelpers.secretFieldsOf(types, reference.provider) : []),
    [reference, types],
  );
  const filled = fields.filter(field => (values[field.path] ?? '') !== '');

  const handleChange = useCallback(
    path => event => setValues(prev => ({ ...prev, [path]: event.target.value })),
    [],
  );
  const handleStore = useCallback(async () => {
    setError(null);
    const body = Object.fromEntries(filled.map(field => [field.path, values[field.path]]));
    try {
      await putValue({
        projectId,
        referenceId: item.ref,
        fields: body,
        expectedGeneration: reference.generation,
      }).unwrap();
      setValues({});
      onDone?.();
    } catch (err) {
      setError(GovernanceHelpers.toGovernanceError(err, 'The value was not stored.'));
    }
  }, [filled, item.ref, onDone, projectId, putValue, reference, values]);

  if (ownLoading || typesLoading) {
    return (
      <CircularProgress
        size={14}
        data-testid={`${testId}-loading`}
      />
    );
  }
  if (ownFailed || !reference || !fields.length) {
    return (
      <Typography
        variant="bodySmall"
        color="text.secondary"
        data-testid={`${testId}-unavailable`}
      >
        The fields of this credential could not be read; write its value on the Credentials page.
      </Typography>
    );
  }

  return (
    <Box
      sx={styles.root}
      data-testid={testId}
    >
      {fields.map(field => (
        <Input.InputBase
          key={field.path}
          label={field.label}
          type="password"
          autoComplete="new-password"
          value={values[field.path] ?? ''}
          onChange={handleChange(field.path)}
          enableAutoBlur={false}
          inputProps={{ 'data-testid': `${testId}-field-${field.path}` }}
        />
      ))}
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
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.tertiary}
          size="small"
          onClick={handleStore}
          disabled={!filled.length || isStoring}
          data-testid={`${testId}-store`}
        >
          Store
        </Button.BaseBtn>
      </Box>
    </Box>
  );
});

ReadinessValueFields.displayName = 'ReadinessValueFields';

/** @type {MuiSx} */
const readinessValueFieldsStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    paddingLeft: '1rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
});

export default ReadinessValueFields;
