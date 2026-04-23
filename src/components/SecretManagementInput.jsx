import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Box, InputAdornment, TextField, Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';

import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { useSecretsListQuery } from '@/api/secrets.js';
import InfoIcon from '@/components/Icons/InfoIcon';
import Toggle from '@/components/Toggle.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const secretRegex = /^{{secret\.([A-Za-z0-9_]+)}}$/;

const updateRawPassword = ({ value, isUserInputRef, setRawPasswordInput, isLoadedSecretRef }) => {
  if (isUserInputRef.current) {
    isUserInputRef.current = false;
    return;
  }

  if (!value) {
    setRawPasswordInput('');
    isLoadedSecretRef.current = false;
    return;
  }

  const match = value.match(secretRegex);

  if (match) {
    setRawPasswordInput(match[1]);
    isLoadedSecretRef.current = true;
  } else {
    setRawPasswordInput(value);
    isLoadedSecretRef.current = false;
  }
};

export const SecretField = memo(props => {
  const {
    value,
    onChange = () => {},
    onChangeToggle = () => {},
    label,
    id,
    error,
    helperText,
    inputProps = {},
    containerProps = {},
    toggleProps = {},
    textFieldProps = {},
    selectProps = {},
    required = true,
    disabled = false,
    passwordVisibilityToggle = true,
    disableSecret = false,
    toggleLabelSecret = 'Secret',
    toggleLabelPassword = 'Password',
    specifiedProjectId,
    tooltipDescription,
  } = props;
  const styles = secretFieldStyles(error);
  const { sx: containerSx, ...restOfContainerProps } = containerProps;

  const toggleOptions = useMemo(() => {
    return [
      { label: toggleLabelSecret, value: 'secret' },
      { label: toggleLabelPassword, value: 'password' },
    ];
  }, [toggleLabelPassword, toggleLabelSecret]);
  const isSecret = useMemo(() => (value ? secretRegex.test(value) : false), [value]);

  const [activeTab, setActiveTab] = useState(toggleOptions[1].value);
  const [rawPasswordInput, setRawPasswordInput] = useState('');

  const isLoadedSecretRef = useRef(false);
  const isUserInputRef = useRef(false);

  useEffect(() => {
    updateRawPassword({ value, isUserInputRef, setRawPasswordInput, isLoadedSecretRef });
  }, [value]);

  const selectedProjectId = useSelectedProjectId();
  const projectId = useMemo(
    () => specifiedProjectId || selectedProjectId,
    [selectedProjectId, specifiedProjectId],
  );

  const skip = !projectId || (!isSecret && activeTab === toggleOptions[1].value);

  const { data = [], isError } = useSecretsListQuery(projectId, {
    skip,
  });

  const isHiddenSecret = useMemo(() => {
    return isError || !data?.some(i => i.secret_name === value);
  }, [data, isError, value]);

  const handleSwitchToSecretTab = useCallback(() => {
    if (isSecret && !isHiddenSecret) setActiveTab(toggleOptions[0].value);
  }, [toggleOptions, isHiddenSecret, isSecret]);

  useEffect(() => {
    handleSwitchToSecretTab();
  }, [handleSwitchToSecretTab]);

  const secretsOptions = useMemo(() => {
    return isError
      ? []
      : data
          ?.map(item => ({ label: item.name, value: item.secret_name }))
          .sort((a, b) => a.label.localeCompare(b.label)) || [];
  }, [data, isError]);

  const handlePasswordInputChange = useCallback(
    (e, rawNewValue) => {
      const newValue = rawNewValue.replace(/[^\x20-\x7E]/g, '');
      if (isLoadedSecretRef.current) {
        isLoadedSecretRef.current = false;
        isUserInputRef.current = true;
        setRawPasswordInput('');
        onChange?.(e, '');
        return;
      }
      setRawPasswordInput(newValue);
      isUserInputRef.current = true;
      if (newValue) {
        onChange?.(e, newValue);
      } else {
        onChange?.(e, '');
      }
    },
    [onChange],
  );

  const handleChangeValue = useCallback(
    e => {
      const newValue = e.target.value;
      if (activeTab === toggleOptions[1].value) {
        handlePasswordInputChange(e, newValue);
      } else {
        onChange?.(e, newValue);
      }
    },
    [activeTab, toggleOptions, onChange, handlePasswordInputChange],
  );

  const handleToggleTab = useCallback(
    (e, toggledValue) => {
      if (!disableSecret && toggledValue) {
        setActiveTab(toggledValue);
        setRawPasswordInput('');
        onChangeToggle && onChangeToggle(e, toggledValue);
        onChange && onChange(e, '');
      }
    },
    [disableSecret, onChange, onChangeToggle],
  );

  const [showPassword, setShowPassword] = useState(false);
  const sx = useMemo(
    () => (Array.isArray(containerSx) ? [styles.container, ...containerSx] : [styles.container, containerSx]),
    [containerSx, styles.container],
  );

  return (
    <Box
      sx={sx}
      {...restOfContainerProps}
    >
      {activeTab === toggleOptions[0].value ? (
        <SingleSelect
          showBorder
          id={id}
          value={value}
          label={label}
          onChange={handleChangeValue}
          options={secretsOptions}
          disabled={disabled}
          required={required}
          error={error}
          helperText={helperText}
          // customSelectedFontSize={'0.875rem'}
          sx={styles.select}
          {...inputProps}
          {...selectProps}
        />
      ) : (
        <Box sx={styles.passwordFieldWrapper}>
          {tooltipDescription && (
            <Box sx={styles.labelRow}>
              <Box component="span">
                {label}
                {required ? ' *' : ''}
              </Box>
              <Tooltip title={tooltipDescription}>
                <Box
                  component="span"
                  sx={styles.tooltipIconInLabel}
                >
                  <InfoIcon
                    width={16}
                    height={16}
                  />
                </Box>
              </Tooltip>
            </Box>
          )}
          <TextField
            sx={styles.formInput}
            variant="standard"
            fullWidth
            autoComplete="off"
            id={id}
            label={tooltipDescription ? undefined : `${label}${required ? ' *' : ''}`}
            value={rawPasswordInput}
            disabled={disabled}
            onChange={handleChangeValue}
            type={showPassword ? 'text' : 'password'}
            error={error}
            helperText={helperText}
            slotProps={{
              inputLabel: tooltipDescription
                ? undefined
                : {
                    sx: styles.inputLabel,
                    shrink: true,
                  },
            }}
            InputProps={{
              endAdornment: passwordVisibilityToggle && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    color="secondary"
                    aria-label="toggle password visibility"
                    edge="end"
                    onClick={() => {
                      setShowPassword(prevState => !prevState);
                    }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            {...inputProps}
            {...textFieldProps}
          />
        </Box>
      )}
      <Toggle
        sx={styles.toggle}
        value={activeTab}
        options={toggleOptions}
        onChange={handleToggleTab}
        disabled={disableSecret}
        {...toggleProps}
      />
    </Box>
  );
});

/** @type {MuiSx} */
const secretFieldStyles = error => ({
  container: {
    display: 'flex',
    alignItems: 'flex-end',
  },
  select: {
    marginTop: '0.625rem',
    '& .MuiInputLabel-root': {
      top: '-0.3125rem',
    },
  },
  passwordFieldWrapper: {
    flexGrow: 1,
  },
  formInput: {
    width: '100%',
  },
  toggle: {
    marginBottom: error ? '1.375rem' : 0,
  },
  labelRow: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.25rem',
    color: palette.text.secondary,
    fontSize: '0.75rem',
  }),
  tooltipIconInLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.8,
    },
  },
  inputLabel: {
    '& .MuiInputLabel-asterisk': {
      display: 'none',
    },
  },
});

