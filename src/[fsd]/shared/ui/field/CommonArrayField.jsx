import { memo, useCallback } from 'react';

import { Typography } from '@mui/material';
import { Box } from '@mui/system';

import Tooltip from '@/ComponentsLib/Tooltip';
import { Field } from '@/[fsd]/shared/ui';
import InfoIcon from '@/components/Icons/InfoIcon';
import MultipleSelect from '@/components/MultipleSelect';
import { jsonLinter } from '@/hooks/useCodeMirrorLanguageExtensions';
import { json } from '@codemirror/lang-json';

const CommonArrayField = memo(props => {
  const {
    fieldKey,
    fieldValue,
    fieldProperties,
    onChangeInputVariables,
    toolInputVariables,
    property,
    disabled,
  } = props;
  const { description, label, isRequired } = fieldProperties;

  const styles = commonArrayFieldStyles();

  const handleSelectChange = useCallback(
    (field, newValue) => {
      onChangeInputVariables({
        ...toolInputVariables,
        [field]: newValue,
      });
    },
    [onChangeInputVariables, toolInputVariables],
  );

  const handleJSONObjectChange = useCallback(
    (key, value) => {
      if (!value || value.trim() === '') {
        onChangeInputVariables({
          ...toolInputVariables,
          [key]: {},
        });
        return;
      }

      let parsedValue;

      try {
        parsedValue = JSON.parse(value);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Invalid JSON, using empty object:', error);
        parsedValue = {};
      }
      onChangeInputVariables({
        ...toolInputVariables,
        [key]: parsedValue,
      });
    },
    [onChangeInputVariables, toolInputVariables],
  );

  if (property?.items?.enum) {
    return (
      <Box
        sx={styles.wrapper}
        className="index-config-field"
        key={fieldKey}
      >
        <Box sx={styles.header}>
          <Typography variant="bodyMedium">{label}</Typography>
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
        <MultipleSelect
          required={isRequired}
          options={property.items.enum.map(option => ({
            label: option,
            value: option,
          }))}
          emptyPlaceHolder={''}
          value={fieldValue || []}
          onValueChange={value => handleSelectChange(fieldKey, value)}
          showBorder
          labelSX={styles.label}
          selectSX={styles.select}
          valueItemSX={styles.valueItem}
          MenuProps={{
            PaperProps: { style: { marginTop: '.5rem' } },
          }}
          disabled={disabled}
        />
      </Box>
    );
  }

  //   For other array types, use ResizableCodeMirrorEditor for better JSON editing
  return (
    <Box
      sx={styles.wrapper}
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
      <Field.ResizableCodeMirrorEditor
        expandAction
        value={JSON.stringify(fieldValue || [], null, 2)}
        extensions={[json(), jsonLinter]}
        minHeight={100}
        onChange={value => handleJSONObjectChange(fieldKey, value)}
        readOnly={disabled}
        fieldName={label}
      />
    </Box>
  );
});

CommonArrayField.displayName = 'CommonArrayField';

/** @type {MuiSx} */
const commonArrayFieldStyles = () => ({
  wrapper: {
    marginTop: '1rem',
    width: '100%',
    paddingRight: '0rem',
  },

  header: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  infoIconWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
    width: '1rem',
    cursor: 'pointer',
    pointerEvents: 'auto',
  },

  label: {
    left: '12px',

    '& .Mui-focused': {
      top: '-.3125rem',
    },
  },

  select: {
    '& .MuiSelect-icon': {
      top: 'calc(50% - .6875rem) !important;',
    },
  },

  valueItem: { maxWidth: '100% !important' },
});

export default CommonArrayField;
