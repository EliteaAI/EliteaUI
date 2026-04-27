import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import { CredentialErrorHelpers } from '@/[fsd]/features/credentials/lib/helpers';
import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import {
  useCreateConfigurationMutation,
  useTestConfigurationConnectionMutation,
} from '@/api/configurations.js';
import { buildErrorMessage } from '@/common/utils';
import { Create_Personal_Title, Create_Project_Title, Manual_Title } from '@/hooks/useConfigurations';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const getRequestBody = ({ type, configurationKeys, settings, configurationName, configurationsAsSchema }) => {
  let configurationsSchema = configurationsAsSchema?.find(item => item.type === type);

  if (!configurationsSchema) {
    configurationsSchema = configurationsAsSchema?.find(item => item.title === type);
  }

  const dataProperties = configurationsSchema?.config_schema?.properties?.data?.properties || {};
  const requiredFields = configurationsSchema?.config_schema?.properties?.data?.required || [];

  let titleValue = configurationName;

  if (settings.alita_title) {
    titleValue = settings.alita_title;
  }

  // Auto-generate title
  if (!titleValue || titleValue.trim() === '') {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    titleValue = `${type}_${timestamp}`;
  }

  const body = {
    alita_title: titleValue || `New ${type} configuration`,
    label: settings.label || '',
    type,
    data: {},
  };

  if (configurationKeys && configurationKeys.length > 0) {
    configurationKeys.forEach(key => {
      if (settings[key] !== undefined) {
        body.data[key] = settings[key];
      }
    });
  }

  requiredFields.forEach(fieldName => {
    const fieldSchema = dataProperties[fieldName];

    if (fieldSchema?.type === 'boolean' && !(fieldName in body.data)) {
      body.data[fieldName] = settings[fieldName] !== undefined ? settings[fieldName] : false;
    }
  });

  return body;
};