SecretField.displayName = 'SecretField';

const SecretManagementInput = memo(props => {
  const {
    sx = {},
    authType,
    authTypes,
    fieldPath,
    editField,
    onInputBlur = () => {},
    inputValue,
    error,
    helperText,
    required = true,
    disabled = false,
    passwordVisibilityToggle = false,
    disableSecret = false,
    id,
    name,
    specifiedProjectId,
    description,
  } = props;

  const [inputLabel, setInputLabel] = useState('API Key');

  const handleChangeToggleValue = useCallback(() => {
    if (disableSecret) return null;
    editField(fieldPath, '');
  }, [disableSecret, fieldPath, editField]);

  const authenticationType = useMemo(() => {
    if (!authTypes || typeof authTypes !== 'object') {
      return {
        label: inputLabel,
      };
    }

    const authenticationTypes = Object.values(authTypes) || [];

    return authenticationTypes.find(authTypeItem => authTypeItem.value === authType);
  }, [inputLabel, authType, authTypes]);

  useEffect(() => {
    setInputLabel(authenticationType.label);
  }, [authType, authenticationType.label]);

  const handleInputChange = useCallback(
    field => (e, value) => {
      editField(field, value);
    },
    [editField],
  );

  return (
    <SecretField
      containerProps={{
        sx: [secretManagementInputStyles.container, sx],
      }}
      inputProps={{ name: name || 'api_key' }}
      label={inputLabel}
      value={inputValue}
      onChange={handleInputChange(fieldPath)}
      onChangeToggle={handleChangeToggleValue}
      textFieldProps={{ onBlur: onInputBlur }}
      error={error}
      helperText={helperText}
      disabled={disabled}
      required={required}
      passwordVisibilityToggle={passwordVisibilityToggle}
      disableSecret={disableSecret}
      id={id}
      specifiedProjectId={specifiedProjectId}
      tooltipDescription={description}
    />
  );
});

/** @type {MuiSx} */
const secretManagementInputStyles = {
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
};

SecretManagementInput.displayName = 'SecretManagementInput';

export default SecretManagementInput;
