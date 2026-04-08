import { memo, useCallback } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { Checkbox } from '@/[fsd]/shared/ui';
import { includeFieldWrapperOverlapStyles } from '@/[fsd]/shared/ui/field/styles';
import InfoIcon from '@/components/Icons/InfoIcon';

const CommonBooleanField = memo(props => {
  const { fieldKey, fieldValue, fieldProperties, onChangeInputVariables, toolInputVariables } = props;
  const { label, description, isRequired, disabled } = fieldProperties;

  const styles = commonBooleanFieldStyles();

  const handleBooleanChange = useCallback(
    (field, event) => {
      onChangeInputVariables({
        ...toolInputVariables,
        [field]: event.target.checked,
      });
    },
    [onChangeInputVariables, toolInputVariables],
  );

  return (
    <Box
      key={fieldKey}
      sx={styles.wrapper(disabled)}
      className="index-config-field"
    >
      <FormControlLabel
        control={
          <Checkbox.BaseCheckbox
            checked={fieldValue || false}
            onChange={event => handleBooleanChange(fieldKey, event)}
            disabled={disabled}
          />
        }
        label={
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
        }
        sx={styles.formControlLabel}
      />
    </Box>
  );
});

CommonBooleanField.displayName = 'CommonBooleanField';

/** @type {MuiSx} */
const commonBooleanFieldStyles = () => ({
  wrapper: disabled => ({
    marginTop: '1rem',
    paddingRight: '0rem',

    ...includeFieldWrapperOverlapStyles(disabled),
  }),
  formControlLabel: {
    '& .MuiFormControlLabel-label': { fontSize: '.875rem' },

    height: '1rem',
    marginLeft: '0rem',
  },
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

export default CommonBooleanField;