export default function useCreateConfiguration({
  type,
  configuration,
  configurationName,
  settings,
  onSaveConfiguration,
  setShowConfigurationValidateError,
  configurationErrors,
  configurationsAsSchema,
  setValidationErrorMessages,
  setShowValidation,
  setTestConnectionError,
  onToolsDiscovered,
  onConfigAuthRequired,
  // Optional credential-scoped token key for credential OAuth flows.
  // When provided (e.g. "<credential_uid>:<oauth_discovery_endpoint>"), tokens are
  // looked up and stored per-credential rather than per-tenant, ensuring that two
  // SharePoint credentials sharing the same oauth_discovery_endpoint remain isolated.
  oauthTokenKey,
}) {
  const { toastError, toastSuccess } = useToast();
  const [testConnection, { isLoading: isTestingConnection }] = useTestConfigurationConnectionMutation();
  const [createConfiguration, { isLoading: isCreatingConfiguration }] = useCreateConfigurationMutation();
  const selectedProjectId = useSelectedProjectId();
  const { personal_project_id } = useSelector(state => state.user);
  const [searchParams] = useSearchParams();
  const projectIdFromParams = searchParams.get('project_id');
  const configurationErrorsRef = useRef(configurationErrors);

  useEffect(() => {
    configurationErrorsRef.current = configurationErrors;
  }, [configurationErrors]);

  const projectId = useMemo(() => {
    if (projectIdFromParams) {
      return projectIdFromParams;
    }
    switch (configuration.configuration_title) {
      case Create_Project_Title:
        return selectedProjectId;
      case Create_Personal_Title:
        return personal_project_id;
      case Manual_Title:
        return selectedProjectId;
      default:
        return selectedProjectId;
    }
  }, [configuration.configuration_title, personal_project_id, projectIdFromParams, selectedProjectId]);

  const { configurationKeys, schemaProperties } = useMemo(() => {
    if (!configurationsAsSchema || !type) return [];

    let configurationsSchema = configurationsAsSchema.find(item => item.type === type);

    if (!configurationsSchema) {
      configurationsSchema = configurationsAsSchema.find(item => item.title === type);
    }

    const dataProperties = configurationsSchema?.config_schema?.properties?.data?.properties || {};

    return { configurationKeys: Object.keys(dataProperties), schemaProperties: dataProperties };
  }, [configurationsAsSchema, type]);

  const onTestConnection = useCallback(async () => {
    // For test connection, we only care about critical connection errors, not naming errors
    const connectionCriticalErrors = Object.entries(configurationErrorsRef.current || {}).filter(
      ([key, hasError]) => {
        // Skip configuration name errors for test connection - it's not needed for testing
        if (key === 'configurationName') return false;
        return hasError;
      },
    );

    if (connectionCriticalErrors.length === 0) {
      const requestBody = getRequestBody({
        type,
        configurationKeys,
        settings: settings || {},
        configurationName: configurationName || 'test-connection', // Use a default name for testing
        configurationsAsSchema,
      });

      // For test connection, we only need the 'data' part of the configuration
      const testConnectionBody = { ...requestBody.data };

      // Include access_token for configs that use OAuth (e.g. SharePoint delegated).
      // When oauthTokenKey is provided (credential-scoped: "<uid>:<discovery_endpoint>"), use it
      // to look up the token so each credential's token is stored independently.
      // Otherwise fall back to the raw oauth_discovery_endpoint (legacy / toolkit flows).
      const discoveryEndpoint = settings?.oauth_discovery_endpoint;
      if (discoveryEndpoint) {
        const tokenLookupKey = oauthTokenKey || discoveryEndpoint;
        const token = McpAuthHelpers.getAccessToken(tokenLookupKey);
        if (token) {
          testConnectionBody.access_token = token;
        }
      }

      try {
        const { error, data } = await testConnection({
          projectId: selectedProjectId,
          configType: type,
          body: testConnectionBody,
        });
        if (!error) {
          // Check if response contains discovered tools (MCP tool discovery)
          if (data?.tools && Array.isArray(data.tools)) {
            toastSuccess(`Discovered ${data.tools.length} tools`);
            onToolsDiscovered?.(data.tools);
          } else {
            toastSuccess('The connection is OK!');
          }
        } else {
          // Config OAuth: backend returned requires_authorization (401) with auth_metadata
          if (error?.data?.requires_authorization === true && error?.data?.auth_metadata) {
            // Pass discoveryEndpoint as the display URL and oauthTokenKey as the
            // credential-scoped storage key so the modal shows a human-readable URL
            // but stores the token under the per-credential key.
            onConfigAuthRequired?.(error.data, discoveryEndpoint, oauthTokenKey);
            return;
          }

          const { newErrors } = CredentialErrorHelpers.extractInformationFromCredentialError({
            error,
            schemaProperties,
            settings,
          });

          if (Object.keys(newErrors).length > 0) {
            setValidationErrorMessages?.(newErrors);
            setShowValidation?.(true);
            setTestConnectionError?.('');
          } else {
            setTestConnectionError?.(buildErrorMessage(error));
          }
        }
      } catch (err) {
        toastError('Failed to test connection: ' + err.message);
      }
    } else {
      setShowConfigurationValidateError(true);
      toastError('Please fix the configuration errors before testing connection');
    }
  }, [
    testConnection,
    selectedProjectId,
    type,
    configurationKeys,
    settings,
    configurationName,
    configurationsAsSchema,
    toastSuccess,
    toastError,
    setShowConfigurationValidateError,
    setValidationErrorMessages,
    schemaProperties,
    setShowValidation,
    setTestConnectionError,
    onToolsDiscovered,
    onConfigAuthRequired,
    oauthTokenKey,
  ]);

  const onCreateConfiguration = useCallback(async () => {
    setShowConfigurationValidateError(true);

    const relevantErrors = Object.entries(configurationErrorsRef.current || {}).filter(([key, hasError]) => {
      if (!hasError) return false; // No error, skip

      let configurationsSchema = configurationsAsSchema?.find(item => item.type === type);
      if (!configurationsSchema) {
        configurationsSchema = configurationsAsSchema?.find(item => item.title === type);
      }

      const dataProperties = configurationsSchema?.config_schema?.properties?.data?.properties || {};
      const fieldSchema = dataProperties[key];

      return fieldSchema?.type !== 'boolean';
    });

    if (relevantErrors.length === 0) {
      const { error, data } = await createConfiguration({
        projectId,
        body: getRequestBody({
          type,
          configurationKeys,
          settings: settings || {},
          configurationName,
          configurationsAsSchema,
        }),
      });
      if (!error) {
        toastSuccess('The configuration has been saved!');
        await onSaveConfiguration(data);
        return true;
      } else {
        toastError(buildErrorMessage(error));
        return false;
      }
    }
    return false;
  }, [
    setShowConfigurationValidateError,
    createConfiguration,
    type,
    configurationKeys,
    settings,
    projectId,
    configurationName,
    configurationsAsSchema,
    toastSuccess,
    onSaveConfiguration,
    toastError,
  ]);

  return {
    onCreateConfiguration,
    onTestConnection,
    isCreatingConfiguration,
    isTestingConnection,
  };
}
