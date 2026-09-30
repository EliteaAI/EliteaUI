import { memo, useEffect, useState } from 'react';

import FormInput from '@/components/FormInput.jsx';

const ArrayFieldInput = memo(props => {
  const {
    k,
    settings,
    required,
    label,
    toastError,
    errorText,
    disableConfigFields,
    disabled,
    editField,
    buildEditFieldPath,
    testId,
  } = props;

  const styles = getStyles();
  const arrayValue = settings[k];
  const initialDisplayValue = Array.isArray(arrayValue) ? arrayValue.join(', ') : arrayValue || '';
  const [localValue, setLocalValue] = useState(initialDisplayValue);

  // Sync local value when settings change externally
  useEffect(() => {
    const newDisplayValue = Array.isArray(settings[k]) ? settings[k].join(', ') : settings[k] || '';
    setLocalValue(newDisplayValue);
  }, [settings, k]);

  // OAuth scopes are conventionally space-separated; other values may contain spaces
  const isSpaceSeparated = k === 'scopes';

  const handleBlur = () => {
    const arrayResult = localValue
      ? localValue
          .split(isSpaceSeparated ? /[,\s]+/ : ',')
          .map(s => s.trim())
          .filter(Boolean)
      : [];
    editField(buildEditFieldPath(k), arrayResult);
  };

  return (
    <FormInput
      key={k}
      required={required}
      label={label}
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      error={toastError}
      helperText={
        errorText ||
        (isSpaceSeparated ? 'Enter scopes separated by commas or spaces' : 'Enter values separated by commas')
      }
      FormHelperTextProps={{ sx: styles.helperText }}
      disabled={disableConfigFields || disabled}
      inputProps={testId ? { 'data-testid': testId } : undefined}
    />
  );
});

/** @type {MuiSx} */
const getStyles = () => ({
  helperText: ({ palette }) => ({
    marginTop: '0.25rem',
    color: palette.text.primary,
  }),
});

ArrayFieldInput.displayName = 'ArrayFieldInput';

export default ArrayFieldInput;
