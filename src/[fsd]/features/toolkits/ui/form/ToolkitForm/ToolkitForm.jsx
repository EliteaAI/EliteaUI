import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';

import { Box, CircularProgress, Tooltip, Typography } from '@mui/material';

import { McpAuthHelpers, McpPatBanner } from '@/[fsd]/features/mcp';
import { ToolkitFormConstants, ToolkitLayoutConstants } from '@/[fsd]/features/toolkits/lib/constants';
import { ToolComponentHelpers, ToolkitFormHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import {
  useCollapsedSection,
  useGetCurrentToolkitSchemas,
  useToolkitNameProp,
} from '@/[fsd]/features/toolkits/lib/hooks';
import { ToolkitForm as GeneralToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { TourTargetConstants } from '@/[fsd]/shared/lib/constants';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ViewRunHistoryButton from '@/[fsd]/shared/ui/button/ViewRunHistoryButton.jsx';
import { FormViewToggle } from '@/[fsd]/shared/ui/tab-group-button';
import { useGetConfigurationsListQuery } from '@/api/configurations.js';
import { useToolkitAvailableToolsQuery, useValidateToolkitQuery } from '@/api/toolkits.js';
import TestIcon from '@/assets/test.svg?react';
import { ToolkitViewOptions } from '@/common/constants';
import { convertToolkitSchema } from '@/common/toolkitSchemaUtils';
import { updateObjectByPath } from '@/common/utils.jsx';
import useCreateConfiguration from '@/hooks/application/useCreateConfiguration';
import { useIconMetaTooltipType } from '@/hooks/toolkit/useIconMetaTooltipType.js';
import { Create_Personal_Title, Create_Project_Title } from '@/hooks/useConfigurations';
import useGetCurrentConfigurationAsSchemas from '@/hooks/useGetCurrentConfigurationAsSchemas';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { formatTitleFromSnakeCase } from '@/utils/stringUtils';

import ToolkitsOperationButtons from './ToolkitsOperationButtons.jsx';

const { ToolTypes } = ToolkitFormConstants;

export const ToolkitForm = memo(props => {
  const {
    editToolDetail,
    onChangeToolDetail,
    isEditing,
    hasNotSavedCredentials,
    isViewToggleVisible = true,
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
    onClearDiscardErrorsRef,
    hasSidePanel = false,
    handleShowHistory,
    handleShowTest,
    isTestDisabled = false,
  } = props;
  const hasSetViewManually = useRef(false);
  const [view, setView] = useState(ToolkitViewOptions.Form);
  const configurationSection = useCollapsedSection();
  const toolsSection = useCollapsedSection();
  const { configurationsAsSchema } = useGetCurrentConfigurationAsSchemas();
  const { values, initialValues, setFieldValue, resetForm } = useFormikContext();
  const { toolkitType } = useParams();
  const [searchParams] = useSearchParams();
  const [showValidation, setShowValidation] = useState(false);
  const [toolErrors, setToolErrors] = useState({});
  const [serverToolErrors, setServerToolErrors] = useState({});
  const [configurationErrors, setConfigurationErrors] = useState({});
  const [showConfigurationValidateError, setShowConfigurationValidateError] = useState(false);
  const [configurationName, setConfigurationName] = useState('');
  const [configuration, setConfiguration] = useState({
    elitea_title: editToolDetail?.settings?.elitea_title || '',
    private: editToolDetail?.settings?.private,
  });

  const { personal_project_id } = useSelector(state => state.user);
  const onChangeView = useCallback(newView => {
    setView(newView);
    hasSetViewManually.current = true;
  }, []);

  const toolType = useMemo(() => {
    return editToolDetail?.type || '';
  }, [editToolDetail?.type]);

  const { toolkitSchemas, isFetching } = useGetCurrentToolkitSchemas({
    isMCP: isMCP && toolType !== 'mcp',
  });

  const typeIconMeta = useIconMetaTooltipType(toolType, isMCP);

  const toolkitTypeLabel = useMemo(() => {
    const typeSchema = toolkitSchemas?.[toolType];
    return typeSchema?.metadata?.label || typeSchema?.title || formatTitleFromSnakeCase(toolType);
  }, [toolkitSchemas, toolType]);

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
      ...serverToolErrors,
      name: computedNameError,
    }),
    [toolErrors, serverToolErrors, computedNameError],
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
    async (field, value, replace, options) => {
      if (field === 'name' || field === 'description' || toolType === 'custom') {
        setFieldValue(field, value);
      }
      if (toolType === 'mcp' && field === 'settings.scopes') {
        McpAuthHelpers.logout(values?.settings?.url);
      }
      // Clear any existing validation error for this field when user changes its value
      const fieldKey = field.includes('.') ? field.split('.').pop() : field;
      setToolErrors(prev => {
        if (!prev[fieldKey]) return prev;
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
      setServerToolErrors(prev => {
        if (!prev[fieldKey]) return prev;
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
      onChangeToolDetail(prevState => updateObjectByPath(prevState, field, value, replace), options);

      // When auto-selecting (e.g., embedding model fallback), update Formik initial values
      // so the form doesn't appear dirty from the auto-correction
      if (options?.isAutoSelect && options?.section !== 'credentials') {
        const updatedValues = updateObjectByPath({ ...currentValuesRef.current }, field, value);
        resetForm({ values: updatedValues });
      }
    },
    [onChangeToolDetail, setFieldValue, resetForm, toolType, values?.settings?.url],
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

  const { onCreateConfiguration } = useCreateConfiguration({
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

  const onClearDiscardErrors = useCallback(() => {
    setShowValidation(false);
    setToolErrors({});
    setServerToolErrors({});
  }, []);

  // Expose onRevertCredentials to parent via ref (for ToolkitEditor)
  useEffect(() => {
    if (revertCredentialsRef) {
      revertCredentialsRef.current = onRevertCredentials;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRevertCredentials]);

  useEffect(() => {
    if (onClearDiscardErrorsRef) onClearDiscardErrorsRef.current = onClearDiscardErrors;
  }, [onClearDiscardErrors, onClearDiscardErrorsRef]);

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

  const {
    error,
    isError,
    refetch: refetchToolkitValidation,
  } = useValidateToolkitQuery(
    {
      toolkitId: editToolDetail?.id,
      projectId: selectedProjectId,
    },
    { skip: !editToolDetail?.id || !selectedProjectId || !isEditing },
  );

  const onCredentialReload = useCallback(
    ({ notReload, clearValidationError, key, credentialMessage } = {}) => {
      if (!notReload) {
        refetchToolkitValidation();
      } else {
        if (clearValidationError) {
          setServerToolErrors(prev => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            next[key] = undefined; // Clear error for this credential field
            return next;
          });
        } else {
          setServerToolErrors(prev => {
            const next = { ...prev };
            next[key] = credentialMessage; // set error for this credential field
            return next;
          });
        }
      }
    },
    [refetchToolkitValidation],
  );

  useEffect(() => {
    if (!isError) {
      setServerToolErrors({});
      return;
    }

    const validationErrors = ToolkitFormHelpers.parseValidationErrors(error.data?.settings_errors);
    if (Object.keys(validationErrors).length > 0) {
      // Suppress only "Field required" errors for fields that already have a value in the
      // current form state. This handles the race condition where credentials auto-select
      // completes before the validate query response arrives, causing a stale "Field required"
      // error to appear for a field the user has not touched.
      // All other errors (connection failures, credential_not_found, etc.) are always shown.
      const currentSettings = currentValuesRef.current?.settings || {};
      const isFieldEmpty = val => {
        if (val == null) return true;
        if (typeof val === 'object' && !Array.isArray(val)) {
          return (
            Object.keys(val).length === 0 ||
            val.elitea_title == null ||
            String(val.elitea_title).trim() === ''
          );
        }
        return String(val).trim() === '';
      };
      const activeErrors = Object.fromEntries(
        Object.entries(validationErrors).filter(([key, message]) => {
          const isFieldRequired = message.endsWith('Field required');
          return !isFieldRequired || isFieldEmpty(currentSettings[key]);
        }),
      );
      if (Object.keys(activeErrors).length > 0) {
        setServerToolErrors(activeErrors);
        setShowValidation(true);
      }
    }
  }, [error, isError]);

  const isViewTogglePresent =
    editToolDetail.type !== ToolTypes.custom.value && !!effectiveToolSchema && isViewToggleVisible;
  const testEntityLabel = isMCP ? 'Test MCP' : 'Test toolkit';

  const isDetailsActionBar = !!handleShowHistory;
  const isActionBarPresent = isDetailsActionBar || isViewTogglePresent;

  const styles = useMemo(
    () => toolkitFormStyles(isDetailsActionBar, hasSidePanel),
    [isDetailsActionBar, hasSidePanel],
  );

  return isFetching || editToolDetail?.isLoadingConfigurations ? (
    <Box sx={styles.loadingContainer}>
      <CircularProgress />
    </Box>
  ) : (
    <Box sx={[styles.root, sx]}>
      {isActionBarPresent && (
        <Box
          sx={styles.actionBar}
          data-testid="toolkit-action-bar"
        >
          <Box sx={styles.actionBarRow}>
            {isDetailsActionBar && (
              <Box sx={styles.toolkitIdentity}>
                {typeIconMeta?.component}
                <Typography
                  variant="headingSmall"
                  color="text.secondary"
                  data-testid="toolkit-type-label"
                >
                  {toolkitTypeLabel}
                </Typography>
              </Box>
            )}
            <Box sx={styles.actionBarControls}>
              {isDetailsActionBar && handleShowTest && (
                <Tooltip
                  title={isTestDisabled ? 'Save your changes to test' : testEntityLabel}
                  placement="top"
                >
                  <Box component="span">
                    <BaseBtn
                      variant={BUTTON_VARIANTS.iconLabel}
                      size="small"
                      aria-label={testEntityLabel}
                      data-testid="toolkit-test-button"
                      data-tour={TourTargetConstants.SHARED_TOUR_TARGET_IDS.testSettings}
                      disabled={isTestDisabled}
                      onClick={handleShowTest}
                      startIcon={<TestIcon />}
                    >
                      Test
                    </BaseBtn>
                  </Box>
                </Tooltip>
              )}
              {isDetailsActionBar && <ViewRunHistoryButton onShowHistory={handleShowHistory} />}
              {isViewTogglePresent && (
                <FormViewToggle
                  view={view}
                  onChangeView={onChangeView}
                  disabled={!isValidSchema}
                  jsonViewTourTarget={TourTargetConstants.SHARED_TOUR_TARGET_IDS.rawJsonTab}
                />
              )}
            </Box>
          </Box>
        </Box>
      )}
      <Box sx={styles.content}>
        <McpPatBanner
          projectId={selectedProjectId}
          toolkitType={editToolDetail?.type || values?.type || toolkitType}
        />
        {!hideOperationButtons && (
          <ToolkitsOperationButtons
            isAdding={!isEditing}
            setShowValidation={setShowValidation}
            hasErrors={hasErrors}
            hasNotSavedToolConfiguration={hasNotSavedCredentials}
            onCreateConfiguration={onCreateConfiguration}
            onRevertCredentials={onRevertCredentials}
            toolSchema={effectiveToolSchema}
          />
        )}
        <ToolComponent
          key={updateKey}
          editToolDetail={editToolDetail}
          setEditToolDetail={onChangeToolDetail}
          configurationSection={configurationSection}
          toolsSection={toolsSection}
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
          onCredentialReload={onCredentialReload}
        />
      </Box>
    </Box>
  );
});

ToolkitForm.displayName = 'ToolkitForm';

export default ToolkitForm;

const { PANEL_GUTTER, PANEL_HEADER_HEIGHT } = ToolkitLayoutConstants;

const CONTENT_WIDTH = '40.1875rem';
const CONTENT_CAP = `calc(${CONTENT_WIDTH} + 2 * ${PANEL_GUTTER})`;

const formContentColumn = hasSidePanel => ({
  maxWidth: hasSidePanel ? { lg: 'unset', xs: CONTENT_CAP } : CONTENT_CAP,
  margin: hasSidePanel ? { lg: 'unset', xs: '0 auto' } : '0 auto',
});

/** @type {MuiSx} */
const toolkitFormStyles = (isDetailsActionBar, hasSidePanel) => ({
  root: ({ palette }) =>
    isDetailsActionBar
      ? {
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
          background: palette.background.toolkitDetailLeftPanel,
        }
      : {},
  actionBar: ({ palette }) =>
    isDetailsActionBar
      ? {
          flexShrink: 0,
          height: PANEL_HEADER_HEIGHT,
          borderBottom: `0.0625rem solid ${palette.border.table}`,
        }
      : { marginBottom: '0.75rem' },
  actionBarRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    minHeight: '2rem',
    ...(isDetailsActionBar
      ? {
          height: '100%',
          width: '100%',
          padding: `0 ${PANEL_GUTTER}`,
          ...formContentColumn(hasSidePanel),
        }
      : {}),
  },
  content: isDetailsActionBar
    ? {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        width: '100%',
        padding: `1rem ${PANEL_GUTTER}`,
        ...formContentColumn(hasSidePanel),
      }
    : {},
  toolkitIdentity: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    overflow: 'hidden',
    '> svg': {
      flexShrink: 0,
    },
  },
  actionBarControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
});
