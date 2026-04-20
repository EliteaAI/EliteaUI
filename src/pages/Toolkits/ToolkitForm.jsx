import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';

import { Box, CircularProgress } from '@mui/material';

import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import { ToolComponentHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { useGetCurrentToolkitSchemas, useToolkitNameProp } from '@/[fsd]/features/toolkits/lib/hooks';
import { ToolkitForm as GeneralToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { useGetConfigurationsListQuery } from '@/api/configurations.js';
import { useToolkitAvailableToolsQuery, useValidateToolkitQuery } from '@/api/toolkits.js';
import { ToolkitViewOptions } from '@/common/constants';
import { convertToolkitSchema } from '@/common/toolkitSchemaUtils';
import { updateObjectByPath } from '@/common/utils.jsx';
import { FormViewToggle } from '@/components/FormViewToggle';
import useCreateConfiguration from '@/hooks/application/useCreateConfiguration';
import { useToolkitView } from '@/hooks/toolkit/useToolkitView.js';
import { Create_Personal_Title, Create_Project_Title } from '@/hooks/useConfigurations';
import useGetCurrentConfigurationAsSchemas from '@/hooks/useGetCurrentConfigurationAsSchemas';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { CONFIGURATION_VIEW_OPTIONS } from '@/pages/Applications/Components/Tools/ToolConfigurationForm.jsx';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';
import ToolkitsOperationButtons from '@/pages/Toolkits/ToolkitsOperationButtons.jsx';

export const ToolkitForm = memo(props => {
  const {
    editToolDetail,
    onChangeToolDetail,
    isEditing,
    isToolDirty,
    hasNotSavedCredentials,
    isViewToggleVisible = true,
    configurationViewOptions = CONFIGURATION_VIEW_OPTIONS.ConfigurationSelect,
    hideConfigurationNameInput = false,
    showOnlyRequiredFields = false,
    showOnlyConfigurationFields = false,
    showNameFieldForcedly = false,
    showToolkitIcon = false,
    hideNameDescriptionInput = false,
    hideNameInput = false,
    hideOperationButtons = false,
    updateKey,
    sx,
    isMCP,
    onValidationStateChange,
    disabled,
    onSyntaxError,
    validationTrigger,
    revertCredentialsRef,
  } = props;
  const hasSetViewManually = useRef(false);
  const [view, setView] = useState(ToolkitViewOptions.Form);
  const { configurationsAsSchema } = useGetCurrentConfigurationAsSchemas();
  const { values, initialValues, setFieldValue } = useFormikContext();
  const { toolkitType } = useParams();
  const [searchParams] = useSearchParams();
  const [showValidation, setShowValidation] = useState(false);
  const [toolErrors, setToolErrors] = useState({});
  const [configurationErrors, setConfigurationErrors] = useState({});
  const [showConfigurationValidateError, setShowConfigurationValidateError] = useState(false);
  const [configurationName, setConfigurationName] = useState('');
  const [configuration, setConfiguration] = useState({
    elitea_title: editToolDetail?.settings?.elitea_title || '',
    private: editToolDetail?.settings?.private,
  });

  const { setSaveActionParam } = useToolkitView();

  const { personal_project_id } = useSelector(state => state.user);
  const onChangeView = useCallback(newView => {
    setView(newView);
    hasSetViewManually.current = true;
  }, []);
  //@todo: consider to remove this function and dependencies since we do not have GoBack functionality similar to old Tools
  const handleGoBack = useCallback(
    async (option = {}) => {
      const { saveChanges = true, deleteIt, onlySave, needSaveAgent } = option;
      // eslint-disable-next-line no-unused-vars
      const { index, schema, ...toolDetail } = editToolDetail;
      //@todo: action: when you click on Save
      if (saveChanges) {
        Object.keys(toolDetail).forEach(async key => {
          await setFieldValue(key, toolDetail[key]);
        });

        setSaveActionParam();

        if (onlySave) {
          return;
        }
        //@todo: action: when you click on Save -> Delete
      } else if (deleteIt) {
        //@todo: need to be checked
        const result = [...(values?.version_details?.tools || [])];
        result.splice(index, 1);
        await setFieldValue(`version_details.tools`, []);
      }
      if (onlySave || needSaveAgent) {
        return;
      }

      // @todo: need to handle discard changes properly when click on popup warning window
      // onChangeToolDetail(null)
    },
    [editToolDetail, setFieldValue, values?.version_details?.tools, setSaveActionParam],
  );
  // }, [editToolDetail, onChangeToolDetail, setFieldValue, values]);

  const toolType = useMemo(() => {
    return editToolDetail?.type || '';
  }, [editToolDetail?.type]);

  const { toolkitSchemas, isFetching } = useGetCurrentToolkitSchemas({
    isMCP: isMCP && toolType !== 'mcp',
  });

  const toolSchema = useMemo(() => {
    return editToolDetail?.schema || convertToolkitSchema(toolkitSchemas?.[toolType]);
  }, [editToolDetail?.schema, toolkitSchemas, toolType]);

  const currentToolkitId = editToolDetail?.id;

  const selectedToolsSchema = useMemo(() => {
    return toolSchema?.properties?.selected_tools;
  }, [toolSchema?.properties?.selected_tools]);

  const selectedProjectId = useSelectedProjectId();

  const shouldFetchDynamicSchemas = useMemo(() => {
    if (!selectedProjectId || !currentToolkitId) return false;
    const argsSchemasKeys = Object.keys(selectedToolsSchema?.args_schemas || {});
    const enumItems = selectedToolsSchema?.items?.enum || [];
    if (argsSchemasKeys.length) return false;
    if (Array.isArray(enumItems) && enumItems.length) return false;
    return true;
  }, [
    currentToolkitId,
    selectedProjectId,
    selectedToolsSchema?.args_schemas,
    selectedToolsSchema?.items?.enum,
  ]);

  const { data: toolkitAvailableToolsData } = useToolkitAvailableToolsQuery(
    { projectId: selectedProjectId, toolkitId: currentToolkitId },
    { skip: !shouldFetchDynamicSchemas },
  );

  const toolSchemaWithDynamicTools = useMemo(() => {
    if (!toolSchema) return toolSchema;
    if (!toolkitAvailableToolsData) return toolSchema;

    const dynamicToolNames = (toolkitAvailableToolsData.tools || [])
      .map(t => t?.name)
      .filter(name => typeof name === 'string' && name.trim());

    if (!dynamicToolNames.length) return toolSchema;

    return {
      ...toolSchema,
      properties: {
        ...(toolSchema.properties || {}),
        selected_tools: {
          ...(toolSchema.properties?.selected_tools || {}),
          args_schemas: toolkitAvailableToolsData.args_schemas || {},
          items: {
            ...(toolSchema.properties?.selected_tools?.items || {}),
            enum: dynamicToolNames,
          },
        },
      },
    };
  }, [toolSchema, toolkitAvailableToolsData]);

  const effectiveToolSchema = toolSchemaWithDynamicTools || toolSchema;

  const configurationSchema = useMemo(() => {
    return undefined; //TODO Hawk: need to implement configuration schema
  }, []);
  const ToolComponent = useMemo(() => {
    if (searchParams.get('forceCustom') === 'true' || view === ToolkitViewOptions.Json) {
      return GeneralToolkitForm.ToolCustom;
    }
    const toolTypedComponent = ToolComponentHelpers.getToolComponent(toolType, effectiveToolSchema);
    return toolTypedComponent;
  }, [effectiveToolSchema, searchParams, view, toolType]);

  // Add logic to determine if we should show disabled configuration fields
  // Fetch configurations list using new API
  const { data: configurationsList = { items: [], total: 0 }, refetch } = useGetConfigurationsListQuery(
    { projectId: selectedProjectId, section: 'credentials' },
    { skip: !selectedProjectId },
  );
  const integrations = configurationsList.items;

  // Determine the toolkit type suffix for configuration detection
  const toolkitTypeSuffix = useMemo(() => {
    // Otherwise use the toolkit type
    return toolType;
  }, [toolType]);

  // Check if this toolkit type is supported by configuration integration
  const supportsConfiguration = useMemo(() => {
    return integrations.some(integration => integration === 'integration_' + toolkitTypeSuffix);
  }, [integrations, toolkitTypeSuffix]);

  // Check if this is an old toolkit that should show disabled configuration fields
  const shouldShowDisabledConfigFields = useMemo(() => {
    // First check if we're in CREATE mode - if so, never show disabled fields
    const configurationTitle = configuration?.elitea_title || '';
    const isCreateMode =
      configurationTitle === Create_Personal_Title ||
      configurationTitle === Create_Project_Title ||
      !isEditing;

    if (isCreateMode) {
      return false;
    }

    // Check if elitea_title doesn't exist or has no value, and toolkit type supports configuration
    const configTitleHasValue = configurationTitle && configurationTitle !== '';
    const shouldDisable = !configTitleHasValue && supportsConfiguration;

    return shouldDisable;
  }, [configuration?.elitea_title, isEditing, supportsConfiguration]);

  const { nameIsRequired } = useToolkitNameProp(toolType);

  const computedNameError = nameIsRequired && !editToolDetail.name?.trim();

  const mergedToolErrors = useMemo(
    () => ({
      ...toolErrors,
      name: computedNameError,
    }),
    [toolErrors, computedNameError],
  );

  const hasErrors = useMemo(() => !!Object.values(mergedToolErrors).some(i => i), [mergedToolErrors]);

  // Expose validation state and trigger to parent component
  const triggerValidation = useCallback(() => {
    setShowValidation(true);
  }, []);

  useEffect(() => {
    if (onValidationStateChange) {
      onValidationStateChange({
        hasErrors,
        triggerValidation,
      });
    }
  }, [hasErrors, triggerValidation, onValidationStateChange]);

  const editField = useCallback(
    async (field, value, replace) => {
      if (field === 'name' || field === 'description' || toolType === 'custom') {
        setFieldValue(field, value);
      }
      if (toolType === 'mcp' && field === 'settings.scopes') {
        McpAuthHelpers.logout(values?.settings?.url);
      }
      onChangeToolDetail(prevState => updateObjectByPath(prevState, field, value, replace));
    },
    [onChangeToolDetail, setFieldValue, toolType, values?.settings?.url],
  );

  const isValidSchema = useMemo(
    () => Object.keys(effectiveToolSchema || {}).length > 0,
    [effectiveToolSchema],
  );
  useEffect(() => {
    if (!isValidSchema) {
      setView(prev => (prev !== ToolkitViewOptions.Json ? ToolkitViewOptions.Json : prev));
    } else if (!hasSetViewManually.current) {
      setView(ToolkitViewOptions.Form);
    }
  }, [isValidSchema, toolType]);
  /**
   * This hook support Formik updates based on editToolDetails
   *
   * It observes fields in:
   * - editToolDetail (fields: name, description)
   * - editToolDetail?.settings
   *
   * Uses a ref for current values to avoid circular dependency:
   * - Without ref: setFieldValue → values.settings changes → effect runs → setFieldValue → infinite loop
   * - Object values always have different references after Formik deep-clones them, so reference
   *   equality check !== would always be true without JSON.stringify deep comparison
   */
  const currentValuesRef = useRef(values);
  useEffect(() => {
    currentValuesRef.current = values;
  });

  useEffect(() => {
    const currentValues = currentValuesRef.current;
    Object.keys(editToolDetail?.settings || {}).forEach(async key => {
      const currentVal = currentValues?.settings?.[key];
      const newVal = editToolDetail?.settings?.[key];
      if (JSON.stringify(currentVal) !== JSON.stringify(newVal)) {
        await setFieldValue(`settings.${key}`, newVal); // Recursive updates
      }
    });
    Object.keys(editToolDetail?.meta?.mcp_options || {}).forEach(async key => {
      const currentVal = currentValues?.meta?.mcp_options?.[key];
      const newVal = editToolDetail?.meta?.mcp_options?.[key];
      if (JSON.stringify(currentVal) !== JSON.stringify(newVal)) {
        await setFieldValue(`meta.mcp_options.${key}`, newVal); // Recursive updates
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editToolDetail]);

  useEffect(() => {
    const setToolkitType = async () => {
      if (values?.type !== toolkitType && !values?.type && toolkitType) {
        await setFieldValue('type', toolkitType);
      }
    };

    setToolkitType();
  }, [toolkitType, values?.type, setFieldValue]);

  const onSaveConfiguration = useCallback(
    async config => {
      setConfiguration({
        elitea_title: config?.settings?.elitea_title || config?.title || config?.settings?.title,
        private: config?.project_id == personal_project_id,
      });

      if (config?.title || config?.settings?.title) {
        await editField('settings', {
          ...(editToolDetail?.settings || {}),
          elitea_title: config?.settings?.elitea_title || config?.title || config?.settings?.title,
          private: config?.project_id == personal_project_id,
        });
      }

      try {
        await refetch();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to refetch configurations:', error);
      }
    },
    [editField, editToolDetail?.settings, personal_project_id, refetch],
  );
  // Use tool type directly for configuration type
  const configurationType = useMemo(() => {
    return editToolDetail?.type;
  }, [editToolDetail?.type]);

  const { onCreateConfiguration, onTestConnection, isCreatingConfiguration, isTestingConnection } =
    useCreateConfiguration({
      type: configurationType,
      configuration,
      configurationName,
      settings: editToolDetail?.settings,
      onSaveConfiguration,
      setShowConfigurationValidateError,
      configurationErrors,
      configurationsAsSchema,
    });

  const onRevertCredentials = useCallback(() => {
    const initialSettings = initialValues?.settings || {};
    const currentSettings = editToolDetail?.settings || {};

    // Revert only credentials that changed from team to private (matching the warning condition)
    Object.keys(currentSettings).forEach(key => {
      const curr = currentSettings[key];
      const orig = initialSettings[key];

      // Only revert if this is a credential that was changed from team to private
      if (typeof curr === 'object' && curr && 'elitea_title' in curr) {
        if (curr.private !== orig?.private || curr.elitea_title !== orig?.elitea_title) {
          // Revert to original team credential
          editField(`settings.${key}`, orig);
        }
      }
    });

    // Update configuration state to match initial values
    setConfiguration({
      elitea_title: initialSettings?.elitea_title || '',
      private: initialSettings?.private,
    });
  }, [initialValues?.settings, editToolDetail?.settings, editField]);

  // Expose onRevertCredentials to parent via ref (for ToolkitEditor)
  useEffect(() => {
    if (revertCredentialsRef) {
      revertCredentialsRef.current = onRevertCredentials;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRevertCredentials]);

  useEffect(() => {
    if (
      configuration?.elitea_title !== Create_Personal_Title &&
      configuration?.elitea_title !== Create_Project_Title
    ) {
      setShowConfigurationValidateError(false);
    }
  }, [configuration?.elitea_title]);

  useEffect(() => {
    setShowValidation(false);
    setToolErrors({});
    setConfigurationErrors({});
    setConfigurationName('');
    setConfiguration({
      elitea_title: editToolDetail?.settings?.elitea_title || '',
      private: editToolDetail?.settings?.private || false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateKey]);

  const { error, isError } = useValidateToolkitQuery(
    {
      toolkitId: editToolDetail?.id,
      projectId: selectedProjectId,
    },
    { skip: !editToolDetail?.id || !selectedProjectId || !isEditing },
  );

  useEffect(() => {
    if (isError) {
      const validationErrors =
        error.data?.settings_errors?.reduce((acc, curr) => {
          acc[curr.loc[1]] = curr.message;
          return acc;
        }, {}) || {};
      if (Object.keys(validationErrors).length > 0) {
        setToolErrors(prevState => ({
          ...prevState,
          ...validationErrors,
        }));
        setShowValidation(true);
      }
    }
  }, [error, isError]);

  const styles = toolkitFormStyles();

  return isFetching || editToolDetail?.isLoadingConfigurations ? (
    <CircularProgress size={20} />
  ) : (
    <Box sx={[styles.container, sx]}>
      {editToolDetail.type !== ToolTypes.custom.value && !!effectiveToolSchema && isViewToggleVisible && (
        <FormViewToggle
          containerSX={styles.formViewToggle}
          view={view}
          onChangeView={onChangeView}
          disabled={!isValidSchema}
        />
      )}
      {!hideOperationButtons && (
        <ToolkitsOperationButtons
          editToolDetail={editToolDetail}
          isAdding={!isEditing}
          isDirty={isToolDirty}
          handleGoBack={handleGoBack}
          setShowValidation={setShowValidation}
          hasErrors={hasErrors}
          // hasNotSavedToolConfiguration={hasNotSavedToolConfiguration}
          hasNotSavedToolConfiguration={hasNotSavedCredentials}
          type={editToolDetail.type}
          configuration={configuration}
          isCreatingConfiguration={isCreatingConfiguration}
          isTestingConnection={isTestingConnection}
          onCreateConfiguration={onCreateConfiguration}
          onTestConnection={onTestConnection}
          onRevertCredentials={onRevertCredentials}
          view={view}
          onChangeView={setView}
          hideViewToggle={!effectiveToolSchema}
          toolSchema={effectiveToolSchema}
        />
      )}
      <ToolComponent
        key={updateKey}
        editToolDetail={editToolDetail}
        // editToolDetail={values}
        setEditToolDetail={onChangeToolDetail}
        editField={editField}
        toolErrors={mergedToolErrors}
        setToolErrors={setToolErrors}
        showValidation={showValidation || validationTrigger}
        configurationErrors={configurationErrors}
        setConfigurationErrors={setConfigurationErrors}
        showConfigurationValidateError={showConfigurationValidateError}
        setShowConfigurationValidateError={setShowConfigurationValidateError}
        configurationName={configurationName}
        setConfigurationName={setConfigurationName}
        configuration={configuration}
        setConfiguration={setConfiguration}
        schema={effectiveToolSchema}
        configurationSchema={configurationSchema}
        configurationViewOptions={configurationViewOptions}
        hideConfigurationNameInput={hideConfigurationNameInput}
        showOnlyRequiredFields={showOnlyRequiredFields}
        showOnlyConfigurationFields={showOnlyConfigurationFields}
        showNameFieldForcedly={showNameFieldForcedly}
        showToolkitIcon={showToolkitIcon}
        hideNameDescriptionInput={hideNameDescriptionInput}
        hideNameInput={hideNameInput}
        disabledConfigFieldsForOldToolkits={shouldShowDisabledConfigFields}
        shouldInitRequiredFields={false}
        isMCP={isMCP}
        needToCheckSection={false}
        disabled={disabled}
        onSyntaxError={onSyntaxError}
        excludedFields={toolType !== 'mcp' ? [] : ['discovery_mode', 'discovery_interval']}
      />
    </Box>
  );
});

ToolkitForm.displayName = 'ToolkitForm';

export default ToolkitForm;

/** @type {MuiSx} */
const toolkitFormStyles = () => ({
  container: {
    maxHeight: '100%',
    maxWidth: '40.1875rem',
    margin: '0 auto',
    overflow: 'auto',
  },
  formViewToggle: {
    marginBottom: '0.625rem',
  },
});
