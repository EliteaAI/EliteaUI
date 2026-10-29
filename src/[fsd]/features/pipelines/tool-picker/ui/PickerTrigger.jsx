import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';
import CloseIcon from '@/components/Icons/CloseIcon';

/** Field that opens a picker menu; looks like the other node selects */
const PickerTrigger = memo(props => {
  const {
    label,
    placeholder = 'Select',
    hasValue = false,
    isOpen = false,
    disabled = false,
    onOpen,
    onClear,
    children,
    'data-testid': testId,
  } = props;

  const handleClick = useCallback(
    event => {
      if (!disabled) onOpen?.(event.currentTarget);
    },
    [disabled, onOpen],
  );

  const handleKeyDown = useCallback(
    event => {
      if (disabled || (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'ArrowDown')) return;
      event.preventDefault();
      onOpen?.(event.currentTarget);
    },
    [disabled, onOpen],
  );

  const handleClear = useCallback(
    event => {
      event.stopPropagation();
      onClear?.();
    },
    [onClear],
  );

  const styles = pickerTriggerStyles(isOpen, disabled);

  return (
    <Box
      sx={styles.root}
      className="nopan nodrag"
    >
      {label && (
        <Typography
          variant="bodySmall"
          sx={styles.label}
        >
          {label}
        </Typography>
      )}
      <Box
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={disabled}
        aria-label={label}
        tabIndex={disabled ? -1 : 0}
        sx={styles.field}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        data-testid={testId}
      >
        <Box sx={styles.value}>
          {hasValue ? (
            children
          ) : (
            <Typography
              variant="labelMedium"
              sx={styles.placeholder}
            >
              {placeholder}
            </Typography>
          )}
        </Box>
        {hasValue && onClear && !disabled && (
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            startIcon={<CloseIcon sx={styles.clearIcon} />}
            onClick={handleClear}
            aria-label={`Clear ${label || 'selection'}`}
            data-testid={testId ? `${testId}-clear` : undefined}
          />
        )}
        <Box sx={styles.arrow}>
          <ArrowDownIcon />
        </Box>
      </Box>
    </Box>
  );
});

PickerTrigger.displayName = 'PickerTrigger';

/** @type {MuiSx} */
const pickerTriggerStyles = (isOpen, disabled) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    width: '100%',
    minWidth: 0,
  },
  // Label, value and arrow sit 0.75rem inside the full-width underline, as in the shared SingleSelect
  label: ({ palette }) => ({
    paddingLeft: '0.75rem',
    color: disabled ? palette.text.muted : isOpen ? palette.primary.main : palette.text.primary,
  }),
  field: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minHeight: '2rem',
    padding: '0.25rem 0.75rem',
    borderBottom: `0.0625rem solid ${isOpen ? palette.primary.main : palette.border.lines}`,
    cursor: disabled ? 'default' : 'pointer',
    outline: 'none',
    '&:hover': disabled ? {} : { borderBottomColor: palette.border.hover },
    '&:focus-visible': { borderBottomColor: palette.primary.main },
  }),
  value: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.375rem',
    flex: 1,
    minWidth: 0,
    color: disabled ? palette.text.primary : palette.components.select.text.selected.primary,
  }),
  placeholder: ({ palette }) => ({
    color: palette.text.disabled,
  }),
  clearIcon: {
    fontSize: '0.875rem',
  },
  arrow: ({ palette }) => ({
    display: 'flex',
    color: palette.icon.default,
    transform: isOpen ? 'rotate(180deg)' : 'none',
    transition: 'transform 0.2s',
    '& svg': { fontSize: '1rem' },
  }),
});

export default PickerTrigger;
