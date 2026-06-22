import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Box, InputAdornment, TextField, Tooltip } from '@mui/material';

import { BaseBtn } from '@/[fsd]/shared/ui/button';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import { useSecretsListQuery } from '@/api/secrets.js';
import RefreshIcon from '@/assets/refresh-icon.svg?react';
import { PERMISSIONS } from '@/common/constants';
import Toggle from '@/components/Toggle.jsx';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions, { getBasename } from '@/routes';

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

const SecretField = memo(props => {
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

  const { personal_project_id } = useSelector(state => state.user);
  const { checkPermission } = useCheckPermission();
  const canCreateSecret = checkPermission(PERMISSIONS.secrets.create);

  const skip = !projectId || (!isSecret && activeTab === toggleOptions[1].value);

  const {
    data = [],
    isError,
    refetch,
  } = useSecretsListQuery(projectId, {
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

  const savedSecretsOptions = useMemo(() => {
    if (isError) return [];
    return (data || [])
      .map(item => ({ label: item.name, value: item.secret_name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [data, isError]);

  const createSecretsOptions = useMemo(() => {
    if (!canCreateSecret) return [];
    const secretsPath = RouteDefinitions.SettingsWithTab.replace(':tab', 'secrets');
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const basename = getBasename();
    const buildUrl = targetProjectId =>
      `${baseUrl}${basename}/${targetProjectId}${secretsPath}?createSecret=1`;

    const options = [
      {
        value: '__create_private_secret__',
        label: personal_project_id === selectedProjectId ? 'New Private Secret' : 'New Project Secret',
        variant: 'action',
        onActivate: () => window.open(buildUrl(selectedProjectId), '_blank', 'noopener,noreferrer'),
      },
    ];

    return options;
  }, [canCreateSecret, selectedProjectId, personal_project_id]);

  const refreshButton = useMemo(
    () => (
      <Tooltip
        title="Refresh secrets"
        placement="top"
      >
        <BaseBtn
          variant={BUTTON_VARIANTS.tertiary}
          size="small"
          onClick={refetch}
          sx={styles.refreshIcon}
        >
          <RefreshIcon />
        </BaseBtn>
      </Tooltip>
    ),
    [refetch, styles.refreshIcon],
  );

  const secretOptionGroups = useMemo(() => {
    const groups = [];
    if (createSecretsOptions.length > 0) {
      groups.push({
        key: 'Create',
        title: 'Create',
        options: createSecretsOptions,
      });
    }
    groups.push({
      key: 'Saved Secrets',
      title: 'Saved Secrets',
      headerEnd: refreshButton,
      options: savedSecretsOptions,
    });
    return groups;
  }, [createSecretsOptions, savedSecretsOptions, refreshButton]);

  const handlePasswordInputChange = useCallback(
    (e, rawNewValue) => {
      const newValue = rawNewValue.replace(/[^\x20-\x7E]/g, '');
      if (isLoadedSecretRef.current) isLoadedSecretRef.current = false;
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
          optionGroups={secretOptionGroups}
          options={[]}
          disabled={disabled}
          required={required}
          error={error}
          helperText={helperText}
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
              <InfoTooltip
                infoTooltip={tooltipDescription}
                sx={styles.infoIconWrapper}
              />
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
              input: {
                endAdornment: passwordVisibilityToggle && (
                  <InputAdornment position="end">
                    <BaseBtn
                      variant={BUTTON_VARIANTS.secondary}
                      size="small"
                      aria-label="toggle password visibility"
                      edge="end"
                      onClick={() => {
                        setShowPassword(prevState => !prevState);
                      }}
                      sx={styles.passwordVisibilityToggle}
                    >
                      {showPassword ? (
                        <VisibilityOff sx={styles.visibilityToggleIcon} />
                      ) : (
                        <Visibility sx={styles.visibilityToggleIcon} />
                      )}
                    </BaseBtn>
                  </InputAdornment>
                ),
              },
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
  refreshIcon: ({ palette }) => ({
    color: palette.text.default,
    padding: 0,
    position: 'relative',
    backgroundColor: 'transparent',
    '&:hover, &:active, &.Mui-focusVisible': {
      backgroundColor: 'transparent',
    },
    '&:hover': {
      color: palette.text.secondary,
    },
    '&:hover::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '1.625rem',
      height: '1.625rem',
      transform: 'translate(-21%, -18%)',
      borderRadius: '50%',
      backgroundColor: palette.background.userInputBackgroundActive,
    },
  }),
  passwordVisibilityToggle: {
    minWidth: '1.5rem !important',
    maxWidth: '1.5rem !important',
    maxHeight: '1.5rem !important',
    minHeight: '1.5rem !important',
    padding: 0,
  },
  visibilityToggleIcon: {
    width: '0.875rem',
    height: '0.875rem',
  },
});

SecretField.displayName = 'SecretField';

export default SecretField;
