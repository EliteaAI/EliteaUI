import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

import { Box, CircularProgress, FormControlLabel, Tooltip, Typography } from '@mui/material';

import {
  OwnerConsentHelpers,
  useGetOwnerConsentStatusQuery,
  useTokenConsentActionMutation,
} from '@/[fsd]/features/owner-consent';
import {
  DrawerPage,
  DrawerPageHeader,
  GeneratedTokenDialog,
  TokenScopeFields,
  TokenScopeHelpers,
} from '@/[fsd]/features/settings';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { Button, Checkbox, Input } from '@/[fsd]/shared/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { useTokenCreateMutation, useTokenListQuery } from '@/api/auth';
import { DEFAULT_TOKEN_EXPIRATION_DAYS, EXPIRATION_MEASURES, MAX_VARIABLES_LENGTH } from '@/common/constants';
import { buildErrorMessage, capitalizeFirstChar } from '@/common/utils';
import useNavBlocker from '@/hooks/useNavBlocker';

const TOKEN_NAME_PATTERN = /^[a-zA-Z0-9_-]*$/;

const validationSchema = yup.object({
  name: yup
    .string('Enter token name')
    .matches(TOKEN_NAME_PATTERN, 'Only alphanumeric characters, underscore and hyphen are allowed')
    .required('Name is required'),
});

