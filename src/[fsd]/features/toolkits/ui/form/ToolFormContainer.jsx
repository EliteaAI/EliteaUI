import { memo, useMemo } from 'react';

import { Field } from '@/[fsd]/shared/ui';

const ToolFormContainer = memo(props => {
  const {
    fieldKey,
    property,
    toolInputVariables,
    schema,
    onChangeInputVariables,
    changesDisabled = false,
  } = props;

  const fieldValue = useMemo(() => {
    let result = toolInputVariables?.[fieldKey];

    // Fallback: if result is undefined but we have a default in the schema, use it
    if ((result === undefined || typeof result == 'function') && property?.default !== undefined)
      result = property.default;

    return result;
  }, [fieldKey, property, toolInputVariables]);

  const fieldProperties = useMemo(
    () => ({
      isRequired: schema?.required?.includes(fieldKey) || false,
      label: property?.title || fieldKey,
      description: property?.description,
      format: property?.format,
      secret: property?.secret,
      enumValues: property?.enum,
      codeLanguage: property?.code_language,
      lines: property?.lines,
      disabled: changesDisabled,
      error: property?.error,
      clipboard: property?.clipboard || false,
    }),
    [schema, fieldKey, property, changesDisabled],
  );

  const fieldPropsShared = useMemo(
    () => ({
      fieldKey,
      fieldValue,
      fieldProperties,
      onChangeInputVariables,
      toolInputVariables,
    }),
    [fieldKey, fieldProperties, fieldValue, onChangeInputVariables, toolInputVariables],
  );

  const fieldType = useMemo(() => {
    let result = property?.type;

    // Handle type for Optional fields
    if (property.type === undefined && property.anyOf)
      result = property.anyOf.find(schema_item => schema_item.type !== 'null').type;

    return result;
  }, [property]);

  const { minFieldValue, maxFieldValue } = useMemo(() => {
    let min = undefined;
    let max = undefined;

    // handle min & max for number/integer types
    if (fieldType === 'number' || fieldType === 'integer') {
      min = property?.anyOf?.[0]?.minimum;
      max = property?.anyOf?.[0]?.maximum;
    }

    return { minFieldValue: min, maxFieldValue: max };
  }, [fieldType, property]);

  const isArrayOfPatternField = useMemo(() => {
    // Handle anyOf patterns (like whitelist/blacklist fields)
    if (property?.anyOf && Array.isArray(property.anyOf)) {
      // Find the array type in anyOf (typically the second option after null)
      const arraySchema = property.anyOf.find(schema_item => schema_item.type === 'array');

      if (arraySchema) return true;
    }
  }, [property]);

  const isSecretField = useMemo(() => {
    const { format, secret } = fieldProperties;
    const fullSchema = property ?? null;

    // Check top-level format and secret properties first
    if (format === 'password' || !!secret) return true;

    // Check for anyOf/oneOf patterns that contain password format
    if (fullSchema && (fullSchema.anyOf || fullSchema.oneOf)) {
      const schemas = fullSchema.anyOf || fullSchema.oneOf;
      const hasPasswordFormat = schemas.some(
        schema_item => schema_item.format === 'password' || !!schema_item.secret,
      );

      if (hasPasswordFormat) return true;
    }

    // Check common secret field patterns
    const secretPatterns = ['password', 'secret', 'token', 'credential'];
    return secretPatterns.some(pattern => fieldKey.toLowerCase().includes(pattern));
  }, [fieldKey, fieldProperties, property]);

  // Check visible_when condition (schema-driven conditional visibility)
  // Memoized to avoid re-computing visibility on every render
  const isVisible = useMemo(() => {
    const visibleWhen = property?.visible_when;
    if (!visibleWhen) return true;

    const { field: conditionField, value: conditionValue } = visibleWhen;
    const currentFieldValue = toolInputVariables?.[conditionField];
    // Compare case-insensitively for string values
    return typeof currentFieldValue === 'string' && typeof conditionValue === 'string'
      ? currentFieldValue.toLowerCase() === conditionValue.toLowerCase()
      : currentFieldValue === conditionValue;
  }, [property?.visible_when, toolInputVariables]);

  if (!isVisible) return null;

  if (isArrayOfPatternField) return <Field.AnyOfPatternField {...fieldPropsShared} />;
  if (isSecretField) return <Field.SecretInputField {...fieldPropsShared} />;

  if (property.hidden) return null;

  switch (fieldType) {
    case 'object':
      return <Field.CommonObjectField {...fieldPropsShared} />;
    case 'boolean':
      return <Field.CommonBooleanField {...fieldPropsShared} />;

    case 'integer':
    case 'number':
      return (
        <Field.CommonNumberField
          {...fieldPropsShared}
          property={property}
          minFieldValue={minFieldValue}
          maxFieldValue={maxFieldValue}
          fieldType={fieldType}
        />
      );

    case 'array':
      return (
        <Field.CommonArrayField
          {...fieldPropsShared}
          property={property}
        />
      );

    case 'string':
    default:
      return (
        <Field.CommonStringField
          {...fieldPropsShared}
          property={property}
        />
      );
  }
});

ToolFormContainer.displayName = 'ToolFormContainer';

export default ToolFormContainer;
