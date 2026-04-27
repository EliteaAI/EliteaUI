import { memo, useCallback } from 'react';

import { Box, IconButton, Switch } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorState } from '@/[fsd]/features/pipelines/flow-editor/ui';
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
        <Switch
          checked={enabled}
          size="small"
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
          variant="alita"
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
  actionContainer: ({ spacing }) => ({
    width: spacing(3.5),
    height: spacing(4),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  deleteButton: ({ spacing }) => ({
    padding: spacing(0.5),
    alignSelf: 'center',
  }),
  deleteIcon: ({ spacing }) => ({
    fontSize: spacing(2),
  }),
  switch: ({ palette }) => ({
    '& .MuiSwitch-switchBase': {
      color: palette.secondary.main,

      '&.Mui-checked': {
        color: palette.primary.main,

        '& + .MuiSwitch-track': {
          backgroundColor: palette.split.hover,
          opacity: 1,
        },
      },
    },
    '& .MuiSwitch-track': {
      backgroundColor: palette.background.button.secondary.hover,
      opacity: 1,
    },
  }),
});

export default StateVariableItemActions;
