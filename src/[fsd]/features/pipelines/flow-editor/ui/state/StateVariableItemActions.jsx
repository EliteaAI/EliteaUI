import { memo, useCallback } from 'react';

import { Box, IconButton } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorState } from '@/[fsd]/features/pipelines/flow-editor/ui';
import { Switch } from '@/[fsd]/shared/ui';
import DeleteIcon from '@/components/Icons/DeleteIcon';

const StateVariableItemActions = memo(props => {
  const {
    type,
    enabled,
    showToggle = false,
    drawerWidth = 300,
    disableTypeSelector = false,
    defaultValue = '',
    onTypeChange,
    onToggle,
    onDelete,
    onDefaultValueClick,
    onDefaultValueChange,
    editable = true,
    disabled,
  } = props;

  const styles = stateVariableItemActionsStyles();

  const handleToggle = useCallback(e => onToggle?.(e.target.checked), [onToggle]);

  if (showToggle) {
    return (
      <Box sx={styles.actionContainer}>
        <Switch.BaseSwitch
          checked={enabled}
          onChange={handleToggle}
          sx={styles.switch}
          disabled={disabled}
        />
      </Box>
    );
  }

  return (
    <>
      {/* Type selector */}
      <FlowEditorState.StateTypeSelector
        type={
          type === FlowEditorConstants.LegacyIntType ? FlowEditorConstants.StateVariableTypes.Number : type
        }
        onTypeChange={onTypeChange}
        disabled={disableTypeSelector}
      />

      {/* Default value - either icon button or text field based on drawer width */}
      <FlowEditorState.StateVariableDefaultValue
        drawerWidth={drawerWidth}
        defaultValue={defaultValue}
        disabled={!editable}
        onIconClick={onDefaultValueClick}
        onChange={onDefaultValueChange}
        type={type}
      />
      <Box sx={styles.actionContainer}>
        <IconButton
          onClick={onDelete}
          variant="elitea"
          color="tertiary"
          disabled={disabled}
          sx={styles.deleteButton}
        >
          <Box
            component={DeleteIcon}
            sx={styles.deleteIcon}
          />
        </IconButton>
      </Box>
    </>
  );
});

StateVariableItemActions.displayName = 'StateVariableItemActions';

/** @type {MuiSx} */
const stateVariableItemActionsStyles = () => ({
  actionContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    padding: '0.25rem',
    alignSelf: 'center',
  },
  deleteIcon: {
    fontSize: '1rem',
  },
});

export default StateVariableItemActions;
