import { memo, useMemo } from 'react';

import { Box, IconButton, TextField, Tooltip } from '@mui/material';

import { StateDrawerConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { StateHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { FlowEditorState } from '@/[fsd]/features/pipelines/flow-editor/ui';
import FullScreenIconSvg from '@/assets/full-screen-icon.svg?react';
import PlusIcon from '@/assets/plus-icon.svg?react';
import SlidersIcon from '@/assets/sliders-icon.svg?react';

const StateVariableDefaultValue = memo(props => {
  const { drawerWidth = 300, defaultValue = '', disabled = false, onIconClick, onChange, type } = props;

  // Determine layout based on drawer width
  const showAsField = drawerWidth > StateDrawerConstants.DRAWER_BREAKPOINT_NARROW;
  const multiline = drawerWidth >= StateDrawerConstants.DRAWER_BREAKPOINT_EXPANDED;

  const styles = stateVariableDefaultValueStyles(multiline);

  const hasDefaultValue = useMemo(() => {
    const typeDefault = StateHelpers.getDefaultValueForType(type);

    return JSON.stringify(defaultValue) !== JSON.stringify(typeDefault);
  }, [defaultValue, type]);

  const handleBlur = e => {
    // Scroll to top when losing focus to show first 5 lines with ellipsis
    if (multiline && e.target) e.target.scrollTop = 0;
  };

  if (showAsField) {
    return (
      <Box sx={styles.fieldContainer}>
        <TextField
          value={StateHelpers.convertValueByType(type, defaultValue)}
          placeholder="Default value"
          disabled={disabled}
          size="small"
          multiline={multiline}
          maxRows={5}
          onChange={onChange}
          onBlur={handleBlur}
          sx={styles.textField}
        />
        {!disabled && onIconClick && (
          <Tooltip
            title="Full screen view"
            placement="top"
          >
            <IconButton
              onClick={e => {
                e.stopPropagation();
                onIconClick();
              }}
              variant="elitea"
              color="tertiary"
              sx={styles.fullScreenButton}
              className="fullscreen-button"
            >
              <Box
                component={FullScreenIconSvg}
                sx={styles.fullScreenIcon}
              />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  if (hasDefaultValue) {
    return (
      <FlowEditorState.StateVariableIconButton
        tooltip="Default value (optional)"
        disabled={disabled}
        onClick={onIconClick}
      >
        <Box
          component={SlidersIcon}
          sx={styles.slidersIcon}
        />
      </FlowEditorState.StateVariableIconButton>
    );
  }

  return (
    <Box sx={styles.addButtonContainer}>
      <Tooltip
        title="Add default value (optional)"
        placement="top"
      >
        <IconButton
          variant="elitea"
          color="tertiary"
          disabled={disabled}
          onClick={onIconClick}
          sx={styles.addButton}
        >
          <Box
            component={PlusIcon}
            sx={styles.addButtonIcon}
          />
        </IconButton>
      </Tooltip>
    </Box>
  );
});

StateVariableDefaultValue.displayName = 'StateVariableDefaultValue';

export default StateVariableDefaultValue;

/** @type {MuiSx} */
const stateVariableDefaultValueStyles = multiline => ({
  fieldContainer: {
    position: 'relative',
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: multiline ? 'flex-start' : 'center',
    '&:hover .fullscreen-button': {
      opacity: 1,
      pointerEvents: 'auto',
    },
  },
  textField: {
    flex: 1,
    minWidth: 0, // Allow field to shrink
    '& .MuiInputBase-root': ({ spacing, palette }) => ({
      minHeight: spacing(4),
      height: multiline ? 'auto' : spacing(4),
      padding: spacing(0.5, 4, 0.5, 1.25), // Always reserve space for button
      borderRadius: spacing(1),
      background: palette.background.userInputBackground,
      fontSize: '.875rem',
      fontWeight: 400,
      color: palette.text.secondary,
      alignItems: multiline ? 'flex-start' : 'center',
      cursor: 'text',
    }),
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'transparent',
      borderWidth: '.0625rem',
    },
    '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': ({ palette }) => ({
      borderColor: palette.border.lines,
      borderWidth: '.0625rem',
    }),
    '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': ({ palette }) => ({
      borderColor: palette.primary.main,
      borderWidth: '.0625rem',
    }),
    '& .MuiInputBase-root.Mui-disabled .MuiOutlinedInput-notchedOutline': {
      borderColor: 'transparent',
      borderWidth: '0rem',
    },
    '& .MuiInputBase-input': ({ palette }) => ({
      padding: '0 !important',
      color: palette.text.secondary,
      cursor: 'text',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: multiline ? '-webkit-box' : 'block',
      WebkitLineClamp: multiline ? 5 : 'unset',
      WebkitBoxOrient: multiline ? 'vertical' : 'unset',
      lineHeight: multiline ? '1.5' : '1.5rem',
    }),
    '& .MuiInputBase-input:focus': {
      display: multiline ? 'block' : 'block',
      WebkitLineClamp: 'unset',
      WebkitBoxOrient: 'unset',
    },
    '& .MuiInputBase-input::placeholder': ({ palette }) => ({
      color: palette.secondary.main,
      opacity: 1,
    }),
  },
  slidersIcon: ({ spacing }) => ({
    fontSize: spacing(1.8),
  }),
  addButtonContainer: ({ spacing }) => ({
    height: spacing(4),
    width: spacing(4),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  addButton: ({ spacing }) => ({
    padding: spacing(0.75),
    alignSelf: 'center',
  }),
  addButtonIcon: ({ spacing }) => ({
    fontSize: spacing(2),
  }),
  fullScreenButton: ({ spacing }) => ({
    position: 'absolute',
    right: spacing(0.5),
    top: '50%',
    transform: 'translateY(-50%)',
    padding: spacing(0.5),
    backgroundColor: 'transparent',
    opacity: 0,
    transition: 'opacity 0.2s ease',
    pointerEvents: 'none',
    '&:hover': {
      backgroundColor: 'transparent',
    },
  }),
  fullScreenIcon: ({ spacing }) => ({
    fontSize: spacing(2),
  }),
});
