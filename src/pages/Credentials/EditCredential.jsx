import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Form, Formik } from 'formik';
import { useParams } from 'react-router-dom';

import { Grid } from '@mui/material';

import { CredentialsControls, CredentialsTabBar } from '@/[fsd]/features/credentials/ui';
import { useSystemSenderName } from '@/[fsd]/shared/lib/hooks/useEnvironmentSettingByKey.hooks';
import { Tooltip } from '@/[fsd]/shared/ui';
import { useGetConfigurationDetailQuery } from '@/api/configurations';
import { convertCredentialConfigSchema } from '@/common/credentialSchemaUtils';
import { SPACING } from '@/common/designTokens';
import { isNotFoundError } from '@/common/utils.jsx';
import StyledTabs from '@/components/StyledTabs';
import useGetCurrentConfigurationAsSchemas from '@/hooks/useGetCurrentConfigurationAsSchemas';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToolkitConfigurationProperties from '@/hooks/useToolkitConfigurationProperties';
import { StyledGridContainer } from '@/pages/Common/Components';
import CredentialForm from '@/pages/Credentials/CredentialForm.jsx';
import Page404 from '@/pages/Page404.jsx';

const EditCredential = memo(({ title, forceShowTitle }) => {
  const projectId = useSelectedProjectId();
  const systemSenderName = useSystemSenderName();
  const { credential_uid } = useParams();
  const [toolErrors, setToolErrors] = useState({});
  const [showValidation, setShowValidation] = useState(false);
  const [validationErrorMessages, setValidationErrorMessages] = useState({});
  const [apiError, setApiError] = useState('');

  const { configurationsAsSchema, isLoading: isConfigurationsAsSchemaLoading } =
    useGetCurrentConfigurationAsSchemas();

  const {
    data: configuration,
    isLoading: isConfigurationDetailLoading,
    isError,
    error,
  } = useGetConfigurationDetailQuery(
    {
      projectId,
      configId: credential_uid,
    },
    {
      skip: !credential_uid || !projectId,
      refetchOnMountOrArgChange: true,
    },
  );
  const { toolSchema } = useToolkitConfigurationProperties({ toolType: configuration?.type });

  const [editCredentialDetail, setEditCredentialDetail] = useState({});
  const hasErrors = useMemo(() => !!Object.values(toolErrors).some(i => i), [toolErrors]);
  const initialCredentialDetail = useMemo(() => {
    if (!isConfigurationDetailLoading && configuration) {
      const type = configuration?.type;
      const schema = configurationsAsSchema?.find(item => item?.type === configuration?.type);

      return {
        ...configuration,
        type,
        schema: convertCredentialConfigSchema(schema?.config_schema, toolSchema, systemSenderName),
        section: configuration?.section,
        has_test_connection: schema?.has_test_connection || false,
        check_connection_label: schema?.check_connection_label,
        settings: {
          ...configuration?.data,
          elitea_title: configuration?.elitea_title || configuration?.data.title,
          label: configuration?.label || '',
          shared: configuration?.shared || false,
        },
      };
    }
    return {};
  }, [isConfigurationDetailLoading, configuration, configurationsAsSchema, toolSchema, systemSenderName]);

  useEffect(() => {
    if (!isConfigurationDetailLoading && configuration && configurationsAsSchema) {
      const type = configuration?.type;
      const schema = configurationsAsSchema.find(item => item?.type === configuration?.type);

      setEditCredentialDetail({
        ...configuration,
        type,
        schema: convertCredentialConfigSchema(schema?.config_schema, toolSchema, systemSenderName),
        section: configuration?.section,
        has_test_connection: schema?.has_test_connection || false,
        check_connection_label: schema?.check_connection_label,
        settings: {
          ...configuration?.data,
          elitea_title: configuration?.elitea_title || configuration?.data.title,
          label: configuration?.label || '',
          shared: configuration?.shared || false,
        },
      });
    }
  }, [
    setEditCredentialDetail,
    configuration,
    isConfigurationDetailLoading,
    configurationsAsSchema,
    toolSchema,
    systemSenderName,
  ]);

  const [isCredentialDirty, setIsCredentialDirty] = useState(false);

  const onChangeCredentialDetail = useCallback((...args) => {
    setIsCredentialDirty(!!args[0]);
    setEditCredentialDetail(args[0]);
    //@todo: clear url might be here
  }, []);

  const handleFormSubmit = useCallback(() => {
    // Empty submit handler
  }, []);

  const handleClearCredentialDetail = useCallback(() => {
    if (configuration && configurationsAsSchema) {
      const type = configuration?.type;
      const schema = configurationsAsSchema.find(item => item?.type === configuration?.type);

      setEditCredentialDetail({
        ...configuration,
        type,
        schema: convertCredentialConfigSchema(schema?.config_schema, toolSchema, systemSenderName),
        section: configuration?.section,
        has_test_connection: schema?.has_test_connection || false,
        check_connection_label: schema?.check_connection_label,
        settings: {
          ...configuration?.data,
          elitea_title: configuration?.elitea_title || configuration?.data.title,
          label: configuration?.label || '',
          shared: configuration?.shared || false,
        },
      });
      setValidationErrorMessages({});
      setShowValidation(false);
      setApiError('');
    }
  }, [configuration, configurationsAsSchema, toolSchema, systemSenderName]);

  const onEnableEditTitle = useCallback(() => {
    setEditCredentialDetail(prev => ({ ...prev, enableEditEliteATitle: true }));
  }, []);

  const credentialDisplayName = useMemo(
    () =>
      configuration?.label ||
      configuration?.elitea_title ||
      configuration?.data?.title ||
      title ||
      'Credential',
    [configuration, title],
  );

  const styles = editCredentialStyles();

  const shouldShowNotFoundPage = isError && isNotFoundError(error);

  useEffect(() => {
    // each tool must have name and description
    setToolErrors(prevState => ({
      ...prevState,
      name: false,
      type: false,
      data: false,
    }));
  }, [
    setToolErrors,
    editCredentialDetail?.name,
    editCredentialDetail?.description,
    editCredentialDetail?.settings,
  ]);

  if (shouldShowNotFoundPage) {
    return <Page404 />;
  }

  return (
    <Formik
      enableReinitialize
      initialValues={initialCredentialDetail}
      // validationSchema={getValidateSchema}
      onSubmit={handleFormSubmit}
    >
      <StyledTabs
        fullWidth
        tabSX={styles.tabSX}
        forceShowLabel={forceShowTitle}
        tabs={[
          {
            label: (
              <Tooltip.TypographyWithConditionalTooltip
                title={credentialDisplayName}
                placement="top"
                variant="labelMedium"
                sx={styles.credentialTitle}
              >
                {credentialDisplayName}
              </Tooltip.TypographyWithConditionalTooltip>
            ),
            //@todo: need to optimize components for reusability of TabBars
            tabBarItems: editCredentialDetail ? (
              <CredentialsTabBar
                credentialDetails={editCredentialDetail}
                onClearCredentialDetails={handleClearCredentialDetail}
                configurationsAsSchema={configurationsAsSchema}
                onEnableEditTitle={onEnableEditTitle}
                hasErrors={hasErrors}
                setShowValidation={setShowValidation}
                setApiError={setApiError}
                setValidationErrorMessages={setValidationErrorMessages}
              />
            ) : null,
            rightToolbar: editCredentialDetail ? (
              <CredentialsControls credentialDetails={editCredentialDetail} />
            ) : null,
            content: (
              <Form style={styles.form}>
                <StyledGridContainer
                  columnSpacing={SPACING.gridSpacing}
                  container
                  sx={styles.gridContainerWrapper}
                >
                  <Grid
                    size={{ xs: 12 }}
                    sx={styles.gridContainer}
                  >
                    {!!editCredentialDetail && (
                      <CredentialForm
                        credentialDetails={editCredentialDetail}
                        onChangeCredentialDetail={onChangeCredentialDetail}
                        isToolDirty={isCredentialDirty}
                        isViewToggleVisible={false}
                        showOnlyConfigurationFields={true}
                        isConfigurationDataLoading={
                          isConfigurationDetailLoading || isConfigurationsAsSchemaLoading
                        }
                        configurationsAsSchema={configurationsAsSchema}
                        toolErrors={toolErrors}
                        setToolErrors={setToolErrors}
                        showValidation={showValidation}
                        setShowValidation={setShowValidation}
                        validationErrorMessages={validationErrorMessages}
                        setValidationErrorMessages={setValidationErrorMessages}
                        apiError={apiError}
                        setApiError={setApiError}
                      />
                    )}
                  </Grid>
                </StyledGridContainer>
              </Form>
            ),
          },
        ]}
      />
    </Formik>
  );
});

EditCredential.displayName = 'EditCredential';

/** @type {MuiSx} */
const editCredentialStyles = () => ({
  form: {
    height: '100%',
  },
  gridContainerWrapper: {
    padding: 0,
  },
  tabSX: {
    paddingX: `${SPACING.listItemSpacing} ${SPACING.XXL}`,
    justifyContent: 'flex-start',
    gap: SPACING.SM,

    '& .MuiBox-root': {
      flex: 'none',
    },

    '& .MuiBox-root:last-child': {
      marginLeft: 'auto',
    },
    '& button.Mui-selected': ({ palette }) => ({
      color: palette.text.secondary,
      padding: 0,
      cursor: 'default',
    }),
    '& .MuiTabs-indicator': {
      display: 'none',
    },
  },
  credentialTitle: {
    maxWidth: '12.5rem',
    textAlign: 'center',
    textTransform: 'none !important',
  },
  gridContainer: ({ breakpoints }) => ({
    [breakpoints.up('lg')]: {
      overflowY: 'scroll',
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
      height: '100%',
      '::-webkit-scrollbar': {
        display: 'none',
      },
    },
    [breakpoints.down('lg')]: {
      marginBottom: SPACING.XXL,
    },
  }),
});

export default EditCredential;
