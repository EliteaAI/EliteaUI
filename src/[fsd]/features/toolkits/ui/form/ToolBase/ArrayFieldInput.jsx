import { memo, useEffect, useState } from 'react';

import FormInput from '@/components/FormInput.jsx';

const ArrayFieldInput = memo(
  ({
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
  }) => {
    const styles = getStyles();
    const arrayValue = settings[k];
    const initialDisplayValue = Array.isArray(arrayValue) ? arrayValue.join(', ') : arrayValue || '';
    const [localValue, setLocalValue] = useState(initialDisplayValue);

    // Sync local value when settings change externally
    useEffect(() => {
      const newDisplayValue = Array.isArray(settings[k]) ? settings[k].join(', ') : settings[k] || '';
      setLocalValue(newDisplayValue);
    }, [settings, k]);

    const handleBlur = () => {
      // Convert comma or space-separated string to array on blur
      const arrayResult = localValue
        ? localValue
            .split(/[,\s]+/)
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
        helperText={errorText || 'Enter scopes separated by commas or spaces'}
        FormHelperTextProps={{ sx: styles.helperText }}
        disabled={disableConfigFields || disabled}
      />
    );
  },
);

/** @type {MuiSx} */
const getStyles = () => ({
  helperText: ({ palette }) => ({
    marginTop: '4px',
    color: palette.text.primary,
  }),
});

ArrayFieldInput.displayName = 'ArrayFieldInput';

export default ArrayFieldInput;
