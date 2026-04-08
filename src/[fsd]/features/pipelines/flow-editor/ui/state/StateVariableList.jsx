import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Button, useTheme } from '@mui/material';

import {
  FlowEditorConstants,
  StateDrawerConstants,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { StateHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useStateValidation } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { FlowEditorState } from '@/[fsd]/features/pipelines/flow-editor/ui';
import PlusIcon from '@/components/Icons/PlusIcon';

const StateVariableList = memo(props => {
  const { states, drawerWidth, onDeleteState, onToggleState, onUpdateState, onAddState, disabled } = props;
  const theme = useTheme();
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const { validateVariable, clearValidationError } = useStateValidation(states);

  const stateEntries = useMemo(() => {
    return Object.entries(states || FlowEditorConstants.DefaultState)
      .filter(([name]) => !FlowEditorConstants.StateDefaultProps.includes(name))
      .map(([name, config]) => ({
        name,
        type: config.type || 'str',
        value: config.value,
      }));
  }, [states]);

  const validateName = useCallback(
    (name, excludeName = null) => {
      return StateHelpers.validateVariableName(name, excludeName, states);
    },
    [states],
  );

  const handleCancelCreate = useCallback(() => {
    setIsCreatingNew(false);
  }, []);

  const handleUpdateNameWithCreate = useCallback(
    (oldName, newName) => {
      // Create mode: oldName will be empty string
      if (isCreatingNew && oldName === '') {
        const success = onAddState(newName, 'str');
        if (success) {
          setIsCreatingNew(false);
        }
      }
      // Display mode: update existing name
      else if (newName && !states[newName]) {
        onUpdateState(oldName, { newName });
      }
    },
    [isCreatingNew, states, onAddState, onUpdateState],
  );

  const handleToggle = useCallback(
    (name, enabled) => {
      onToggleState(name, enabled);
    },
    [onToggleState],
  );

  const handleDelete = useCallback(
    name => {
      clearValidationError(name);
      onDeleteState(name);
    },
    [onDeleteState, clearValidationError],
  );

  const handleUpdateType = useCallback(
    (stateName, newType) => {
      const currentValue = states?.[stateName]?.value;
      const value =
        currentValue !== undefined && currentValue !== ''
          ? currentValue
          : StateHelpers.getDefaultValueForType(newType);
      onUpdateState(stateName, { type: newType, value });
    },
    [onUpdateState, states],
  );

  const handleUpdateDefaultValue = useCallback(
    (name, type, newValue) => {
      // For List and Json types, validate before converting
      if (
        type === FlowEditorConstants.StateVariableTypes.List ||
        type === FlowEditorConstants.StateVariableTypes.Json ||
        type === FlowEditorConstants.StateVariableTypes.Number
      ) {
        const validationError = validateVariable(name, type, newValue);

        if (validationError) {
          // Store invalid raw value to show validation error in UI
          onUpdateState(name, { value: newValue });
          return;
        }
      } else {
        // For other types (String, Number), clear any existing validation error
        clearValidationError(name);
      }

      // Valid value - convert it properly and update state
      onUpdateState(name, { value: StateHelpers.getValueByType(name, type, newValue) });
    },
    [onUpdateState, validateVariable, clearValidationError],
  );
  const styles = stateVariableListStyles();

  return (
    <Box sx={styles.container}>
      <FlowEditorState.StateVariableItem
        key={FlowEditorConstants.STATE_INPUT}
        name={FlowEditorConstants.STATE_INPUT}
        type={FlowEditorConstants.StateVariableTypes.String}
        enabled={!states || !!states?.[FlowEditorConstants.STATE_INPUT]}
        isDefault
        defaultValue={states?.[FlowEditorConstants.STATE_INPUT]?.value}
        drawerWidth={drawerWidth}
        validateName={validateName}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onUpdateName={handleUpdateNameWithCreate}
        onUpdateType={handleUpdateType}
        onUpdateDefaultValue={handleUpdateDefaultValue}
        editable={false}
        disabled={disabled}
      />
      <FlowEditorState.StateVariableItem
        key={FlowEditorConstants.STATE_MESSAGES}
        name={FlowEditorConstants.STATE_MESSAGES}
        type={FlowEditorConstants.StateVariableTypes.List}
        enabled={!states || !!states?.[FlowEditorConstants.STATE_MESSAGES]}
        isDefault
        defaultValue={StateHelpers.getMessagesFromState(states)}
        drawerWidth={drawerWidth}
        validateName={validateName}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onUpdateName={handleUpdateNameWithCreate}
        onUpdateType={handleUpdateType}
        onUpdateDefaultValue={handleUpdateDefaultValue}
        editable={false}
        disabled={disabled}
      />
      {stateEntries.map(({ name, type, value }) => (
        <FlowEditorState.StateVariableItem
          key={name}
          name={name}
          type={type}
          enabled
          isDefault={false}
          defaultValue={value}
          drawerWidth={drawerWidth}
          validateName={validateName}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onUpdateName={handleUpdateNameWithCreate}
          onUpdateType={handleUpdateType}
          onUpdateDefaultValue={handleUpdateDefaultValue}
          disabled={disabled}
        />
      ))}

      {/* New context creation row */}
      {isCreatingNew && (
        <FlowEditorState.StateVariableItem
          mode={StateDrawerConstants.ItemMode.Create}
          name=""
          type="str"
          enabled
          drawerWidth={drawerWidth}
          validateName={validateName}
          onUpdateName={handleUpdateNameWithCreate}
          onCancel={handleCancelCreate}
        />
      )}

      {/* Add Context button */}
      <Button
        variant="outlined"
        startIcon={
          <Box sx={styles.iconWrapper}>
            <PlusIcon fill={theme.palette.text.secondary} />
          </Box>
        }
        onClick={() => setIsCreatingNew(true)}
        sx={styles.addButton}
        disabled={disabled}
      >
        Context
      </Button>
    </Box>
  );
});

StateVariableList.displayName = 'StateVariableList';

/** @type {MuiSx} */
const stateVariableListStyles = () => ({
  container: ({ spacing }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: spacing(1),
  }),
  iconWrapper: {
    display: 'flex',
    transform: 'scale(0.7)',
  },
  addButton: ({ palette, spacing }) => ({
    minHeight: spacing(3),
    padding: spacing(0.5, 1.5),
    fontSize: '.75rem',
    fontWeight: 400,
    alignSelf: 'flex-start',
    background: 'transparent',
    color: palette.text.secondary,
    textTransform: 'none',
    border: `.0625rem solid ${palette.border.lines}`,
    borderRadius: spacing(2),
    marginTop: spacing(0.75),
    gap: spacing(0),
    '& .MuiButton-startIcon': {
      marginRight: spacing(0.5),
    },
    '&:hover': {
      background: palette.background.button.secondary.hover,
      border: `.0625rem solid ${palette.border.lines}`,
    },
  }),
});

export default StateVariableList;
