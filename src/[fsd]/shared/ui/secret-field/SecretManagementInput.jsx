import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import SecretField from './SecretField';

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
