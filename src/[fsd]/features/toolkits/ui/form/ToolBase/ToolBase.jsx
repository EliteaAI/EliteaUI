import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, useTheme } from '@mui/material';

import { McpAuthStatus } from '@/[fsd]/features/mcp';
import { OpenApiOAuthStatus } from '@/[fsd]/features/openapi/ui';
import { SharepointOAuthStatus } from '@/[fsd]/features/sharepoint';
import { ToolBaseHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import {
  useCollapsedSection,
  useExpandOnAttention,
  useSectionExpansion,
} from '@/[fsd]/features/toolkits/lib/hooks';
import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { AccordionConstants, TourTargetConstants } from '@/[fsd]/shared/lib/constants';
import { useIsMcpVisible } from '@/[fsd]/shared/lib/hooks';
import { useSystemSenderName } from '@/[fsd]/shared/lib/hooks/useEnvironmentSettingByKey.hooks';
import { Button, Switch } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import {
  convertToValidEliteaTitle,
  getEliteATitleValidationError,
  isValidEliteATitle,
} from '@/common/configrationTitleUtils';
import { MAX_NAME_LENGTH } from '@/common/constants';
import { getPropValue } from '@/common/getToolInitialValueBySchema';
import { useToolkitView } from '@/hooks/toolkit/useToolkitView.js';
import useToolkitConfigurationProperties from '@/hooks/useToolkitConfigurationProperties';

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
    advancedFields = [],
    onCredentialReload,
    configurationSection,
    toolsSection,
  } = props;
  const {
    name = '',
    toolkit_name: toolkitName = '',
    description = '',
    settings = {},
    enableEditEliteaTitle = false,
    meta,
  } = editToolDetail;
  // console.log('toolErrors', toolErrors);
  const theme = useTheme();
  const systemSenderName = useSystemSenderName();
  const [, setNotSelectedFields] = useState([]);
  const [showDisabledConfigFields, setShowDisabledConfigFields] = useState(false);
  const { shouldUseAccordionView, shouldHideConfigurationHeader } = useToolkitView();
  const styles = toolBaseStyles(shouldHideConfigurationHeader);
  const { sections, sectionProps } = useToolkitConfigurationProperties({ toolType: editToolDetail?.type });

  // Get platform settings to check if MCP exposure is enabled
  const isMcpExposureEnabled = useIsMcpVisible();

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
      enableEditEliteaTitle,
    );
    setToolErrors(prev => {
      const merged = { ...prev };
      Object.entries(requiredPropertiesError).forEach(([key, value]) => {
        if (value === false || typeof prev[key] !== 'string') {
          merged[key] = value;
        }
      });
      return merged;
    });
  }, [
    schema?.required,
    settings,
    name,
    setToolErrors,
    editToolDetail.type,
    sections,
    schema,
    enableEditEliteaTitle,
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
    if (enableEditEliteaTitle && settings.elitea_title && !isValidEliteATitle(settings.elitea_title)) {
      setToolErrors(prev => ({
        ...prev,
        elitea_title: getEliteATitleValidationError(settings.elitea_title, systemSenderName), // Clear error if elitea_title is valid
      }));
    }
  }, [settings.elitea_title, setToolErrors, enableEditEliteaTitle, systemSenderName]);

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
      const convertedEliteATitle = convertToValidEliteaTitle(processedValue);
      if (settings.elitea_title !== convertedEliteATitle) {
        editField('settings.elitea_title', convertedEliteATitle);
      }
    } else if (field === 'settings.elitea_title') {
      editField('settings.elitea_title', processedValue?.substring(0, MAX_NAME_LENGTH).toLowerCase() || '');
    }
    if ((field === 'settings.elitea_title' || field === 'title') && setConfigurationName) {
      setConfigurationName(processedValue);
    }
  };

  const shouldCollapseConfiguration =
    shouldUseAccordionView && !showOnlyConfigurationFields && !showOnlyRequiredFields;

  const isPinnedCredential = useCallback(
    key => shouldCollapseConfiguration && schema?.properties?.[key]?.type === 'configuration',
    [shouldCollapseConfiguration, schema],
  );

  const collapsedPropertyKeys = useMemo(
    () =>
      Object.keys(schema?.properties || {}).filter(
        key => key !== 'selected_tools' && !isPinnedCredential(key) && !excludedFields?.includes(key),
      ),
    [schema, isPinnedCredential, excludedFields],
  );

  const isDisabledConfigField = useCallback(
    key =>
      (showDisabledConfigFields && schema?.properties?.[key]?.configuration) ||
      (key === 'elitea_title' && !enableEditEliteaTitle),
    [showDisabledConfigFields, schema, enableEditEliteaTitle],
  );

  const propertiesRevealedByShowMore = useMemo(
    () =>
      collapsedPropertyKeys.filter(
        key =>
          !sectionProps.includes(key) &&
          ToolBaseHelpers.isPropertyVisible({
            propertyKey: key,
            property: schema?.properties?.[key],
            settings,
            required: schema?.required?.includes(key),
            disableConfigFields: isDisabledConfigField(key),
            showOnlyRequiredFields,
          }),
      ),
    [collapsedPropertyKeys, sectionProps, schema, settings, isDisabledConfigField, showOnlyRequiredFields],
  );

  const sectionsRevealedByShowMore = showSections && sectionProps.length > 0;

  const canCollapseConfiguration =
    shouldCollapseConfiguration && (propertiesRevealedByShowMore.length > 0 || sectionsRevealedByShowMore);

  const missingRequiredValues = useMemo(
    () => ToolBaseHelpers.validateRequiredFields(schema, settings, [], enableEditEliteaTitle),
    [schema, settings, enableEditEliteaTitle],
  );

  const needsAttention = useCallback(
    key => missingRequiredValues[key] === true || (showValidation && Boolean(toolErrors[key])),
    [missingRequiredValues, showValidation, toolErrors],
  );

  const collapsedFieldsNeedAttention = useMemo(
    () => shouldCollapseConfiguration && collapsedPropertyKeys.some(needsAttention),
    [shouldCollapseConfiguration, collapsedPropertyKeys, needsAttention],
  );

  const advancedFieldsNeedAttention = useMemo(
    () => advancedFields.some(needsAttention),
    [advancedFields, needsAttention],
  );

  const ownConfigurationSection = useCollapsedSection();
  const activeConfigurationSection = configurationSection ?? ownConfigurationSection;
  const { isExpanded: isConfigurationExpanded, setIsExpanded: setIsConfigurationExpanded } =
    activeConfigurationSection;

  useExpandOnAttention(collapsedFieldsNeedAttention, activeConfigurationSection);

  const { isExpanded: isAdvancedExpanded, toggleExpanded: toggleAdvanced } =
    useSectionExpansion(advancedFieldsNeedAttention);

  const renderConfigurationProperty = (k, v) => (
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
      disableConfigFields={isDisabledConfigField(k)}
      checkboxAsteriskRequired={checkboxAsteriskRequired}
      disabled={disabled && v.type !== 'configuration'}
      validationErrorMessages={validationErrorMessages}
      options={editToolDetail.options?.[k]}
      onCredentialReload={onCredentialReload}
    />
  );

  const credentialProperties = useMemo(
    () =>
      Object.entries(schema?.properties || {}).filter(
        ([k]) =>
          isPinnedCredential(k) &&
          !sectionProps.includes(k) &&
          !excludedFields?.includes(k) &&
          !advancedFields.includes(k),
      ),
    [schema, isPinnedCredential, sectionProps, excludedFields, advancedFields],
  );

  const toolBaseConfiguration = (
    <Box
      sx={styles.configurationContainer}
      data-tour={TourTargetConstants.SHARED_TOUR_TARGET_IDS.configurationForm}
    >
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
            editToolDetail?.settings?.elitea_title || editToolDetail?.settings?.configuration_title || ''
          }
          isMCP={isMCP}
          disabled={disabled}
        />
      )}
      {credentialProperties.map(([k, v]) => renderConfigurationProperty(k, v))}

      {canCollapseConfiguration && !isConfigurationExpanded && (
        <Button.BaseBtn
          variant="text"
          sx={styles.showMore}
          onClick={() => setIsConfigurationExpanded(true)}
          data-testid="toolkit-configuration-show-more"
        >
          Show more
        </Button.BaseBtn>
      )}

      {(!canCollapseConfiguration || isConfigurationExpanded) && (
        <>
          {/* Render priority fields (like 'title') first */}
          {priorityFieldsOrder.map(fieldKey => {
            const propertyEntry = Object.entries(schema?.properties || {}).find(([k]) => k === fieldKey);
            if (!propertyEntry) return null;

            const [k, v] = propertyEntry;

            // Apply the same filtering logic as the main section
            if (
              sectionProps.includes(k) ||
              k === 'selected_tools' ||
              advancedFields.includes(k) ||
              isPinnedCredential(k)
            ) {
              return null;
            }

            return renderConfigurationProperty(k, v);
          })}

          {/* We removed the notification box per user request */}
          {Object.entries(schema?.properties || {})
            .filter(([k]) => {
              // Always exclude fields that are handled by sections and selected_tools
              if (sectionProps.includes(k) || k === 'selected_tools') {
                return false;
              }

              if (isPinnedCredential(k)) {
                return false;
              }

              // Exclude priority fields, bottom fields, excluded fields, and advanced fields
              if (
                priorityFieldsOrder.includes(k) ||
                fieldNeedToRenderAtBottom.includes(k) ||
                excludedFields?.includes(k) ||
                advancedFields.includes(k)
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
            .map(([k, v]) => renderConfigurationProperty(k, v))}

          {advancedFields.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', marginTop: '0.5rem' }}>
              <BasicAccordion
                showMode={AccordionConstants.AccordionShowMode.LeftMode}
                accordionSX={{ background: `${theme.palette.background.tabPanel} !important` }}
                expanded={isAdvancedExpanded}
                onChange={toggleAdvanced}
                items={[
                  {
                    title: 'Advanced Settings',
                    content: (
                      <>
                        {advancedFields
                          .filter(fieldKey => !excludedFields?.includes(fieldKey))
                          .map(fieldKey => {
                            const propertyEntry = Object.entries(schema?.properties || {}).find(
                              ([k]) => k === fieldKey,
                            );

                            if (!propertyEntry) return null;

                            const [k, v] = propertyEntry;

                            if (sectionProps.includes(k) || k === 'selected_tools') return null;

                            return (
                              <ToolkitForm.ToolBaseProperty
                                key={k}
                                k={k}
                                v={v}
                                noAccordionWrapper
                                theme={theme}
                                showValidation={showValidation}
                                toolErrors={toolErrors}
                                setToolErrors={setToolErrors}
                                settings={settings}
                                editField={editField}
                                handleInputChange={handleInputChange}
                                required={schema?.required?.includes(k)}
                                showOnlyRequiredFields={showOnlyRequiredFields}
                                showOnlyConfigurationFields={false}
                                editFieldRootPath={editFieldRootPath}
                                disableConfigFields={isDisabledConfigField(k)}
                                checkboxAsteriskRequired={checkboxAsteriskRequired}
                                disabled={disabled && v.type !== 'configuration'}
                                validationErrorMessages={validationErrorMessages}
                                onCredentialReload={onCredentialReload}
                              />
                            );
                          })}
                      </>
                    ),
                  },
                ]}
              />
            </Box>
          )}

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
                  onCredentialReload={onCredentialReload}
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
              if (sectionProps.includes(k) || k === 'selected_tools' || isPinnedCredential(k)) {
                return null;
              }

              return renderConfigurationProperty(k, v);
            })}
        </>
      )}

      {canCollapseConfiguration && isConfigurationExpanded && (
        <Button.BaseBtn
          variant="text"
          sx={styles.showMore}
          onClick={() => setIsConfigurationExpanded(false)}
          data-testid="toolkit-configuration-show-less"
        >
          Show less
        </Button.BaseBtn>
      )}
    </Box>
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
    const { items, args_schemas, tool_groups } = schema?.properties?.selected_tools || {};
    // Check if args_schemas actually has content (not just empty object)
    const hasArgsSchemas = args_schemas && Object.keys(args_schemas).length > 0;
    const tools =
      (hasArgsSchemas ? Object.keys(args_schemas) : items?.enum) || settings?.available_mcp_tools || [];

    // Check if this is a pre-configured MCP toolkit (type starts with 'mcp_')
    const isPreconfiguredMcp = editToolDetail?.type?.startsWith('mcp_') && editToolDetail?.type !== 'mcp';

    const selectedToolsError =
      typeof toolErrors?.selected_tools === 'string' ? toolErrors.selected_tools : '';

    return (
      <ToolkitForm.ToolActionsSelector
        key={'selected_tools'}
        availableTools={tools ?? []}
        toolGroups={tool_groups}
        toolsSection={toolsSection}
        onChange={value => editField('settings.selected_tools', value)}
        isRemoteMcp={schema.title === 'mcp'}
        isPreconfiguredMcp={isPreconfiguredMcp}
        toolkitType={editToolDetail?.type}
        onToolsFetched={handleToolsFetched}
        selectedToolsError={selectedToolsError}
        extraProperties={
          isMcpExposureEnabled ? (
            <Switch.BaseSwitch
              label="Enable MCP access for selected tools"
              infoTooltip="Exposes the tools selected in this toolkit through the platform MCP server, so external MCP clients can call them."
              value={!!meta?.mcp_options?.available_by_mcp}
              onChange={checked => editField('meta.mcp_options.available_by_mcp', checked)}
              disabled={disabled}
              slotProps={{
                container: { sx: { height: 'auto' } },
                formControlLabel: {
                  labelPlacement: 'start',
                  sx: { width: '100%', justifyContent: 'space-between', marginLeft: 0, marginRight: 0 },
                },
                switch: { slotProps: { input: { 'data-testid': 'toolkit-mcp-access-toggle' } } },
              }}
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

  const isSharepointToolkit = schema?.title === 'sharepoint';
  const isOpenApiToolkit = editToolDetail?.type === 'openapi';

  return (
    <>
      {isAnyMcpType && <McpAuthStatus />}
      {isSharepointToolkit && <SharepointOAuthStatus />}
      {isOpenApiToolkit && showTools && <OpenApiOAuthStatus />}

      {shouldUseAccordionView && !shouldHideConfigurationHeader ? (
        <BasicAccordion
          card
          showMode={AccordionConstants.AccordionShowMode.LeftMode}
          accordionSX={{ background: `${theme.palette.background.tabPanel} !important` }}
          items={[
            {
              title: 'Configuration',
              testId: 'toolkit-configuration-accordion-summary',
              content: toolBaseConfiguration,
            },
          ]}
        />
      ) : (
        toolBaseConfiguration
      )}
      {showTools ? renderTools() : null}
    </>
  );
});

ToolBase.displayName = 'ToolBase';

/** @type {MuiSx} */
const toolBaseStyles = shouldHideConfigurationHeader => ({
  configurationContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    ...(shouldHideConfigurationHeader && { padding: '0.5rem 1rem 0' }),
  },
  showMore: ({ palette }) => ({
    alignSelf: 'flex-start',
    minWidth: 'auto',
    padding: 0,
    marginTop: '0.25rem',
    textTransform: 'none',
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: '1rem',
    color: palette.text.button.showMore,
    '&:hover': {
      background: 'none',
      textDecoration: 'underline',
    },
  }),
});

export default ToolBase;