const CreatePersonalToken = memo(() => {
  const navigate = useNavigate();
  const [data, setData] = useState({});
  const [wantToCancel, setWantToCancel] = useState(false);
  const [openTokenDialog, setOpenTokenDialog] = useState(false);
  const [createToken, { isLoading: isGenerating }] = useTokenCreateMutation();
  const { refetch } = useTokenListQuery({ skip: true });
  const { toastError } = useToast();
  // A restricted (scoped) token (#7336): projects, operations, and an expiry of at most 90 days
  const [restricted, setRestricted] = useState(false);
  const [scopeProjects, setScopeProjects] = useState([]);
  const [scopeOperations, setScopeOperations] = useState(TokenScopeHelpers.DEFAULT_TOKEN_OPERATIONS);
  // (#7337) a restricted token may act with the owner's Microsoft sign-in: the owner's consent, given here
  const { data: consentStatus } = useGetOwnerConsentStatusQuery();
  const [giveConsent] = useTokenConsentActionMutation();
  const [actWithSignIn, setActWithSignIn] = useState(false);
  const canOfferConsent = restricted && Boolean(consentStatus?.allowed && consentStatus?.linked);

  const formik = useFormik({
    initialValues: {
      name: '',
      measure: EXPIRATION_MEASURES[1],
      expiration: DEFAULT_TOKEN_EXPIRATION_DAYS,
    },
    validationSchema,
    onSubmit: async () => {
      const expires =
        formik.values.measure === EXPIRATION_MEASURES[0]
          ? null
          : { measure: formik.values.measure, value: formik.values.expiration };
      const { error, data: tokenData } = await createToken({
        name: formik.values.name,
        expires,
        ...TokenScopeHelpers.scopePayload({
          restricted,
          projects: scopeProjects,
          operations: scopeOperations,
        }),
      });
      if (!error) {
        if (canOfferConsent && actWithSignIn && tokenData?.id) {
          // the token exists either way; a refused consent is said and can be given again from the token list
          const { error: consentError } = await giveConsent({ tokenId: tokenData.id, action: 'consent' });
          if (consentError) toastError(buildErrorMessage(consentError));
        }
        setData(tokenData);
        setOpenTokenDialog(true);
        await refetch();
      } else if (restricted) {
        toastError(buildErrorMessage(error));
      }
    },
  });

  const hasChanged = useMemo(() => {
    return (
      JSON.stringify({
        name: '',
        measure: EXPIRATION_MEASURES[1],
        expiration: DEFAULT_TOKEN_EXPIRATION_DAYS,
      }) !== JSON.stringify(formik.values)
    );
  }, [formik.values]);

  const onCancel = useCallback(() => {
    setWantToCancel(true);
  }, []);

  useEffect(() => {
    if (wantToCancel) navigate(-1);
  }, [navigate, wantToCancel]);

  const onChangeExpiration = useCallback(
    event => {
      const newValue = parseInt(event.target.value, 10);
      formik.setFieldValue('expiration', newValue >= 1 ? newValue : 1);
    },
    [formik],
  );

  useNavBlocker({
    blockCondition: !data.uuid && hasChanged && !wantToCancel,
  });

  const nameHasError = formik.touched.name && Boolean(formik.errors.name);
  const isAtCharacterLimit = formik.values.name.length >= MAX_VARIABLES_LENGTH;

  const scopeError = restricted
    ? TokenScopeHelpers.scopeError({
        projects: scopeProjects,
        operations: scopeOperations,
        measure: formik.values.measure,
        expiration: formik.values.expiration,
      })
    : '';

  const isGenerateDisabled =
    !formik.values.name || nameHasError || isGenerating || !!data.uuid || Boolean(scopeError);

  const onToggleActWithSignIn = useCallback(event => setActWithSignIn(event.target.checked), []);

  const onToggleRestricted = useCallback(() => {
    // a restricted token always expires: "never" becomes the default number of days
    if (!restricted && formik.values.measure === EXPIRATION_MEASURES[0]) {
      formik.setFieldValue('measure', EXPIRATION_MEASURES[1]);
    }
    setRestricted(value => !value);
  }, [formik, restricted]);

  const getNameHelperText = useCallback(() => {
    if (formik.touched.name && formik.errors.name) {
      return formik.errors.name;
    }
    if (formik.values.name.length >= MAX_VARIABLES_LENGTH) {
      return `Maximum character limit reached (${MAX_VARIABLES_LENGTH})`;
    }
    return undefined;
  }, [formik.touched.name, formik.errors.name, formik.values.name.length]);

  const styles = createPersonalTokenStyles();

  return (
    <DrawerPage>
      <DrawerPageHeader
        title="New Token"
        titleTestId="create-personal-token-page-title"
        showBackButton
        showBorder
        onBack={onCancel}
        extraContent={
          <Box sx={styles.headerRight}>
            <Tooltip
              title="Generate new token"
              placement="bottom"
            >
              <Box component="span">
                <Button.BaseBtn
                  data-testid="create-personal-token-generate-button"
                  variant="elitea"
                  color="primary"
                  disabled={isGenerateDisabled}
                  onClick={() => formik.handleSubmit()}
                >
                  Generate
                  {isGenerating && (
                    <CircularProgress
                      size={16}
                      sx={styles.loadingIndicator}
                    />
                  )}
                </Button.BaseBtn>
              </Box>
            </Tooltip>
            <Button.DiscardButton
              disabled={isGenerating || !hasChanged}
              onDiscard={onCancel}
              title="Discard"
              alertContent="There are unsaved changes. Are you sure you want to discard them?"
            />
          </Box>
        }
      />
      <Box sx={styles.content}>
        <Box sx={styles.formWrapper}>
          <Box
            component="form"
            onSubmit={formik.handleSubmit}
          >
            <Box sx={styles.formFields}>
              <Box sx={styles.nameField}>
                <Input.InputBase
                  variant="standard"
                  fullWidth
                  id="name"
                  name="name"
                  label="Name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={nameHasError || isAtCharacterLimit}
                  helperText={getNameHelperText()}
                  helperTextTestId="create-personal-token-name-error"
                  inputProps={{
                    'data-testid': 'create-personal-token-name-input',
                    maxLength: MAX_VARIABLES_LENGTH,
                  }}
                />
              </Box>
              <Box sx={styles.expirationRow}>
                <Box sx={styles.measureField}>
                  <SingleSelect
                    data-testid="create-personal-token-expiration-measure-select"
                    showBorder
                    id="measure"
                    name="measure"
                    label="Expiration period"
                    onChange={formik.handleChange}
                    value={formik.values.measure}
                    options={EXPIRATION_MEASURES.filter(
                      measure => !restricted || measure !== EXPIRATION_MEASURES[0],
                    ).map(measure => ({
                      label: capitalizeFirstChar(measure),
                      value: measure,
                    }))}
                    showOptionIcon={false}
                  />
                </Box>
                <Box sx={styles.valueField}>
                  {formik.values.measure !== EXPIRATION_MEASURES[0] && (
                    <Input.InputBase
                      variant="standard"
                      fullWidth
                      id="expiration"
                      name="expiration"
                      label=""
                      type="number"
                      value={formik.values.expiration + ''}
                      onChange={onChangeExpiration}
                      onBlur={formik.handleBlur}
                      inputProps={{ 'data-testid': 'create-personal-token-expiration-value-input' }}
                    />
                  )}
                </Box>
              </Box>
              <TokenScopeFields
                restricted={restricted}
                projects={scopeProjects}
                operations={scopeOperations}
                error={scopeError}
                onToggle={onToggleRestricted}
                onProjectsChange={setScopeProjects}
                onOperationsChange={setScopeOperations}
              />
              {canOfferConsent && (
                <Box sx={styles.consentField}>
                  <FormControlLabel
                    label={OwnerConsentHelpers.TOKEN_CHECKBOX_LABEL}
                    control={
                      <Checkbox.BaseCheckbox
                        size="small"
                        checked={actWithSignIn}
                        onChange={onToggleActWithSignIn}
                        inputProps={{ 'data-testid': 'create-personal-token-act-with-sign-in' }}
                      />
                    }
                  />
                  <Typography
                    variant="bodySmall"
                    sx={styles.consentHint}
                  >
                    {OwnerConsentHelpers.TOKEN_CHECKBOX_HINT}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
      <GeneratedTokenDialog
        open={openTokenDialog}
        token={data?.token || ''}
        name={data?.name}
        onClose={() => {
          setOpenTokenDialog(false);
          onCancel();
        }}
      />
    </DrawerPage>
  );
});

CreatePersonalToken.displayName = 'CreatePersonalToken';

/** @type {MuiSx} */
const createPersonalTokenStyles = () => ({
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    minHeight: '4rem',
    borderBottom: ({ palette }) => `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: ({ palette }) => palette.background.default.tertiary,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  backIcon: {
    fontSize: '1rem',
    fill: ({ palette }) => palette.icon.default,
  },
  loadingIndicator: {
    ml: '0.5rem',
  },
  content: {
    padding: '1.5rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: 'calc(100vh - 4rem)',
  },
  formWrapper: {
    marginTop: '1.25rem',
    width: '100%',
    maxWidth: '45rem',
  },
  formFields: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.25rem',
  },
  nameField: {
    width: '17.875rem',
  },
  expirationRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: '1rem',
  },
  measureField: {
    width: '12.5rem',
  },
  valueField: {
    width: '5.375rem',
    paddingTop: '0.125rem',
  },
  consentField: {
    width: '30rem',
    display: 'flex',
    flexDirection: 'column',
  },
  consentHint: ({ palette }) => ({
    color: palette.text.secondary,
  }),
});

export default memo(CreatePersonalToken);
