import { memo, useCallback, useEffect } from 'react';

import { useFormik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

import { Box, Button, TextField, Typography } from '@mui/material';

import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { useArtifactListQuery, useCreateBucketMutation, useEditBucketMutation } from '@/api/artifacts';
import { PENDING_BUCKET_SESSION_KEY } from '@/common/artifactConstants';
import { DEFAULT_RETENTION_VALUE, RETENTION_MEASURES } from '@/common/constants';
import { buildErrorMessage, capitalizeFirstChar } from '@/common/utils';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import { actions } from '@/slices/artifact';
import { convertRetentionDaysToPolicy, getRetentionPolicyForEditing } from '@/utils/retentionPolicy';

const validationSchema = yup.object({
  name: yup
    .string('Enter token name')
    .matches(
      /^[a-zA-Z][a-zA-Z0-9-]*$/,
      'Name should start with a letter and contain only letters, numbers, and hyphen',
    )
    .max(56, 'Name should not exceed 56 characters')
    .required('Name is required'),
  expiration_measure: yup.string(),
  expiration_value: yup
    .number('Enter retention value')
    .typeError('Expiration value must be a number')
    .test('is-NaN', 'Expiration value must be a number', value => !isNaN(value))
    .min(1, 'Retention value should be greater than 0'),
});

const CreateBucket = memo(() => {
  const { toastError, toastSuccess } = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const projectId = useSelectedProjectId();
  const currentBucket = useSelector(state => state.artifact.bucket);

  // Fetch retention policy from artifact list when editing a bucket
  const { data: bucketMetadata } = useArtifactListQuery(
    {
      projectId,
      bucket: currentBucket?.name,
    },
    {
      skip: !currentBucket?.name || !projectId,
      refetchOnMountOrArgChange: true,
    },
  );

  const [
    createBucket,
    {
      isError: isCreateBucketError,
      isSuccess: isCreateBucketSuccess,
      isLoading: isCreating,
      error: createBucketError,
    },
  ] = useCreateBucketMutation();
  const [
    editBucket,
    {
      isError: isEditBucketError,
      isSuccess: isEditBucketSuccess,
      isLoading: isUpdating,
      error: editBucketError,
    },
  ] = useEditBucketMutation();

  // Use retention policy from bucketMetadata if available, otherwise fall back to currentBucket
  const retentionPolicy = bucketMetadata?.retention_policy || currentBucket?.retention_policy;

  // Get intelligently converted retention policy values for editing (preserves user intent)
  const editingRetentionPolicy = getRetentionPolicyForEditing(retentionPolicy);

  // If no legacy retention policy, try to convert from retentionDays (new backend format)
  const policyFromRetentionDays = convertRetentionDaysToPolicy(currentBucket?.retentionDays);

  const formik = useFormik({
    initialValues: {
      name: currentBucket?.name || 'new-bucket',
      expiration_measure:
        editingRetentionPolicy?.expiration_measure ||
        policyFromRetentionDays?.expiration_measure ||
        currentBucket?.expiration_measure ||
        RETENTION_MEASURES[3],
      expiration_value:
        editingRetentionPolicy?.expiration_value ||
        policyFromRetentionDays?.expiration_value ||
        currentBucket?.expiration_value ||
        DEFAULT_RETENTION_VALUE,
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async values => {
      try {
        // Validate values before submitting
        if (!values.name || values.name.trim().length === 0) {
          toastError('Bucket name is required');
          return;
        }

        if (!values.expiration_measure || !values.expiration_value) {
          toastError('Retention policy is required');
          return;
        }

        if (!currentBucket) {
          const { error } = await createBucket({
            projectId,
            name: values.name.trim(),
            expiration_measure: values.expiration_measure,
            expiration_value: parseInt(values.expiration_value),
          });
          if (!error) {
            sessionStorage.setItem(PENDING_BUCKET_SESSION_KEY, values.name.trim());
            navigate(-1);
          }
        } else {
          const { error } = await editBucket({
            projectId,
            name: values.name.trim(),
            expiration_measure: values.expiration_measure,
            expiration_value: parseInt(values.expiration_value),
          });
          if (!error) {
            dispatch(actions.setBucket(null));
            navigate(-1);
          }
        }
      } catch (err) {
        toastError('Failed to save bucket: ' + err.message);
      }
    },
  });

  const onSave = useCallback(
    event => {
      // Prevent any default behavior
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      // Force blur any focused element to close dropdowns/tooltips
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }

      // Submit the form
      formik.handleSubmit();
    },
    [formik],
  );

  const onCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const onChangeRetention = useCallback(
    event => {
      formik.setFieldValue('expiration_value', event.target.value);
    },
    [formik],
  );

  useEffect(() => {
    if (isCreateBucketSuccess) {
      toastSuccess('The bucket has been created successfully');
    }
  }, [isCreateBucketSuccess, toastSuccess]);

  useEffect(() => {
    if (isCreateBucketError) {
      toastError(buildErrorMessage(createBucketError));
    }
  }, [createBucketError, isCreateBucketError, toastError]);

  useEffect(() => {
    if (isEditBucketSuccess) {
      toastSuccess('The bucket has been updated successfully');
    }
  }, [isEditBucketSuccess, toastSuccess]);

  useEffect(() => {
    if (isEditBucketError) {
      toastError(buildErrorMessage(editBucketError));
    }
  }, [editBucketError, isEditBucketError, toastError]);

  const styles = createBucketStyles();

  return (
    <>
      <Box sx={styles.divider} />
      <Box sx={styles.mainContainer}>
        <Box sx={styles.contentWrapper}>
          <Box sx={styles.headerWrapper}>
            <Typography
              variant="headingMedium"
              color="text.main"
            >
              {currentBucket ? 'Edit bucket' : 'New Bucket'}
            </Typography>
          </Box>
          <Box
            component="form"
            onSubmit={formik.handleSubmit}
          >
            <Box sx={styles.formContent}>
              <Box sx={styles.nameFieldWrapper}>
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
                  disabled={!!currentBucket}
                  inputProps={{ maxLength: 56 }}
                />
              </Box>
              <Box sx={styles.retentionPolicyWrapper}>
                <Box sx={styles.selectWrapper}>
                  <SingleSelect
                    showBorder
                    id="expiration_measure"
                    name="expiration_measure"
                    label="Retention policy"
                    onChange={formik.handleChange}
                    value={formik.values.expiration_measure}
                    options={RETENTION_MEASURES.map(expiration_measure => ({
                      label: capitalizeFirstChar(expiration_measure),
                      value: expiration_measure,
                    }))}
                  />
                </Box>
                <Box sx={styles.valueFieldWrapper}>
                  <TextField
                    variant="standard"
                    fullWidth
                    id="expiration_value"
                    name="expiration_value"
                    label=""
                    type="number"
                    value={formik.values.expiration_value}
                    onChange={onChangeRetention}
                    onBlur={formik.handleBlur}
                    error={formik.touched.expiration_value && Boolean(formik.errors.expiration_value)}
                    helperText={formik.touched.expiration_value && formik.errors.expiration_value}
                    sx={styles.valueField}
                  />
                </Box>
              </Box>
              <Box sx={styles.buttonWrapper}>
                <Button
                  onClick={onSave}
                  variant="alita"
                  color="primary"
                  disabled={
                    isCreating ||
                    isUpdating ||
                    !formik.values?.name ||
                    formik.values.name.length === 0 ||
                    formik.values.name.length > 56
                  }
                >
                  Save
                  {(isCreating || isUpdating) && <StyledCircleProgress size={20} />}
                </Button>
                <Button
                  onClick={onCancel}
                  variant="alita"
                  color="secondary"
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
});
CreateBucket.displayName = 'CreateBucket';

/** @type {MuiSx} */
const createBucketStyles = () => ({
  divider: ({ palette }) => ({
    width: '100%',
    height: '0.0625rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  mainContainer: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflow: 'hidden',
    height: 'calc(100vh - 4.875rem)',
    backgroundColor: palette.background.tabPanel,
  }),
  contentWrapper: {
    marginTop: '1.5rem',
  },
  headerWrapper: {
    marginBottom: '1.25rem',
  },
  formContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  nameFieldWrapper: {
    width: '32.5rem',
    marginRight: '1rem',
  },
  retentionPolicyWrapper: {
    display: 'flex',
  },
  selectWrapper: {
    width: '15rem',
    marginRight: '1rem',
    paddingTop: '0.5rem',
  },
  valueFieldWrapper: {
    width: '16.5rem',
  },
  valueField: {
    paddingTop: '1.375rem',
  },
  buttonWrapper: {
    display: 'flex',
    marginTop: '2rem',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem',
  },
});

export default CreateBucket;
