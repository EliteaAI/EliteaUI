import { memo, useCallback, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { includeFieldWrapperOverlapStyles } from '@/[fsd]/shared/ui/field/styles';
import InfoIcon from '@/components/Icons/InfoIcon';
import SecretManagementInput from '@/components/SecretManagementInput.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const SecretInputFieldField = memo(props => {
  const { fieldKey, fieldProperties, fieldValue, onChangeInputVariables, toolInputVariables } = props;
  const { isRequired, label, description, disabled } = fieldProperties;

  const styles = secretInputFieldFieldStyles();

  const projectId = useSelectedProjectId();

  const tooltipHint = useMemo(
    () => (isRequired && (!fieldValue || fieldValue === '') ? 'Field is required' : description),
    [isRequired, fieldValue, description],
  );

  const handleSecretFieldChange = useCallback(
    (key, value) => {
      onChangeInputVariables({
        ...toolInputVariables,
        [key]: value === '' ? undefined : value,
      });
    },
    [onChangeInputVariables, toolInputVariables],
  );

  return (
    <Box
      sx={styles.wrapper(disabled)}
      key={fieldKey}
      className="index-config-field"
    >
      <Box sx={styles.header}>
        <Typography variant="bodyMedium">{`${label}${isRequired ? ' *' : ''}`}</Typography>
        {tooltipHint && (
          <Tooltip
            title={tooltipHint}
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
      <SecretManagementInput
        sx={{ marginTop: '0rem' }}
        authType={fieldKey}
        authTypes={[{ label: '', value: fieldKey }]}
        editField={value => handleSecretFieldChange(fieldKey, value)}
        fieldPath={fieldKey}
        inputValue={fieldValue}
        error={isRequired && (!fieldValue || fieldValue === '')}
        helperText={null}
        required={isRequired}
        specifiedProjectId={projectId}
        disabled={disabled}
      />
    </Box>
  );
});

SecretInputFieldField.displayName = 'SecretInputFieldField';

/** @type {MuiSx} */
const secretInputFieldFieldStyles = () => ({
  wrapper: disabled => ({
    marginTop: '1rem',
    width: '100%',
    paddingRight: '0rem',

    '>div:last-of-type': { '>div:last-of-type': { marginBottom: '0' } },

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

export default SecretInputFieldField;
