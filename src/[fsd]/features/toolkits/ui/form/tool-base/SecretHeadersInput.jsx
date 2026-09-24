import { memo, useCallback, useMemo, useRef } from 'react';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import { ToolBaseHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { SecretManagementInput } from '@/[fsd]/shared/ui/secret-field';
import FormInput from '@/components/FormInput.jsx';
import DeleteIcon from '@/components/Icons/DeleteIcon';

const getNameErrorText = name => {
  if (!name) return 'Header name is required';
  if (!ToolBaseHelpers.HEADER_NAME_PATTERN.test(name)) {
    return 'Invalid HTTP header name';
  }
  return '';
};

const getValueErrorText = value => {
  if (typeof value === 'string' && /\r|\n/.test(value)) {
    return 'Header value cannot contain line breaks';
  }
  return 'Header value is required';
};

const SecretHeadersInput = memo(props => {
  const {
    value,
    editField,
    fieldPath,
    specifiedProjectId,
    disabled = false,
    description,
    required = false,
    hasError = false,
  } = props;

  const headers = useMemo(
    () => (value && typeof value === 'object' && !Array.isArray(value) ? value : {}),
    [value],
  );
  const entries = useMemo(() => Object.entries(headers), [headers]);
  const rowKeys = useRef(new Map());
  const nextRowKey = useRef(0);
  const keyedEntries = useMemo(
    () =>
      entries.map(([name, headerValue]) => {
        if (!rowKeys.current.has(name)) {
          rowKeys.current.set(name, nextRowKey.current);
          nextRowKey.current += 1;
        }
        return [name, headerValue, rowKeys.current.get(name)];
      }),
    [entries],
  );

  const updateHeaders = useCallback(
    nextHeaders => {
      editField(fieldPath, nextHeaders, true);
    },
    [editField, fieldPath],
  );

  const handleAdd = useCallback(() => {
    let suffix = entries.length + 1;
    let name = `Header-${suffix}`;
    while (Object.keys(headers).some(existing => existing.toLowerCase() === name.toLowerCase())) {
      suffix += 1;
      name = `Header-${suffix}`;
    }
    updateHeaders({ ...headers, [name]: '' });
  }, [entries.length, headers, updateHeaders]);

  const handleNameChange = useCallback(
    (index, nextName) => {
      const currentName = entries[index]?.[0];
      if (currentName === undefined || currentName === nextName) return;

      const duplicate = entries.some(
        ([name], entryIndex) => entryIndex !== index && name.toLowerCase() === nextName.toLowerCase(),
      );
      if (duplicate) return;

      const rowKey = rowKeys.current.get(currentName);
      rowKeys.current.delete(currentName);
      rowKeys.current.set(nextName, rowKey);

      updateHeaders(
        Object.fromEntries(
          entries.map(([name, headerValue], entryIndex) =>
            entryIndex === index ? [nextName, headerValue] : [name, headerValue],
          ),
        ),
      );
    },
    [entries, updateHeaders],
  );

  const handleValueChange = useCallback(
    (name, nextValue) => {
      updateHeaders({ ...headers, [name]: nextValue });
    },
    [headers, updateHeaders],
  );

  const handleRemove = useCallback(
    name => {
      rowKeys.current.delete(name);
      updateHeaders(Object.fromEntries(entries.filter(([entryName]) => entryName !== name)));
    },
    [entries, updateHeaders],
  );

  const styles = secretHeadersInputStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="openapi-secret-headers"
    >
      {description && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          {description}
          {required && <Typography component="span">{' *'}</Typography>}
        </Typography>
      )}
      {entries.length === 0 && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          No additional headers configured.
        </Typography>
      )}
      {keyedEntries.map(([name, headerValue, rowKey], index) => {
        const nameInvalid = hasError && ToolBaseHelpers.isHeaderNameInvalid(name);
        const valueInvalid = hasError && ToolBaseHelpers.isHeaderValueInvalid(headerValue);

        return (
          <Box
            key={rowKey}
            sx={styles.row}
          >
            <FormInput
              required
              label="Header Name"
              value={name}
              onChange={event => handleNameChange(index, event.target.value)}
              disabled={disabled}
              error={nameInvalid}
              helperText={nameInvalid ? getNameErrorText(name) : undefined}
              inputProps={{ 'data-testid': `openapi-secret-header-name-${index}` }}
            />
            <SecretManagementInput
              sx={styles.value}
              authType={name}
              authTypes={[{ label: 'Header Value', value: name }]}
              editField={(_, nextValue) => handleValueChange(name, nextValue)}
              fieldPath={fieldPath}
              inputValue={headerValue}
              required
              disabled={disabled}
              error={valueInvalid}
              helperText={valueInvalid ? getValueErrorText(headerValue) : undefined}
              specifiedProjectId={specifiedProjectId}
              testId={`openapi-secret-header-value-${index}`}
            />
            {!disabled && (
              <Tooltip
                title="Remove header"
                placement="top"
              >
                <IconButton
                  size="small"
                  onClick={() => handleRemove(name)}
                  data-testid={`openapi-secret-header-remove-${index}`}
                  sx={styles.removeButton}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      })}
      {!disabled && (
        <Box sx={styles.addRow}>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.secondary}
            onClick={handleAdd}
            data-testid="openapi-secret-header-add"
          >
            + Add header
          </Button.BaseBtn>
        </Box>
      )}
    </Box>
  );
});

SecretHeadersInput.displayName = 'SecretHeadersInput';

const secretHeadersInputStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(10rem, 1fr) minmax(14rem, 1.5fr) auto',
    alignItems: 'start',
    gap: '0.75rem',
  },
  value: {
    minWidth: 0,
  },
  removeButton: {
    marginTop: '1.5rem',
  },
  addRow: {
    display: 'flex',
  },
});

export default SecretHeadersInput;
