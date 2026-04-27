import { memo, useCallback, useMemo } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { Field } from '@/[fsd]/shared/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import FormInput from '@/components/FormInput';
import CopyIcon from '@/components/Icons/CopyIcon';
import InfoIcon from '@/components/Icons/InfoIcon';
import useToast from '@/hooks/useToast';

const CommonStringField = memo(props => {
  const { toastInfo } = useToast();

  const { fieldKey, fieldValue, fieldProperties, onChangeInputVariables, toolInputVariables, property } =
    props;
  const { enumValues, isRequired, label, description, codeLanguage, lines, disabled, error, clipboard } =
    fieldProperties;

  const styles = commonStringFieldStyles();

  const isMultiline = useMemo(
    () =>
      property?.multiline === true ||
      (lines !== undefined && parseInt(lines) > 1) ||
      property?.maxLength > 100 ||
      description?.toLowerCase().includes('description'),
    [lines, property, description],
  );

  const handleSelectChange = useCallback(
    (field, newValue) => {
      onChangeInputVariables({
        ...toolInputVariables,
        [field]: newValue === '' ? undefined : newValue,
      });
    },
    [onChangeInputVariables, toolInputVariables],
  );

  const handleCodeFieldChange = useCallback(
    (key, value) => {
      onChangeInputVariables({
        ...toolInputVariables,
        [key]: value,
      });
    },
    [onChangeInputVariables, toolInputVariables],
  );

  const handleInputChange = useCallback(
    (field, event) => {
      const value = event.target.value;
      onChangeInputVariables({
        ...toolInputVariables,
        [field]: value === '' ? undefined : value,
      });
    },
    [onChangeInputVariables, toolInputVariables],
  );

  const handleCopyToClipboard = useCallback(
    value => {
      navigator.clipboard.writeText(value).then(() => {
        toastInfo('Content copied to clipboard');
      });
    },
    [toastInfo],
  );

  // Handle string enums as dropdowns
  // Memoize options array to prevent re-computation on every render
  const enumOptions = useMemo(() => {
    if (!enumValues) return null;

    // Filter out null/None values from enum - they shouldn't be shown as dropdown options
    // If the field is optional, the empty value ('') serves as the "unset" option
    const filteredEnumValues = enumValues.filter(
      option => option !== null && option !== 'null' && option !== 'None',
    );

    // Build options array - only add empty option for optional fields that don't have a default
    const hasDefault = property?.default !== undefined && property?.default !== null;
    return [
      // Only show "None" option for optional fields without a default value
      ...(!isRequired && !hasDefault ? [{ label: 'None', value: '' }] : []),
      ...filteredEnumValues.map(option => ({
        label: option,
        value: option,
      })),
    ];
  }, [enumValues, isRequired, property]);

  if (enumOptions) {
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
        <SingleSelect
          sx={{ width: 'calc(100% - 0.35rem)', margin: '0 auto' }}
          required={isRequired}
          value={fieldValue || ''}
          onValueChange={value => handleSelectChange(fieldKey, value)}
          options={enumOptions}
          placeholder="Select an option..."
          disabled={disabled}
        />
      </Box>
    );
  }

  if (codeLanguage !== undefined) {
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
        <Field.CodeMirrorEditor
          value={fieldValue || ''}
          minHeight={100}
          onBlur={value => handleCodeFieldChange(fieldKey, value)}
          extensions={[]}
          readOnly={disabled}
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
      {clipboard && (
        <Box sx={styles.clipboardWrapper}>
          <IconButton
            onClick={() => handleCopyToClipboard(fieldValue)}
            variant="alita"
            color="tertiary"
            sx={{
              padding: '6px',
            }}
          >
            <CopyIcon
              sx={{
                fontSize: 14,
              }}
            />
          </IconButton>
        </Box>
      )}
      <Box sx={{ ...styles.header, ...styles.noMargin }}>
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
        inputEnhancer={isMultiline}
        required={isRequired}
        multiline={isMultiline}
        minRows={lines ? parseInt(lines) : isMultiline ? 3 : 1}
        value={fieldValue || ''}
        onChange={event => handleInputChange(fieldKey, event)}
        inputProps={{
          maxLength: property?.maxLength,
        }}
        disabled={disabled}
        error={Boolean(error)}
        helperText={error ?? null}
        sx={clipboard ? { paddingRight: '1.5rem' } : {}}
        fieldName={label}
      />
    </Box>
  );
});

CommonStringField.displayName = 'CommonStringField';

/** @type {MuiSx} */
const commonStringFieldStyles = () => ({
  wrapper: disabled => ({
    marginTop: '1rem',
    width: '100%',
    paddingRight: '0rem',
    position: 'relative',

    ...(disabled
      ? {
          pointerEvents: 'none',

          ':after': {
            position: 'absolute',
            content: '""',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
          },
        }
      : {}),
  }),
  header: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  noMargin: { marginBottom: '0rem' },
  infoIconWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
    width: '1rem',
    cursor: 'pointer',
    pointerEvents: 'auto',
  },
  clipboardWrapper: { position: 'absolute', right: 0, top: '50%', zIndex: 1 },
});

export default CommonStringField;
