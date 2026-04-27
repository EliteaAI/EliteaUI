import { memo, useCallback, useEffect, useState } from 'react';

import { McpAuthStatus } from '@/[fsd]/features/mcp/ui';
import { ToolBaseHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { useSystemSenderName } from '@/[fsd]/shared/lib/hooks/useEnvironmentSettingByKey.hooks';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { useGetPlatformSettingsQuery } from '@/api/platformSettings';
import {
  convertToValidAlitaTitle,
  getAlitaTitleValidationError,
  isValidAlitaTitle,
} from '@/common/configrationTitleUtils';
import { MAX_NAME_LENGTH } from '@/common/constants';
import { getPropValue } from '@/common/getToolInitialValueBySchema';
import { useToolkitView } from '@/hooks/toolkit/useToolkitView.js';
import useToolkitConfigurationProperties from '@/hooks/useToolkitConfigurationProperties';
import { useTheme } from '@emotion/react';

const ToolBase = memo(props => {
  const {
    editToolDetail = {},
    setEditToolDetail = () => {},
    editField = () => {},
    toolErrors = {},
    setToolErrors = () => {},
    showValidation = false,
    schema,
    //Configuration
    setConfigurationName,
    showOnlyRequiredFields = false,
    showOnlyConfigurationFields = false,
    showNameFieldForcedly = false,
    showToolkitIcon = false,
    hideNameDescriptionInput = false,
    hideNameInput = false,
    editFieldRootPath = 'settings',
    disabledConfigFieldsForOldToolkits = false,
    checkboxAsteriskRequired = true,
    priorityFieldsOrder = [],
    fieldNeedToRenderAtBottom = [],
    excludedFields = [],
    shouldInitRequiredFields = true,
    showSections = false,
    isMCP = false,
    showTools = true,
    disabled = false,
    validationErrorMessages = {},
  } = props;
  const {
    name = '',
    toolkit_name: toolkitName = '',
    description = '',
    settings = {},
    enableEditAlitaTitle = false,
    meta,
  } = editToolDetail;
  // console.log('toolErrors', toolErrors);
  const theme = useTheme();
  const systemSenderName = useSystemSenderName();
  const [, setNotSelectedFields] = useState([]);
  const [showDisabledConfigFields, setShowDisabledConfigFields] = useState(false);
  const { shouldUseAccordionView } = useToolkitView();
  const { sections, sectionProps } = useToolkitConfigurationProperties({ toolType: editToolDetail?.type });

  // Get platform settings to check if MCP exposure is enabled
  const { data: platformSettings } = useGetPlatformSettingsQuery();
  const isMcpExposureEnabled = platformSettings?.mcp_exposure_enabled !== false;

  // Check if we need to show disabled configuration fields for old toolkits
  useEffect(() => {
    if (disabledConfigFieldsForOldToolkits) {
      // Always enable showing disabled configuration fields when the flag is on
      setShowDisabledConfigFields(true);
    } else {
      setShowDisabledConfigFields(false);
    }
  }, [disabledConfigFieldsForOldToolkits, showOnlyConfigurationFields]);

  useEffect(() => {
    const requiredPropertiesError = ToolBaseHelpers.validateRequiredFields(
      schema,
      settings,
      sectionProps,
      enableEditAlitaTitle,
    );
    setToolErrors(prev => ({
      ...prev,
      ...requiredPropertiesError,
    }));
  }, [
    schema?.required,
    settings,
    name,
    setToolErrors,
    editToolDetail.type,
    sections,
    schema,
    enableEditAlitaTitle,
    sectionProps,
  ]);

  // Validate integer fields with min/max constraints on initial load (for existing toolkits)
  // This handles the case when an existing toolkit has an empty/undefined/invalid value for
  // fields like "limit" that have exclusiveMinimum or minimum constraints
  useEffect(() => {
    if (!schema?.properties) return;

    const constraintErrors = {};

    Object.entries(schema.properties).forEach(([propertyKey, propertySchema]) => {
      if (!propertySchema || !ToolBaseHelpers.isIntegerType(propertySchema)) return;

      const constraints = ToolBaseHelpers.getIntegerConstraints(propertySchema);
      if (!constraints) return;

      const currentValue = settings[propertyKey];
      const errorMessage = ToolBaseHelpers.validateIntegerConstraints(currentValue, constraints);

      if (errorMessage) {
        constraintErrors[propertyKey] = errorMessage;
      }
    });

    if (Object.keys(constraintErrors).length > 0) {
      setToolErrors(prev => ({
        ...prev,
        ...constraintErrors,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema?.properties]);

  useEffect(() => {
    // If manual configuration is selected, then we should add missing required settings props
    if (shouldInitRequiredFields) {
      // Initialize required fields with default values
      schema?.required?.forEach(async prop => {
        if (settings[prop] === undefined && !sectionProps.find(sectionProp => sectionProp === prop)) {
          editField(
            `settings.${prop}`,
            getPropValue({
              schema,
              name: prop,
              type: schema.properties[prop]?.type,
              format: schema.properties[prop]?.format,
              defaultValue: schema.properties[prop]?.default,
              items: schema.properties[prop]?.items,
              configuration_types: schema.properties[prop]?.configuration_types,
            }),
          );
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (enableEditAlitaTitle && settings.alita_title && !isValidAlitaTitle(settings.alita_title)) {
      setToolErrors(prev => ({
        ...prev,
        alita_title: getAlitaTitleValidationError(settings.alita_title, systemSenderName), // Clear error if alita_title is valid
      }));
    }
  }, [settings.alita_title, setToolErrors, enableEditAlitaTitle, systemSenderName]);

  const handleInputChange = field => event => {
    const initialValue = event.target.value;
    let processedValue = initialValue;
    const propertyKey = field.replace('settings.', '');
    const propertySchema = schema?.properties?.[propertyKey];

    if (propertySchema) {
      if (ToolBaseHelpers.isIntegerType(propertySchema)) {
        processedValue = initialValue.replace(/[^0-9]/g, '');

        const constraints = ToolBaseHelpers.getIntegerConstraints(propertySchema);
        const errorMessage = ToolBaseHelpers.validateIntegerConstraints(processedValue, constraints);

        setToolErrors(prev => ({
          ...prev,
          [propertyKey]: errorMessage || false,
        }));
      }
      const { pattern } = propertySchema;
      if (pattern) {
        const regex = new RegExp(pattern);
        if (processedValue !== '' && !regex.test(processedValue)) {
          return;
        }
      }
    }
    editField(field, processedValue);
    if (field === 'settings.label') {
      const convertedAlitaTitle = convertToValidAlitaTitle(processedValue);
      if (settings.alita_title !== convertedAlitaTitle) {
        editField('settings.alita_title', convertedAlitaTitle);
      }
    } else if (field === 'settings.alita_title') {
      editField('settings.alita_title', processedValue?.substring(0, MAX_NAME_LENGTH).toLowerCase() || '');
    }
    if ((field === 'settings.alita_title' || field === 'title') && setConfigurationName) {
      setConfigurationName(processedValue);
    }
  };

  const toolBaseConfiguration = (
    <>
      {!hideNameDescriptionInput && (
        <ToolkitForm.NameDescriptionInput
          type={editToolDetail?.type || ''}
          name={name}
          toolkitName={toolkitName}
          description={description}
          editField={editField}
          showValidation={showValidation}
          toolErrors={toolErrors}
          showOnlyRequiredFields={showOnlyRequiredFields}
          showOnlyConfigurationFields={showOnlyConfigurationFields}
          showNameFieldForcedly={showNameFieldForcedly}
          showToolkitIcon={showToolkitIcon}
          hideNameInput={hideNameInput}
          configuration_title={
            editToolDetail?.settings?.alita_title || editToolDetail?.settings?.configuration_title || ''
          }
          isMCP={isMCP}
          disabled={disabled}
        />
      )}
      {/* Render priority fields (like 'title') first */}
      {priorityFieldsOrder.map(fieldKey => {
        const propertyEntry = Object.entries(schema?.properties || {}).find(([k]) => k === fieldKey);
        if (!propertyEntry) return null;

        const [k, v] = propertyEntry;

        // Apply the same filtering logic as the main section
        if (sectionProps.includes(k) || k === 'selected_tools') {
          return null;
        }

        return (
          <ToolkitForm.ToolBaseProperty
            key={k}
            k={k}
            v={v}
            theme={theme}
            showValidation={showValidation}
            toolErrors={toolErrors}
            setToolErrors={setToolErrors}
            settings={settings}
            editField={editField}
            handleInputChange={handleInputChange}
            required={
              schema?.required?.includes(k) ||
              (k === 'google_cse_id' && settings?.selected_tools?.includes('google')) ||
              (k === 'google_api_key' && settings?.selected_tools?.includes('google'))
            }
            showOnlyRequiredFields={showOnlyRequiredFields}
            showOnlyConfigurationFields={false}
            editFieldRootPath={editFieldRootPath}
            disableConfigFields={
              (showDisabledConfigFields && v.configuration) || (k === 'alita_title' && !enableEditAlitaTitle)
            }
            checkboxAsteriskRequired={checkboxAsteriskRequired}
            disabled={disabled && v.type !== 'configuration'}
            validationErrorMessages={validationErrorMessages}
            options={editToolDetail.options?.[k]}
          />
        );
      })}

      {/* We removed the notification box per user request */}
      {Object.entries(schema?.properties || {})
        .filter(([k]) => {
          // Always exclude fields that are handled by sections and selected_tools
          if (sectionProps.includes(k) || k === 'selected_tools') {
            return false;
          }

          // Exclude priority fields that were already rendered
          if (
            priorityFieldsOrder.includes(k) ||
            fieldNeedToRenderAtBottom.includes(k) ||
            excludedFields?.includes(k)
          ) {
            return false;
          }

          // If we're showing disabled configuration fields, include both:
          // 1. Configuration fields (will be shown as disabled)
          // 2. Regular fields (will be shown as normal)
          if (showDisabledConfigFields) {
            return true; // Show all fields
          }

          // Otherwise use the normal filtering logic
          return true;
        })
        .map(([k, v]) => {
          return (
            <ToolkitForm.ToolBaseProperty
              key={k}
              k={k}
              v={v}
              theme={theme}
              showValidation={showValidation}
              toolErrors={toolErrors}
              setToolErrors={setToolErrors}
              settings={settings}
              editField={editField}
              handleInputChange={handleInputChange}
              required={
                schema?.required?.includes(k) ||
                (k === 'google_cse_id' && settings?.selected_tools?.includes('google')) ||
                (k === 'google_api_key' && settings?.selected_tools?.includes('google'))
              }
              showOnlyRequiredFields={showOnlyRequiredFields}
              showOnlyConfigurationFields={false}
              editFieldRootPath={editFieldRootPath}
              disableConfigFields={
                (showDisabledConfigFields && v.configuration) ||
                (k === 'alita_title' && !enableEditAlitaTitle)
              }
              checkboxAsteriskRequired={checkboxAsteriskRequired}
              disabled={disabled && v.type !== 'configuration'}
              validationErrorMessages={validationErrorMessages}
              options={editToolDetail.options?.[k]}
            />
          );
        })}

      {showSections &&
        sectionProps.length > 0 &&
        Object.entries(sections).map(([k, v]) => {
          const { required, subsections } = v;
          return (
            <ToolkitForm.ToolSection
              key={k}
              sectionKey={k}
              subsections={subsections}
              required={required}
              schema={schema}
              showValidation={showValidation}
              toolErrors={toolErrors}
              settings={settings}
              editField={editField}
              handleInputChange={handleInputChange}
              setToolErrors={setToolErrors}
              setNotSelectedFields={setNotSelectedFields}
              setEditToolDetail={setEditToolDetail}
              showOnlyConfigurationFields={false} // Don't filter here, let Section handle it
              disableConfigFields={showDisabledConfigFields}
              checkboxAsteriskRequired={checkboxAsteriskRequired}
              disabled={disabled}
              validationErrorMessages={validationErrorMessages}
            />
          );
        })}
      {fieldNeedToRenderAtBottom
        .filter(fieldKey => !excludedFields?.includes(fieldKey))
        .map(fieldKey => {
          const propertyEntry = Object.entries(schema?.properties || {}).find(([k]) => k === fieldKey);
          if (!propertyEntry) return null;

          const [k, v] = propertyEntry;

          // Apply the same filtering logic as the main section
          if (sectionProps.includes(k) || k === 'selected_tools') {
            return null;
          }

          return (
            <ToolkitForm.ToolBaseProperty
              key={k}
              k={k}
              v={v}
              theme={theme}
              showValidation={showValidation}
              toolErrors={toolErrors}
              setToolErrors={setToolErrors}
              settings={settings}
              editField={editField}
              handleInputChange={handleInputChange}
              required={
                schema?.required?.includes(k) ||
                (k === 'google_cse_id' && settings?.selected_tools?.includes('google')) ||
                (k === 'google_api_key' && settings?.selected_tools?.includes('google'))
              }
              showOnlyRequiredFields={showOnlyRequiredFields}
              showOnlyConfigurationFields={false}
              editFieldRootPath={editFieldRootPath}
              disableConfigFields={
                (showDisabledConfigFields && v.configuration) ||
                (k === 'alita_title' && !enableEditAlitaTitle)
              }
              checkboxAsteriskRequired={checkboxAsteriskRequired}
              disabled={disabled && v.type !== 'configuration'}
              validationErrorMessages={validationErrorMessages}
            />
          );
        })}
    </>
  );

  // Handler for when remote MCP tools are fetched
  // tools: array of tool objects with name and description
  // argsSchemas: optional object mapping tool names to their JSON schemas
  const handleToolsFetched = useCallback(
    (tools, argsSchemas) => {
      if (!tools?.length) return;

      // Extract tool names from the fetched tools
      const toolNames = tools.map(tool => tool.name || tool);

      // Update editToolDetail.schema to include the new tools
      setEditToolDetail(prevState => {
        return {
          ...prevState,
          // Auto-select all fetched tools
          settings: {
            ...prevState?.settings,
            selected_tools: toolNames,
            available_mcp_tools: tools.map(tool => {
              const toolName = tool.name || tool;
              // Get schema from: 1) separate argsSchemas object, 2) tool.inputSchema, 3) tool.args_schema
              const toolSchema = argsSchemas?.[toolName] || tool.inputSchema || tool.args_schema || null;
              return {
                label: toolName,
                value: toolName,
                args_schema: toolSchema,
                description: tool.description || '',
              };
            }),
          },
        };
      });
    },
    [setEditToolDetail],
  );

  const renderTools = () => {
    const { items, args_schemas } = schema?.properties?.selected_tools || {};
    // Check if args_schemas actually has content (not just empty object)
    const hasArgsSchemas = args_schemas && Object.keys(args_schemas).length > 0;
    const tools =
      (hasArgsSchemas ? Object.keys(args_schemas) : items?.enum) || settings?.available_mcp_tools || [];

    // Check if this is a pre-configured MCP toolkit (type starts with 'mcp_')
    const isPreconfiguredMcp = editToolDetail?.type?.startsWith('mcp_') && editToolDetail?.type !== 'mcp';

    return (
      <ToolkitForm.ToolActionsSelector
        key={'selected_tools'}
        availableTools={tools ?? []}
        onChange={value => editField('settings.selected_tools', value)}
        isRemoteMcp={schema.title === 'mcp'}
        isPreconfiguredMcp={isPreconfiguredMcp}
        toolkitType={editToolDetail?.type}
        onToolsFetched={handleToolsFetched}
        extraProperties={
          isMcpExposureEnabled ? (
            <ToolkitForm.ToolBaseProperty
              k="available_by_mcp"
              v={{ title: 'Make tools available by MCP', type: 'boolean' }}
              theme={theme}
              showValidation={showValidation}
              toolErrors={toolErrors}
              settings={meta?.mcp_options || {}}
              editField={editField}
              handleInputChange={handleInputChange}
              showOnlyConfigurationFields={showOnlyConfigurationFields}
              editFieldRootPath="meta.mcp_options"
              disabled={disabled}
              validationErrorMessages={validationErrorMessages}
            />
          ) : null
        }
        disabled={disabled}
      />
    );
  };

  // Check if this is any MCP type (remote MCP or pre-built MCP like mcp_github)
  const isAnyMcpType =
    schema?.title === 'mcp' || (editToolDetail?.type?.startsWith('mcp_') && editToolDetail?.type !== 'mcp');

  return (
    <>
      {isAnyMcpType && <McpAuthStatus />}

      {shouldUseAccordionView ? (
        <>
          <BasicAccordion
            // style={style}
            showMode={AccordionConstants.AccordionShowMode.LeftMode}
            accordionSX={{ background: `${theme.palette.background.tabPanel} !important` }}
            items={[
              {
                title: 'Configuration',
                content: toolBaseConfiguration,
              },
            ]}
          />
        </>
      ) : (
        <>{toolBaseConfiguration}</>
      )}
      {showTools ? renderTools() : null}
    </>
  );
});

ToolBase.displayName = 'ToolBase';

export default ToolBase;
