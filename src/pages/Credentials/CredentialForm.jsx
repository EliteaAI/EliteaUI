import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import { Box, Button, CircularProgress, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import { useConfigOAuthModal, useMcpTokenChange } from '@/[fsd]/features/mcp/lib/hooks';
import { McpAuthModal, McpLogoutModal } from '@/[fsd]/features/mcp/ui';
import { ToolComponentHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { PUBLIC_PROJECT_ID, ToolkitViewOptions } from '@/common/constants';
import { updateObjectByPath } from '@/common/utils.jsx';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents.jsx';
import { FormViewToggle } from '@/components/FormViewToggle';
import useCreateConfiguration from '@/hooks/application/useCreateConfiguration';
import { Create_Personal_Title, Create_Project_Title, Manual_Title } from '@/hooks/useConfigurations';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';

const CredentialForm = memo(props => {
  const {
    credentialDetails,
    onChangeCredentialDetail,
    isViewToggleVisible = true,
    showOnlyRequiredFields = false,
    showOnlyConfigurationFields = false,
    showNameFieldForcedly = false,
    showToolkitIcon = false,
    isConfigurationDataLoading,
    configurationsAsSchema,
    toolErrors,
    setToolErrors,
    showValidation,
    setShowValidation,
    validationErrorMessages,
    setValidationErrorMessages,
    apiError,
    setApiError,
  } = props;
  const [view, setView] = useState(ToolkitViewOptions.Form);
  const { setFieldValue } = useFormikContext();

  const [searchParams] = useSearchParams();

  const { personal_project_id } = useSelector(state => state.user);
  const selectedProjectId = useSelectedProjectId();
  const excludedFields = useMemo(() => {
    return selectedProjectId !== PUBLIC_PROJECT_ID ? ['shared'] : [];
  }, [selectedProjectId]);

  const toolType = useMemo(() => {
    return credentialDetails?.type || '';
  }, [credentialDetails?.type]);

  const toolSchema = useMemo(() => {
    return credentialDetails?.schema;
  }, [credentialDetails?.schema]);

  const checkConnectionConfig = useMemo(() => {
    return toolSchema?.metadata?.check_connection;
  }, [toolSchema?.metadata?.check_connection]);

  const isTestConnectionAllowed = useMemo(() => {
    if (!credentialDetails?.has_test_connection) return false;

    const enabledWhen = checkConnectionConfig?.enabled_when;
    if (!enabledWhen) return true;

    const requiredFields = enabledWhen?.all_fields_set;
    if (!Array.isArray(requiredFields) || requiredFields.length === 0) return true;

    return requiredFields.every(fieldKey => {
      const value = credentialDetails?.settings?.[fieldKey];
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      return true;
    });
  }, [
    checkConnectionConfig?.enabled_when,
    credentialDetails?.has_test_connection,
    credentialDetails?.settings,
  ]);
  const ToolComponent = useMemo(() => {
    if (searchParams.get('forceCustom') === 'true' || view === ToolkitViewOptions.Json) {
      return ToolkitForm.ToolCustom;
    }
    const toolTypedComponent = ToolComponentHelpers.getToolComponent(toolType, toolSchema);
    return toolTypedComponent;
  }, [searchParams, view, toolType, toolSchema]);

  const [configurationErrors, setConfigurationErrors] = useState({});
  const [showConfigurationValidateError, setShowConfigurationValidateError] = useState(false);
  const [configurationName, setConfigurationName] = useState(credentialDetails?.settings?.title || '');
  const [configuration, setConfiguration] = useState({
    elitea_title: credentialDetails?.settings?.elitea_title || Manual_Title,
    private: credentialDetails?.settings?.private,
  });

  const editField = useCallback(
    async (field, value, replace) => {
      setValidationErrorMessages(prevState => {
        const fieldName = field.replace('settings.', '');
        if (prevState[fieldName]) {
          const updatedMessages = { ...prevState };
          delete updatedMessages[fieldName];
          return updatedMessages;
        }
        return prevState;
      });
      onChangeCredentialDetail(prevState => {
        return updateObjectByPath(prevState || {}, field, value, replace);
      });

      await setFieldValue(field, value);
    },
    [onChangeCredentialDetail, setFieldValue, setValidationErrorMessages],
  );

  const onSaveConfiguration = useCallback(
    async config => {
      setConfiguration({
        elitea_title: config?.settings?.elitea_title,
        private: config?.project_id === personal_project_id,
      });
      if (config?.project_id) {
        // Update the settings without triggering form dirty state
        onChangeCredentialDetail(prevState => {
          return {
            ...prevState,
            settings: {
              ...(prevState?.settings || {}),
              elitea_title: config?.settings?.elitea_title,
              private: config?.project_id === personal_project_id,
            },
          };
        });
      }
    },
    [onChangeCredentialDetail, personal_project_id],
  );
  // Use configuration type directly for useCreateConfiguration
  const configurationType = useMemo(() => credentialDetails?.type, [credentialDetails?.type]);

  // Config OAuth: when check_connection returns requires_authorization, open modal; on success retry test connection
  const onTestConnectionRef = useRef();
  const configOAuth = useConfigOAuthModal({
    onSuccess: () => onTestConnectionRef.current?.(),
    credentials: {
      client_id: credentialDetails?.settings?.client_id,
      client_secret: credentialDetails?.settings?.client_secret,
      scopes: credentialDetails?.settings?.scopes,
    },
  });

  // OAuth logout: each credential gets its own token key to prevent cross-credential token sharing.
  // When credential_uid is available (editing an existing credential), compose a per-credential key:
  //   "<configuration_uuid>:<oauth_discovery_endpoint>"
  // We use credentialDetails.uuid (the real UUID) — NOT credential_uid from URL params
  // (which is the integer DB ID) — so the key matches the backend's configuration_uuid
  // that is set during expand_configuration().
  const { toastSuccess } = useToast();
  const oauthServerUrl = credentialDetails?.settings?.oauth_discovery_endpoint;
  // Build a credential-scoped key when we have both a UUID and a discovery endpoint.
  const credentialUuid = credentialDetails?.uuid;
  const oauthTokenKey = useMemo(() => {
    if (credentialUuid && oauthServerUrl) {
      return `${credentialUuid}:${oauthServerUrl}`;
    }
    return oauthServerUrl;
  }, [credentialUuid, oauthServerUrl]);
  const { isLoggedIn: isOAuthLoggedIn } = useMcpTokenChange({ serverUrl: oauthTokenKey });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const onConfirmLogout = useCallback(() => {
    McpAuthHelpers.logout(oauthTokenKey);
    setShowLogoutModal(false);
    toastSuccess('You have successfully logged out!');
  }, [oauthTokenKey, toastSuccess]);

  const onLogout = useCallback(() => {
    setShowLogoutModal(true);
  }, []);

  const onCloseLogoutModal = useCallback(() => {
    setShowLogoutModal(false);
  }, []);
  const { onTestConnection, isTestingConnection } = useCreateConfiguration({
    type: configurationType,
    configuration,
    configurationName,
    settings: credentialDetails?.settings,
    onSaveConfiguration,
    setShowConfigurationValidateError,
    configurationErrors,
    configurationsAsSchema,
    setValidationErrorMessages,
    setShowValidation,
    setTestConnectionError: setApiError,
    onConfigAuthRequired: configOAuth.handleConfigAuthRequired,
    // Pass the credential-scoped token key so the correct token is fetched/stored
    oauthTokenKey,
  });
  useEffect(() => {
    onTestConnectionRef.current = onTestConnection;
  }, [onTestConnection]);

  const onClickTestConnection = useCallback(async () => {
    onTestConnection();
    setValidationErrorMessages({});
    setApiError('');
  }, [onTestConnection, setApiError, setValidationErrorMessages]);

  useEffect(() => {
    // Initialize configuration name from credentialDetails when it changes
    if (credentialDetails?.settings?.title && !configurationName) {
      setConfigurationName(credentialDetails.settings.title);
    }
  }, [credentialDetails?.settings?.title, configurationName]);

  useEffect(() => {
    setConfigurationErrors(prevState => ({
      ...prevState,
      configurationName:
        [Create_Personal_Title, Create_Project_Title, Manual_Title].includes(configuration?.elitea_title) &&
        !configurationName,
    }));
  }, [configuration?.elitea_title, configurationName]);

  useEffect(() => {
    if (
      configuration?.elitea_title !== Create_Personal_Title &&
      configuration?.elitea_title !== Create_Project_Title
    ) {
      setShowConfigurationValidateError(false);
    }
  }, [configuration?.elitea_title]);

  const testConnectionTooltipTitle = useMemo(() => {
    if (!credentialDetails?.has_test_connection) {
      return `${credentialDetails?.check_connection_label || 'Test connection'} is not available for this credential type`;
    }

    if (!isTestConnectionAllowed) {
      return (
        checkConnectionConfig?.disabled_tooltip || 'Test connection is not available for current settings'
      );
    }

    return '';
  }, [
    checkConnectionConfig?.disabled_tooltip,
    credentialDetails?.check_connection_label,
    credentialDetails?.has_test_connection,
    isTestConnectionAllowed,
  ]);

  const styles = credentialFormStyles();

  return isConfigurationDataLoading ? (
    <CircularProgress size={20} />
  ) : (
    <Box sx={styles.container}>
      {credentialDetails.type !== ToolTypes.custom.value && !!toolSchema && isViewToggleVisible && (
        <FormViewToggle
          containerSX={styles.formViewToggle}
          view={view}
          onChangeView={setView}
        />
      )}
      <ToolComponent
        editToolDetail={credentialDetails}
        // editToolDetail={values}
        setEditToolDetail={onChangeCredentialDetail}
        editField={editField}
        toolErrors={toolErrors}
        setToolErrors={setToolErrors}
        showValidation={showValidation}
        configurationErrors={configurationErrors}
        setConfigurationErrors={setConfigurationErrors}
        showConfigurationValidateError={showConfigurationValidateError}
        setShowConfigurationValidateError={setShowConfigurationValidateError}
        configurationName={configurationName}
        setConfigurationName={setConfigurationName}
        configuration={configuration}
        setConfiguration={setConfiguration}
        schema={toolSchema}
        showOnlyRequiredFields={showOnlyRequiredFields}
        showOnlyConfigurationFields={showOnlyConfigurationFields}
        showNameFieldForcedly={showNameFieldForcedly}
        showToolkitIcon={showToolkitIcon}
        checkboxAsteriskRequired={false}
        priorityFieldsOrder={['title']}
        fieldNeedToRenderAtBottom={['shared']}
        excludedFields={excludedFields}
        shouldInitRequiredFields={false}
        showSections
        showTools={false}
        validationErrorMessages={validationErrorMessages}
        setValidationErrorMessages={setValidationErrorMessages}
      />
      <Box sx={styles.testConnectionContainer}>
        <Tooltip
          title={testConnectionTooltipTitle}
          placement="bottom"
        >
          <span>
            <Button
              variant="elitea"
              color="secondary"
              onClick={onClickTestConnection}
              disabled={
                !credentialDetails?.has_test_connection || !isTestConnectionAllowed || isTestingConnection
              }
            >
              {credentialDetails?.check_connection_label || 'Test connection'}
              {isTestingConnection && <StyledCircleProgress size={20} />}
            </Button>
          </span>
        </Tooltip>
        {isOAuthLoggedIn && oauthTokenKey && (
          <Button
            variant="elitea"
            color="secondary"
            onClick={onLogout}
          >
            Logout
          </Button>
        )}
        {!isOAuthLoggedIn && oauthTokenKey && (
          <Button
            variant="elitea"
            color="secondary"
            onClick={onClickTestConnection}
            disabled={isTestingConnection}
          >
            Login
          </Button>
        )}
      </Box>
      {apiError && (
        <Typography
          variant="bodyMedium"
          component="div"
          sx={styles.errorMessage}
        >
          {apiError}
        </Typography>
      )}
      <McpAuthModal {...configOAuth.getModalProps()} />
      <McpLogoutModal
        serverUrl={oauthTokenKey}
        open={showLogoutModal}
        onClose={onCloseLogoutModal}
        onConfirm={onConfirmLogout}
      />
    </Box>
  );
});

CredentialForm.displayName = 'CredentialForm';

/** @type {MuiSx} */
const credentialFormStyles = () => ({
  container: {
    maxWidth: '40.1875rem',
    margin: '0.75rem auto 0',
    position: 'relative',
    height: '100%',
  },
  formViewToggle: {
    marginBottom: '1.5rem',
  },
  testConnectionContainer: {
    display: 'flex',
    marginTop: '2rem',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem',
  },
  errorMessage: {
    marginTop: '.5rem',
    paddingLeft: '0.25rem',
    color: ({ palette }) => `${palette.error.main}`,
  },
});

export default CredentialForm;
