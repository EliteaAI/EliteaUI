import { memo, useCallback, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { includeFieldWrapperOverlapStyles } from '@/[fsd]/shared/ui/field/styles';
import FormInput from '@/components/FormInput.jsx';
import InfoIcon from '@/components/Icons/InfoIcon';
import Slider from '@/components/Slider.jsx';

const CommonNumberField = memo(props => {
  const {
    fieldKey,
    fieldValue,
    fieldProperties,
    onChangeInputVariables,
    toolInputVariables,
    property,
    minFieldValue,
    maxFieldValue,
    fieldType,
  } = props;
  const { label, description, isRequired, disabled } = fieldProperties;

  // Extract numeric constraints from property, including from anyOf arrays (for Optional types)
  const { exclusiveMinimum, exclusiveMaximum, minimum, maximum } = useMemo(() => {
    let exclMin = property?.exclusiveMinimum;
    let exclMax = property?.exclusiveMaximum;
    let min = property?.minimum;
    let max = property?.maximum;

    // If using anyOf (Optional types), check inside the numeric type definition
    if (property?.anyOf) {
      const numericType = property.anyOf.find(item => item.type === 'integer' || item.type === 'number');
      if (numericType) {
        exclMin = exclMin ?? numericType.exclusiveMinimum;
        exclMax = exclMax ?? numericType.exclusiveMaximum;
        min = min ?? numericType.minimum;
        max = max ?? numericType.maximum;
      }
    }

    return { exclusiveMinimum: exclMin, exclusiveMaximum: exclMax, minimum: min, maximum: max };
  }, [property]);

  const styles = commonNumberFieldStyles();

  const handleSelectChange = useCallback(
    (field, newValue) => {
      onChangeInputVariables({
        ...toolInputVariables,
        [field]: newValue,
      });
    },
    [onChangeInputVariables, toolInputVariables],
  );

  const handleNumberChange = useCallback(
    (field, event) => {
      const rawValue = event.target.value;
      // Empty string -> null
      if (rawValue === '' || rawValue === null || rawValue === undefined) {
        onChangeInputVariables({
          ...toolInputVariables,
          [field]: null,
        });
        return;
      }

      if (fieldType === 'integer') {
        // For integers: strip non-digit characters (matching ToolBase pattern)
        const cleanedValue = rawValue.replace(/[^0-9]/g, '');
        if (cleanedValue === '') {
          onChangeInputVariables({
            ...toolInputVariables,
            [field]: null,
          });
        } else {
          onChangeInputVariables({
            ...toolInputVariables,
            [field]: parseInt(cleanedValue, 10),
          });
        }
      } else {
        // For floats: parse as float
        const parsedValue = parseFloat(rawValue);
        onChangeInputVariables({
          ...toolInputVariables,
          [field]: Number.isNaN(parsedValue) ? null : parsedValue,
        });
      }
    },
    [onChangeInputVariables, toolInputVariables, fieldType],
  );

  // Validate current value against constraints and generate error message
  const validationError = useMemo(() => {
    // Skip validation if no value or no constraints
    if (fieldValue === null || fieldValue === undefined || fieldValue === '') return null;

    const numValue = typeof fieldValue === 'number' ? fieldValue : parseFloat(fieldValue);
    if (Number.isNaN(numValue)) return null;

    // Check exclusiveMinimum (value must be > exclusiveMinimum)
    if (exclusiveMinimum !== undefined && numValue <= exclusiveMinimum) {
      return `Value must be greater than ${exclusiveMinimum}`;
    }
    // Check minimum (value must be >= minimum)
    if (minimum !== undefined && numValue < minimum) {
      return `Value must be at least ${minimum}`;
    }
    // Check exclusiveMaximum (value must be < exclusiveMaximum)
    if (exclusiveMaximum !== undefined && numValue >= exclusiveMaximum) {
      return `Value must be less than ${exclusiveMaximum}`;
    }
    // Check maximum (value must be <= maximum)
    if (maximum !== undefined && numValue > maximum) {
      return `Value must be at most ${maximum}`;
    }

    return null;
  }, [fieldValue, exclusiveMinimum, minimum, exclusiveMaximum, maximum]);

  // Special handling for potential slider inputs (with min/max defined)
  if (minFieldValue !== undefined && maxFieldValue !== undefined) {
    const step = fieldType === 'integer' ? 1 : 0.1;

    return (
      <Box
        sx={styles.wrapper(disabled)}
        key={fieldKey}
        className="index-config-field"
      >
        <Slider
          label={`${label} (${minFieldValue} - ${maxFieldValue})`}
          value={fieldValue ?? (property?.default !== undefined ? property.default : minFieldValue)}
          step={step}
          range={[minFieldValue, maxFieldValue]}
          onChange={value => handleSelectChange(fieldKey, value)}
          labelHint={description}
          isRequired={isRequired}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={styles.wrapper(disabled)}
      key={fieldKey}
      className="index-config-field"
    >
      <Box sx={styles.header}>
        <Typography variant="bodyMedium">{`${label}${isRequired ? ' *' : ''}`}</Typography>
        {description && (
          <Tooltip
            title={description}
            placement="top"
          >
            <Box sx={styles.infoIconWrapper}>
              <InfoIcon
                width={16}
                height={16}
              />
            </Box>
          </Tooltip>
        )}
      </Box>
      <FormInput
        required={fieldProperties.isRequired}
        type={fieldType === 'integer' ? 'tel' : 'number'}
        value={fieldValue ?? ''}
        onChange={event => handleNumberChange(fieldKey, event)}
        error={!!validationError}
        helperText={validationError}
        inputProps={{
          step: fieldType === 'integer' ? 1 : 'any',
          // For integer fields: use exclusiveMinimum + 1 if defined (exclusiveMinimum means > value, we need >= value + 1).
          // For non-integer numeric fields: rely on minimum for HTML and handle exclusivity via JS validation if needed.
          min:
            fieldType === 'integer'
              ? exclusiveMinimum !== undefined
                ? exclusiveMinimum + 1
                : minimum
              : minimum,
          // For integer fields: use exclusiveMaximum - 1 if defined (exclusiveMaximum means < value, we need <= value - 1).
          // For non-integer numeric fields: rely on maximum for HTML and handle exclusivity via JS validation if needed.
          max:
            fieldType === 'integer'
              ? exclusiveMaximum !== undefined
                ? exclusiveMaximum - 1
                : maximum
              : maximum,
        }}
      />
    </Box>
  );
});

CommonNumberField.displayName = 'CommonNumberField';

/** @type {MuiSx} */
const commonNumberFieldStyles = () => ({
  wrapper: disabled => ({
    marginTop: '1rem',
    width: '100%',
    paddingRight: '0rem',

    ...includeFieldWrapperOverlapStyles(disabled),
  }),
  header: { display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.5rem' },
  infoIconWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
    width: '1rem',
    cursor: 'pointer',
    pointerEvents: 'auto',
  },
});

export default CommonNumberField;
