import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { Field } from '@/[fsd]/shared/ui';
import InfoIcon from '@/components/Icons/InfoIcon';
import { jsonLinter } from '@/hooks/useCodeMirrorLanguageExtensions';
import { json } from '@codemirror/lang-json';

const CommonObjectField = memo(props => {
  const { fieldKey, fieldValue, fieldProperties, onChangeInputVariables, toolInputVariables } = props;
  const { label, description, isRequired, disabled } = fieldProperties;

  const styles = commonObjectFieldStyles();

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
      <Box sx={{ marginTop: '0.75rem' }}>
        <Field.ResizableCodeMirrorEditor
          expandAction
          value={JSON.stringify(fieldValue || {}, null, 2)}
          extensions={[json(), jsonLinter]}
          minHeight={100}
          onChange={value => handleJSONObjectChange(fieldKey, value)}
          readOnly={disabled}
          fieldName={label}
        />
      </Box>
    </Box>
  );
});

CommonObjectField.displayName = 'CommonObjectField';

/** @type {MuiSx} */
const commonObjectFieldStyles = () => ({
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

export default CommonObjectField;
