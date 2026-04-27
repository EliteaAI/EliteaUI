import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import {
  FlowEditorConstants,
  StateDrawerConstants,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { StateHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { FlowEditorState } from '@/[fsd]/features/pipelines/flow-editor/ui';
import StyledInputModal from '@/components/StyledInputModal';

const StateVariableItem = memo(props => {
  const {
    mode = StateDrawerConstants.ItemMode.Display,
    name,
    type,
    enabled,
    isDefault,
    defaultValue,
    drawerWidth = 300,
    validateName,
    onToggle,
    onDelete,
    onUpdateName,
    onUpdateType,
    onUpdateDefaultValue,
    onCancel,
    editable = true,
    disabled,
  } = props;

  const isCreateMode = mode === StateDrawerConstants.ItemMode.Create;

  const [isEditing, setIsEditing] = useState(isCreateMode);
  const [editValue, setEditValue] = useState(name);
  const [nameError, setNameError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isDefaultValueModalOpen, setIsDefaultValueModalOpen] = useState(false);

  useEffect(() => {
    setValidationError(StateHelpers.validateValueByType(type, defaultValue));
  }, [type, defaultValue]);

  const handleStartEdit = useCallback(() => {
    if (!isDefault && !isCreateMode) {
      setIsEditing(true);
      setEditValue(name);
    }
  }, [isDefault, isCreateMode, name]);

  const handleNameChange = useCallback(
    e => {
      const newValue = e.target.value;
      setEditValue(newValue);

      // Validate the new name if validator is provided
      if (validateName && newValue && newValue !== name) {
        const error = validateName(newValue, name);
        setNameError(error);
      } else {
        setNameError('');
      }
    },
    [validateName, name],
  );

  const handleNameBlur = useCallback(() => {
    // Update name if changed and valid (works for both create and display modes)
    if (editValue && editValue !== name && !nameError) {
      onUpdateName?.(name, editValue);
    }

    // Create mode: reset if invalid or empty
    if (isCreateMode && (!editValue || nameError)) {
      onCancel?.();
    }

    setIsEditing(false);
    setNameError('');
  }, [editValue, name, nameError, onUpdateName, isCreateMode, onCancel]);

  const handleNameKeyDown = useCallback(
    e => {
      if (e.key === 'Enter') {
        e.target.blur();
      } else if (e.key === 'Escape') {
        if (isCreateMode) {
          onCancel?.();
        } else {
          setIsEditing(false);
          setEditValue(name);
        }
      }
    },
    [name, isCreateMode, onCancel],
  );

  const handleTypeChange = useCallback(
    newType => {
      // Type change only allowed in display mode
      if (!isCreateMode) {
        onUpdateType?.(name, newType);
      }
    },
    [name, onUpdateType, isCreateMode],
  );

  const handleToggleChange = useCallback(
    checked => {
      onToggle?.(name, checked);
    },
    [name, onToggle],
  );

  const handleDeleteClick = useCallback(() => {
    if (isCreateMode) {
      onCancel?.();
    } else {
      onDelete?.(name);
    }
  }, [name, onDelete, isCreateMode, onCancel]);

  const handleDefaultValueClick = useCallback(() => {
    setIsDefaultValueModalOpen(true);
  }, []);

  const handleDefaultValueClose = useCallback(() => {
    setIsDefaultValueModalOpen(false);
  }, []);

  const handleDefaultValueChange = useCallback(
    event => {
      onUpdateDefaultValue?.(name, type, event.target.value);
    },
    [name, type, onUpdateDefaultValue],
  );

  const handleDefaultValueInlineChange = event => {
    onUpdateDefaultValue?.(name, type, event.target.value);
  };

  // Calculate dynamic name field width
  const nameFieldWidth = useMemo(() => StateHelpers.calculateNameFieldWidth(drawerWidth), [drawerWidth]);
  const shouldExpandNameField = useMemo(() => isDefault && !isCreateMode, [isDefault, isCreateMode]);

  const styles = stateVariableItemStyles(isDefault, nameFieldWidth, enabled, shouldExpandNameField);

  return (
    <Box sx={styles.outerContainer}>
      <Box sx={styles.container}>
        {/* Input field with name */}
        {isCreateMode || (!isDefault && isEditing) ? (
          <FlowEditorState.StateVariableTextField
            value={editValue}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            autoFocus={isCreateMode || isEditing}
            error={!!nameError}
            placeholder={isCreateMode ? 'name' : undefined}
            width={nameFieldWidth}
            disabled={disabled}
          />
        ) : (
          <Box
            sx={styles.nameBox}
            onClick={!disabled ? handleStartEdit : undefined}
          >
            <Typography sx={styles.nameText}>{name}</Typography>
          </Box>
        )}

        {/* Actions (type selector, default value, toggle/delete button) */}
        <FlowEditorState.StateVariableItemActions
          type={type}
          enabled={enabled}
          showToggle={!isCreateMode && isDefault}
          drawerWidth={drawerWidth}
          defaultValue={defaultValue}
          disableTypeSelector={isCreateMode || !editable}
          onTypeChange={handleTypeChange}
          onToggle={handleToggleChange}
          onDelete={handleDeleteClick}
          onDefaultValueClick={handleDefaultValueClick}
          onDefaultValueChange={handleDefaultValueInlineChange}
          editable={editable}
          disabled={disabled}
        />
      </Box>
      {/* Default value modal - only for display mode */}
      {!isCreateMode && (
        <StyledInputModal
          open={isDefaultValueModalOpen}
          key={type}
          onClose={handleDefaultValueClose}
          value={StateHelpers.convertValueByType(type, defaultValue)}
          onChange={handleDefaultValueChange}
          hasOnChangeCallback
          title="Default value"
          name={`default-value-${name}`}
          id={`default-value-${name}`}
          specifiedLanguage={
            type === FlowEditorConstants.StateVariableTypes.Json ||
            type === FlowEditorConstants.StateVariableTypes.List
              ? 'json'
              : 'text'
          }
          disabled={disabled}
        />
      )}
      {/* Validation error display */}
      {(nameError || validationError) && (
        <Box sx={styles.errorContainer}>
          <Typography
            variant="caption"
            sx={styles.errorText}
          >
            {nameError || validationError}
          </Typography>
        </Box>
      )}
    </Box>
  );
});

StateVariableItem.displayName = 'StateVariableItem';

export default StateVariableItem;

/** @type {MuiSx} */
const stateVariableItemStyles = (isDefault, nameFieldWidth, enabled, shouldExpandNameField) => ({
  outerContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    minWidth: 0,
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
  },
  errorText: ({ palette }) => ({
    color: palette.error.main,
    fontSize: '0.6875rem',
    lineHeight: 1.3,
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  }),
  errorContainer: ({ spacing }) => ({
    marginLeft: spacing(0.5),
    minWidth: 0,
  }),
  nameBox: ({ spacing, palette }) => ({
    flex: shouldExpandNameField ? 1 : '0 0 auto',
    width: shouldExpandNameField ? 'auto' : nameFieldWidth,
    minWidth: shouldExpandNameField ? 0 : nameFieldWidth,
    padding: spacing(0.5, 1.25),
    borderRadius: spacing(1),
    display: 'flex',
    alignItems: 'center',
    background: palette.background.userInputBackground,
    cursor: !isDefault ? 'text' : 'default',
    opacity: isDefault && !enabled ? 0.5 : 1,
    border: '.0625rem solid transparent',
    height: spacing(4),
    boxSizing: 'border-box',
    '&:hover': {
      borderColor: !isDefault ? palette.border.lines : 'transparent',
    },
  }),
  nameText: ({ typography, palette }) => ({
    ...typography.bodyMedium,
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
  }),
});
