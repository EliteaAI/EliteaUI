import { memo, useCallback, useMemo, useState } from 'react';

import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

import { Box, CircularProgress, Button as MuiButton, TextField, Tooltip } from '@mui/material';

import { DrawerPage, DrawerPageHeader } from '@/[fsd]/features/settings/ui/drawer-page';
import { GeneratedTokenDialog } from '@/[fsd]/features/settings/ui/personal-tokes';
import { Button } from '@/[fsd]/shared/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { useTokenCreateMutation, useTokenListQuery } from '@/api/auth';
import { DEFAULT_TOKEN_EXPIRATION_DAYS, EXPIRATION_MEASURES } from '@/common/constants';
import { capitalizeFirstChar } from '@/common/utils';
import useNavBlocker from '@/hooks/useNavBlocker';

const validationSchema = yup.object({
  name: yup.string('Enter token name').required('Name is required'),
});

const CreatePersonalToken = memo(() => {
  const navigate = useNavigate();
  const [data, setData] = useState({});
  const [openTokenDialog, setOpenTokenDialog] = useState(false);
  const [createToken, { isLoading: isGenerating }] = useTokenCreateMutation();
  const { refetch } = useTokenListQuery({ skip: true });

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
      const { error, data: tokenData } = await createToken({ name: formik.values.name, expires });
      if (!error) {
        setData(tokenData);
        setOpenTokenDialog(true);
        await refetch();
      } else {
        // Handle error
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
    navigate(-1);
  }, [navigate]);

  const onChangeExpiration = useCallback(
    event => {
      const newValue = parseInt(event.target.value, 10);
      formik.setFieldValue('expiration', newValue >= 1 ? newValue : 1);
    },
    [formik],
  );

  useNavBlocker({
    blockCondition: !data.uuid && hasChanged,
  });

  const styles = createPersonalTokenStyles();

  return (
    <DrawerPage>
      <DrawerPageHeader
        title="New Token"
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
                <MuiButton
                  variant="alita"
                  color="primary"
                  disabled={!formik.values.name || isGenerating || !!data.uuid}
                  onClick={() => formik.handleSubmit()}
                >
                  Generate
                  {isGenerating && (
                    <CircularProgress
                      size={16}
                      sx={styles.loadingIndicator}
                    />
                  )}
                </MuiButton>
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
          <form onSubmit={formik.handleSubmit}>
            <Box sx={styles.formFields}>
              <Box sx={styles.nameField}>
                <TextField
                  variant="standard"
                  fullWidth
                  id="name"
                  name="name"
                  label="Name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />
              </Box>
              <Box sx={styles.expirationRow}>
                <Box sx={styles.measureField}>
                  <SingleSelect
                    showBorder
                    id="measure"
                    name="measure"
                    label="Expiration period"
                    onChange={formik.handleChange}
                    value={formik.values.measure}
                    options={EXPIRATION_MEASURES.map(measure => ({
                      label: capitalizeFirstChar(measure),
                      value: measure,
                    }))}
                    showOptionIcon={false}
                  />
                </Box>
                <Box sx={styles.valueField}>
                  {formik.values.measure !== EXPIRATION_MEASURES[0] && (
                    <TextField
                      variant="standard"
                      fullWidth
                      id="expiration"
                      name="expiration"
                      label=""
                      type="number"
                      value={formik.values.expiration + ''}
                      onChange={onChangeExpiration}
                      onBlur={formik.handleBlur}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </form>
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
    backgroundColor: ({ palette }) => palette.background.tabPanel,
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
    fill: ({ palette }) => palette.icon.fill.default,
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
});

export default memo(CreatePersonalToken);
