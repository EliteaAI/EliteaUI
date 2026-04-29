import { memo, useCallback, useMemo } from 'react';

import YAML from 'js-yaml';

import { Box, FormControlLabel, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { OpenApiHelpers, ToolBaseHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { ArrayFieldInput } from '@/[fsd]/features/toolkits/ui/form/ToolBase';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { useFieldFocus } from '@/[fsd]/shared/lib/hooks';
import { Checkbox, Field, Input } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { TooltipMarkdownContent } from '@/[fsd]/shared/ui/tooltip';
import { MAX_NAME_LENGTH } from '@/common/constants';
import AgentSelect from '@/components/AgentSelect';
import CredentialsSelect from '@/components/CredentialsSelect';
import EmbeddingModelSelect from '@/components/EmbeddingModelSelect';
import FormInput from '@/components/FormInput.jsx';
import InfoIcon from '@/components/Icons/InfoIcon';
import ImageGenerationModelSelect from '@/components/ImageGenerationModelSelect';
import LlmModelSelect from '@/components/LlmModelSelect';
import SecretManagementInput from '@/components/SecretManagementInput.jsx';
import ToolkitSelect from '@/components/ToolkitSelect';
import { getExtensionsByLang, jsonLinter } from '@/hooks/useCodeMirrorLanguageExtensions';
import { json } from '@codemirror/lang-json';

const ToolBaseProperty = memo(props => {
  const {
    k,
    v,
    theme,
    showValidation,
    toolErrors,
    setToolErrors,
    settings,
    editField,
    handleInputChange,
    required,
    specifiedProjectId,
    editFieldRootPath = 'settings',
    showOnlyRequiredFields = false,
    showOnlyConfigurationFields = false,
    disableConfigFields = false,
    disabled,
    validationErrorMessages,
    options: presetOptions,
    noAccordionWrapper = false,
  } = props;

  const styles = toolBasePropertyStyles(theme);
  const { toggleFieldFocus, isFocused } = useFieldFocus();

  // Extract v properties safely (v may be null/undefined for early return cases)
  const {
    title = '',
    description = '',
    type,
    format,
    secret,
    enum: enumItemsDirect,
    code_language: codeLanguage,
    lines,
    anyOf,
    max_toolkit_length,
    ui_component: uiComponent,
    visible_when: visibleWhen,
    placeholder: schemaPlaceholder,
  } = v || {};

  // Extract enum items - check direct enum first, then look in anyOf
  const enumItems = useMemo(() => {
    if (enumItemsDirect?.length) return enumItemsDirect;
    // For Optional[Literal[...]] in Pydantic v2, enum is nested in anyOf
    const enumFromAnyOf = anyOf?.find(item => item.enum)?.enum;
    return enumFromAnyOf || [];
  }, [enumItemsDirect, anyOf]);

  const label = ToolBaseHelpers.adjustLabel(title || k);

  // For integer fields with constraint errors (like "Value must be greater than 0" or "Field is required"),
  // show the error immediately without waiting for showValidation to be true.
  // This provides better UX for fields with min/max constraints.
  const isIntegerConstraintError = typeof toolErrors[k] === 'string' && toolErrors[k] !== '';

  const toastError =
    isIntegerConstraintError || (showValidation && (toolErrors[k] || validationErrorMessages?.[k]));

  // Use custom error message from toolErrors if it's a string (e.g., "Value must be greater than 0")
  // Otherwise fall back to validationErrorMessages or default "Field is required"
  const errorText =
    (isIntegerConstraintError || (showValidation && (toolErrors[k] || validationErrorMessages?.[k]))) &&
    (typeof toolErrors[k] === 'string' ? toolErrors[k] : validationErrorMessages?.[k] || 'Field is required');

  const buildEditFieldPath = useCallback(
    fieldKey => {
      return editFieldRootPath ? `${editFieldRootPath}.${fieldKey}` : fieldKey;
    },
    [editFieldRootPath],
  );

  const handleObjectFieldChange = useCallback(
    value => {
      const textContent = value.trim();
      if (textContent === '') {
        editField(buildEditFieldPath(k), {});
      } else {
        let parsedValue = {};
        try {
          parsedValue = JSON.parse(textContent);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Invalid JSON:', error);
          parsedValue = {};
        }
        editField(buildEditFieldPath(k), parsedValue, true);
      }
    },
    [k, editField, buildEditFieldPath],
  );

  // Parse OpenAPI spec locally for preview (used by openapi_spec ui_component)
  const parsedOpenAPIActions = useMemo(() => {
    if (uiComponent !== 'openapi_spec') return [];
    const specValue = settings[k];
    if (!specValue) return [];

    try {
      let parsedSpec;
      try {
        parsedSpec = JSON.parse(specValue);
      } catch {
        parsedSpec = YAML.load(specValue);
      }
      if (!parsedSpec || !parsedSpec.paths) return [];
      return OpenApiHelpers.openAPIExtract(parsedSpec);
    } catch {
      return [];
    }
  }, [uiComponent, settings, k]);

  // Handler for toggling tool selection in the table
  const handleToolSelectionChange = useCallback(
    (toolName, enabled) => {
      const currentSelectedTools = settings?.selected_tools || [];
      let newSelectedTools;

      if (enabled) {
        // Add tool if not already selected
        if (!currentSelectedTools.includes(toolName)) {
          newSelectedTools = [...currentSelectedTools, toolName];
        } else {
          newSelectedTools = currentSelectedTools;
        }
      } else {
        // Remove tool from selection
        newSelectedTools = currentSelectedTools.filter(name => name !== toolName);
      }

      editField(buildEditFieldPath('selected_tools'), newSelectedTools);
    },
    [settings?.selected_tools, editField, buildEditFieldPath],
  );

  // Helper to render label with optional info icon tooltip
  const renderLabelWithHint = useCallback(
    (isRequired = false) => {
      if (!description) return label;

      return (
        <>
          {label}
          {isRequired && ' *'}

          <Tooltip
            title={<TooltipMarkdownContent>{description}</TooltipMarkdownContent>}
            placement="top"
          >
            <Box sx={styles.infoIconWrapper}>
              <InfoIcon
                width={19}
                height={19}
              />
            </Box>
          </Tooltip>
        </>
      );
    },
    [description, label, styles.infoIconWrapper],
  );

  // Hide field if it has property hidden === true
  if (v && v.hidden) {
    return null;
  }

  // Hide field based on visible_when condition (e.g., show custom_header_name only when auth_type='custom')
  if (visibleWhen) {
    const { field: conditionField, value: conditionValue } = visibleWhen;
    const currentFieldValue = settings[conditionField];
    // Compare case-insensitively for string values
    const matches =
      typeof currentFieldValue === 'string' && typeof conditionValue === 'string'
        ? currentFieldValue.toLowerCase() === conditionValue.toLowerCase()
        : currentFieldValue === conditionValue;
    if (!matches) {
      return null;
    }
  }

  // For disabled configuration fields mode, handle configuration vs regular fields differently
  if (disableConfigFields) {
    // This is a configuration field being shown as disabled

    // Only show configuration fields that have non-empty values
    const value = settings[k];
    if (k !== 'elitea_title' && (value === null || value === undefined || value === '')) {
      return null;
    }
    // Field has a value and will be shown as disabled
  } else if (showOnlyConfigurationFields && !v?.configuration) {
    // In configuration-only mode, hide non-configuration fields
    return null;
  } else if (showOnlyRequiredFields && !required) {
    // In required-only mode, hide non-required fields
    return null;
  }

  // OpenAPI spec field with schema loader, preview, and actions table
  if (uiComponent === 'openapi_spec') {
    return (
      <>
        <ToolkitForm.OpenAPISchemaInput
          key={k}
          value={settings[k] || ''}
          onValueChange={(schemaText, parsedActions) => {
            // Update the schema field
            editField(buildEditFieldPath(k), schemaText);

            // Update selected_tools when schema changes
            // Keep tools that still exist in the new schema, add new tools
            if (parsedActions?.length > 0) {
              const newToolNames = parsedActions.map(action => action.name).filter(Boolean);
              const currentSelectedTools = settings?.selected_tools || [];

              if (currentSelectedTools.length === 0) {
                // If no tools were selected, auto-select all new tools
                editField(buildEditFieldPath('selected_tools'), newToolNames);
              } else {
                // Filter out tools that no longer exist and keep valid selections
                const validSelectedTools = currentSelectedTools.filter(tool => newToolNames.includes(tool));
                // Add any new tools that weren't in the previous selection
                const newToolsToAdd = newToolNames.filter(tool => !currentSelectedTools.includes(tool));
                const updatedSelection = [...validSelectedTools, ...newToolsToAdd];
                editField(buildEditFieldPath('selected_tools'), updatedSelection);
              }
            }
          }}
          error={!!toastError}
          helperText={errorText}
          setToolErrors={setToolErrors || (() => {})}
          disabled={disableConfigFields || disabled}
        />
        {/* Interactive tools table - enables/disables tools */}
        {parsedOpenAPIActions.length > 0 && (
          <ToolkitForm.OpenAPIActions
            tools={parsedOpenAPIActions}
            selectedTools={settings?.selected_tools || []}
            onSelectionChange={handleToolSelectionChange}
            disabled={disableConfigFields || disabled}
          />
        )}
      </>
    );
  }
  if (k === 'selected_tools') {
    const { items, args_schemas } = v;
    // Check if args_schemas actually has content (not just empty object)
    const hasArgsSchemas = args_schemas && Object.keys(args_schemas).length > 0;
    const tools = hasArgsSchemas ? Object.keys(args_schemas) : items?.enum;
    return (
      <ToolkitForm.ToolActionsSelector
        key={k}
        availableTools={tools}
        onChange={value => editField(buildEditFieldPath('selected_tools'), value)}
        disabled={disableConfigFields || disabled}
      />
    );
  } else if (type === 'array' || (anyOf?.find(item => item.type === 'array') && k === 'scopes')) {
    // Handle array fields (like scopes) - show text input, convert to array on blur
    return (
      <ArrayFieldInput
        k={k}
        settings={settings}
        required={required}
        label={label}
        toastError={toastError}
        errorText={errorText}
        disableConfigFields={disableConfigFields}
        disabled={disabled}
        editField={editField}
        buildEditFieldPath={buildEditFieldPath}
      />
    );
  } else {
    if (ToolBaseHelpers.isSecretField(k, format, secret, v)) {
      // For disabled fields, use standard input without toggler
      if (disableConfigFields || disabled) {
        return (
          <FormInput
            key={k}
            required={required}
            label={label}
            value="********" // Always show masked value for security
            type="text"
            disabled={true}
            inputProps={max_toolkit_length ? { maxLength: max_toolkit_length } : undefined}
          />
        );
      }

      // Otherwise use the standard secret input with toggler
      return (
        <SecretManagementInput
          key={k}
          sx={styles.secretInput}
          authType={k}
          authTypes={[{ label: title, value: k }]}
          editField={editField}
          fieldPath={buildEditFieldPath(k)}
          inputValue={settings[k]}
          error={!!toastError}
          helperText={errorText}
          required={required}
          specifiedProjectId={specifiedProjectId}
          description={description}
        />
      );
    } else if (type === 'object' || anyOf?.find(item => item.type === 'object')) {
      const codeExtensions = [json(), jsonLinter];

      if (noAccordionWrapper) {
        return (
          <Box
            key={k}
            sx={styles.codeBox}
          >
            <Typography
              variant="bodyMedium"
              sx={styles.objectFieldLabel}
            >
              {description ? renderLabelWithHint(required) : label || k || 'Code Editor'}
            </Typography>
            <Field.ResizableCodeMirrorEditor
              expandAction
              value={JSON.stringify(settings[k] || {}, null, 2)}
              extensions={codeExtensions}
              minHeight={100}
              fieldName={title}
              onChange={handleObjectFieldChange}
              readOnly={disableConfigFields || disabled}
            />
          </Box>
        );
      }

      return (
        <Box
          key={k}
          sx={styles.accordionContainer}
        >
          <BasicAccordion
            showMode={AccordionConstants.AccordionShowMode.LeftMode}
            accordionSX={styles.accordionSX}
            summarySX={styles.accordionSummarySX}
            items={[
              {
                title: description ? renderLabelWithHint(required) : label || k || 'Code Editor',
                content: (
                  <Field.ResizableCodeMirrorEditor
                    expandAction
                    value={JSON.stringify(settings[k] || {}, null, 2)}
                    extensions={codeExtensions}
                    minHeight={100}
                    fieldName={title}
                    onChange={handleObjectFieldChange}
                    readOnly={disableConfigFields || disabled}
                  />
                ),
              },
            ]}
          />
        </Box>
      );
    } else if (type === 'boolean' || anyOf?.find(item => item.type === 'boolean')) {
      // Remove required mark for Cloud checkbox if checkboxAsteriskRequired is false
      const isCloudCheckbox = k === 'cloud';
      return (
        <Box
          key={k}
          className="tool-checkbox-field"
          sx={styles.checkboxBox}
        >
          <FormControlLabel
            key={k}
            required={isCloudCheckbox ? false : required}
            sx={styles.formControlLabel}
            control={
              <Checkbox.BaseCheckbox
                checked={!!settings[k]}
                onChange={(_, value) => {
                  editField(buildEditFieldPath(k), value);
                }}
                disabled={disableConfigFields || disabled}
              />
            }
            label={
              <Typography
                variant="bodyMedium"
                sx={styles.checkboxLabel}
              >
                {description ? renderLabelWithHint(false) : label}
              </Typography>
            }
          />
        </Box>
      );
    } else if ((type === 'string' || anyOf?.find(item => item.type === 'string')) && !!enumItems?.length) {
      const options = enumItems.map(item => ({ label: item, value: item }));
      const currentValue = settings[k];
      // Get default value from schema (check direct property and anyOf)
      const schemaDefault = v?.default ?? anyOf?.find(item => item.default !== undefined)?.default;
      // Use current value if valid, otherwise fall back to schema default, then empty string
      const validValue = options.some(opt => opt.value === currentValue)
        ? currentValue
        : options.some(opt => opt.value === schemaDefault)
          ? schemaDefault
          : '';

      return (
        <SingleSelect
          showBorder
          label={description ? renderLabelWithHint(required) : label}
          onValueChange={value => editField(buildEditFieldPath(k), value)}
          value={validValue}
          options={options}
          customSelectedFontSize="0.875rem"
          sx={styles.select}
          disabled={disableConfigFields || disabled}
        />
      );
    } else if (
      (type === 'string' || anyOf?.find(item => item.type === 'string')) &&
      codeLanguage !== undefined
    ) {
      const codeExtensions = getExtensionsByLang(codeLanguage)?.extensionWithLinter || [];
      return (
        <Box
          key={k}
          sx={styles.codeBox}
        >
          <Typography variant="bodyMedium">{label}</Typography>
          <Field.ResizableCodeMirrorEditor
            value={settings[k] || ''}
            extensions={codeExtensions}
            minHeight={100}
            onChange={value => {
              editField(buildEditFieldPath(k), value);
            }}
            readOnly={disableConfigFields || disabled}
          />
        </Box>
      );
    } else if (
      (type === 'string' || anyOf?.find(item => item.type === 'string')) &&
      lines !== undefined &&
      parseInt(lines) > 1
    ) {
      return (
        <FormInput
          key={k}
          required={required}
          label={label}
          value={settings[k]}
          onChange={handleInputChange(buildEditFieldPath(k))}
          error={!!toastError}
          helperText={errorText}
          multiline
          rows={parseInt(lines)}
          disabled={disableConfigFields || disabled}
          inputProps={max_toolkit_length ? { maxLength: max_toolkit_length } : undefined}
          placeholder={schemaPlaceholder}
        />
      );
    } else if (type === 'configuration') {
      return (
        <CredentialsSelect
          isCreationAllowed
          label={label}
          description={v.description}
          onSelectConfiguration={value => editField(buildEditFieldPath(k), value)}
          value={settings[k]}
          configurations={v.options}
          error={!!toastError}
          helperText={errorText}
          required={required}
          type={v.configuration_types?.[0] || ''}
          section={v.section || v.configuration_sections?.[0] || 'credentials'}
          disabled={disabled}
          presetOptions={presetOptions}
        />
      );
    } else if (type === 'llm_model') {
      return (
        <LlmModelSelect
          required={required}
          label={label}
          onSelectModel={value => editField(buildEditFieldPath(k), value)}
          value={settings[k]}
          projectId={specifiedProjectId}
          disabled={disableConfigFields || disabled}
          error={!!toastError}
          helperText={errorText}
        />
      );
    } else if (type === 'embedding_model') {
      return (
        <EmbeddingModelSelect
          showBorder
          label={label}
          onSelectModel={value => editField(buildEditFieldPath(k), value)}
          value={settings[k]}
          projectId={specifiedProjectId}
          disabled={disableConfigFields || disabled}
          description={v.description}
        />
      );
    } else if (type === 'image_generation_model') {
      return (
        <ImageGenerationModelSelect
          showBorder
          label={label}
          onSelectModel={value => editField(buildEditFieldPath(k), value)}
          value={settings[k]}
          projectId={specifiedProjectId}
          disabled={disableConfigFields || disabled}
        />
      );
    } else if (type === 'toolkit_reference') {
      return (
        <ToolkitSelect
          label={label}
          onSelectToolkit={value => editField(buildEditFieldPath(k), value)}
          value={settings[k]}
          required={required}
          error={!!toastError}
          helperText={errorText}
          disabled={disableConfigFields || disabled}
          multiple={v.originalType === 'array'}
          filters={v.toolkit_filter}
        />
      );
    } else if (type === 'agent_reference') {
      return (
        <AgentSelect
          showBorder
          label={label}
          onSelectAgent={value => editField(buildEditFieldPath(k), value)}
          value={settings[k]}
          required={required}
          error={!!toastError}
          helperText={errorText}
          disabled={disableConfigFields || disabled}
          multiple={v.originalType === 'array'}
          filters={v.agent_filter}
        />
      );
    } else if (type === 'pipeline_reference') {
      return (
        <AgentSelect
          showBorder
          label={label}
          type="pipeline"
          onSelectAgent={value => editField(buildEditFieldPath(k), value)}
          value={settings[k]}
          required={required}
          error={!!toastError}
          helperText={errorText}
          disabled={disableConfigFields || disabled}
          multiple={v.originalType === 'array'}
          filters={v.pipeline_filter}
        />
      );
    } else {
      const isInteger = type === 'integer' || anyOf?.some(item => item.type === 'integer');
      const maxLength = k === 'label' ? MAX_NAME_LENGTH : max_toolkit_length;
      const inputProps = maxLength ? { maxLength } : undefined;

      // Get placeholder - use schema placeholder if provided, or default value for integer fields
      // Check both direct property and anyOf (for Optional[int] types)
      const defaultValue = v?.default ?? anyOf?.find(item => item.default !== undefined)?.default;
      const placeholder =
        schemaPlaceholder || (isInteger && defaultValue !== undefined ? String(defaultValue) : undefined);

      return (
        <Box sx={styles.nameInputContainer}>
          <Input.StyledInputEnhancer
            key={k}
            required={required}
            label={label}
            tooltipDescription={description}
            value={settings[k] ?? ''}
            onChange={handleInputChange(buildEditFieldPath(k))}
            error={!!toastError}
            helperText={errorText}
            type={isInteger ? 'tel' : undefined}
            disabled={disableConfigFields || disabled}
            inputProps={inputProps}
            placeholder={placeholder}
            onFocus={() => toggleFieldFocus(k)}
            onBlur={() => toggleFieldFocus(null)}
          />
          {isFocused('label') && MAX_NAME_LENGTH === settings[k]?.length && (
            <Typography
              variant="bodySmall"
              sx={styles.nameLengthMessage}
            >
              {`0 is left from ${MAX_NAME_LENGTH} characters left`}
            </Typography>
          )}
        </Box>
      );
    }
  }
});

ToolBaseProperty.displayName = 'ToolBaseProperty';

/** @type {MuiSx} */
const toolBasePropertyStyles = theme => ({
  secretInput: {
    marginTop: 0,
  },
  codeBox: {
    padding: '0 0.75rem',
    marginTop: '1rem',
  },
  checkboxBox: {
    marginTop: 0,
    '&:not(.tool-checkbox-field + &)': {
      marginTop: '0.75rem',
    },
    '&:not(:has(+ .tool-checkbox-field))': {
      marginBottom: '0.75rem',
    },
  },
  formControlLabel: {
    height: '2rem',
    marginLeft: 0,
  },
  select: {
    marginTop: '0.5rem',
  },
  nameInputContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  nameLengthMessage: {
    textAlign: 'right',
    fontSize: '0.625rem',
    position: 'absolute',
    right: '0',
    bottom: '2.75rem',
  },
  infoIconWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    marginLeft: '0.25rem',
    verticalAlign: 'middle',
    marginBottom: '0.35rem',

    '&:hover': {
      opacity: 0.8,
    },
  },
  accordionContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '0.5rem',
  },
  accordionSX: {
    background: `${theme.palette.background.tabPanel} !important`,
  },
  accordionSummarySX: {
    '& .MuiAccordionSummary-content': { alignItems: 'center', paddingRight: 0 },
    paddingRight: '0 !important',
  },
  checkboxLabel: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  objectFieldLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
});

export default ToolBaseProperty;
