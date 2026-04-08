import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { Field } from '@/[fsd]/shared/ui';
import InfoIcon from '@/components/Icons/InfoIcon';
import { jsonLinter } from '@/hooks/useCodeMirrorLanguageExtensions';
import { json } from '@codemirror/lang-json';

const AnyOfPatternField = memo(props => {
  const { fieldKey, fieldValue, fieldProperties, onChangeInputVariables, toolInputVariables } = props;
  const { label, description, isRequired, disabled } = fieldProperties;

  const styles = anyOfPatternFieldStyles();

  const onArrayOfPatternFieldChange = useCallback(
    (key, value) => {
      const noValue = !value || value.trim() === '';

      if (noValue) {
        onChangeInputVariables({
          ...toolInputVariables,
          [key]: [],
        });

        return;
      }

      let parsedValue = [];

      try {
        parsedValue = JSON.parse(value);

        if (!Array.isArray(parsedValue)) parsedValue = [];
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Invalid JSON, using empty array:', error);
        parsedValue = [];
      }

      onChangeInputVariables({
        ...toolInputVariables,
        [key]: parsedValue,
      });
    },
    [onChangeInputVariables, toolInputVariables],
  );

  return (
    <Box
      key={fieldKey}
      sx={styles.wrapper}
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
      <Box sx={{ marginTop: '0.75rem' }}>
        <Field.ResizableCodeMirrorEditor
          expandAction
          value={JSON.stringify(fieldValue || [], null, 2)}
          extensions={[json(), jsonLinter]}
          minHeight={100}
          onChange={value => onArrayOfPatternFieldChange(fieldKey, value)}
          readOnly={disabled}
          fieldName={label}
        />
      </Box>
    </Box>
  );
});

AnyOfPatternField.displayName = 'AnyOfPatternField';

/** @type {MuiSx} */
const anyOfPatternFieldStyles = () => ({
  wrapper: {
    marginTop: '1rem',
    width: '100%',
    paddingRight: '0rem',
  },
  header: { display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.5rem' },
  infoIconWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
    width: '16px',
    cursor: 'pointer',
    pointerEvents: 'auto',
  },
});

export default AnyOfPatternField;
