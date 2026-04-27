import { memo, useCallback } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { StateHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useResizableDrawer } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { FlowEditorState } from '@/[fsd]/features/pipelines/flow-editor/ui';
import ClipboardIcon from '@/assets/clipboard-icon.svg?react';
import CloseIcon from '@/components/Icons/CloseIcon';
import { useTheme } from '@emotion/react';

const StateDrawer = memo(props => {
  const { isOpen, onClose, setYamlJsonObject, yamlJsonObject, disabled } = props;
  const theme = useTheme();

  const { containerRef, drawerWidth, isResizing, isHoveringHandle, setIsHoveringHandle, handleResizeStart } =
    useResizableDrawer();

  const handleToggleState = (name, enabled) => {
    let newState = null;
    // If state is undefined/null, initialize with DefaultState before toggling
    const oldState = yamlJsonObject?.state || { ...FlowEditorConstants.DefaultState };
    if (enabled) {
      newState = {
        ...oldState,
        [name]: {
          type:
            name === FlowEditorConstants.STATE_MESSAGES
              ? FlowEditorConstants.StateVariableTypes.List
              : FlowEditorConstants.StateVariableTypes.String,
        },
      };
    } else {
      newState = { ...oldState };
      delete newState[name];
    }
    setYamlJsonObject({
      ...yamlJsonObject,
      state: newState,
    });
  };

  const handleUpdateState = (name, changes) => {
    const updated = { ...(yamlJsonObject?.state || {}) };
    if (changes.newName && changes.newName !== name) {
      updated[changes.newName] = { ...updated[name] };
      delete updated[name];
    } else {
      updated[name] = { ...updated[name], ...changes };
    }
    setYamlJsonObject({
      ...yamlJsonObject,
      state: updated,
    });
  };

  const handleDeleteState = name => {
    const oldState = yamlJsonObject?.state || {};
    const newState = { ...oldState };
    delete newState[name];
    setYamlJsonObject({
      ...yamlJsonObject,
      state: newState,
    });
  };

  const handleAddState = useCallback(
    (name, type = 'str') => {
      // Validate name
      if (!name) return false;
      if (yamlJsonObject.state?.[name]) return false;
      // Combined validation: starts with letter, followed by letters/numbers/underscores
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) return false;
      const updated = { ...(yamlJsonObject?.state || FlowEditorConstants.DefaultState) };
      updated[name] = { type, value: StateHelpers.getDefaultValueForType(type) };
      setYamlJsonObject({
        ...yamlJsonObject,
        state: updated,
      });
      return true;
    },
    [setYamlJsonObject, yamlJsonObject],
  );

  const styles = stateDrawerStyles(drawerWidth, isResizing, isHoveringHandle);

  if (!isOpen) return null;

  return (
    <>
      <Box
        ref={containerRef}
        sx={styles.container}
      >
        {/* Resize Handle */}
        <Box
          sx={styles.resizeHandle}
          onMouseDown={handleResizeStart}
          onMouseEnter={() => setIsHoveringHandle(true)}
          onMouseLeave={() => setIsHoveringHandle(false)}
        />
        <Box sx={styles.header}>
          <Box sx={styles.headerContent}>
            <Box sx={styles.headerIcon}>
              <ClipboardIcon fill={theme.palette.icon.fill.secondary} />
            </Box>
            <Typography
              variant="labelSmall"
              sx={styles.headerTitle}
            >
              STATE
            </Typography>
          </Box>
          <IconButton
            sx={styles.closeButton}
            variant="alita"
            color="tertiary"
            onClick={onClose}
          >
            <CloseIcon
              fill={theme.palette.icon.fill.default}
              sx={styles.closeIcon}
            />
          </IconButton>
        </Box>
        <Box sx={styles.content}>
          <FlowEditorState.StateVariableList
            states={yamlJsonObject?.state}
            drawerWidth={drawerWidth}
            onUpdateState={handleUpdateState}
            onDeleteState={handleDeleteState}
            onToggleState={handleToggleState}
            onAddState={handleAddState}
            disabled={disabled}
          />
        </Box>
      </Box>
    </>
  );
});

StateDrawer.displayName = 'StateDrawer';

/** @type {MuiSx} */
const stateDrawerStyles = (width, isResizing, isHovering) => ({
  container: ({ palette }) => ({
    position: 'absolute',
    top: 0,
    right: 0,
    width: `${width}px`,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: `.0625rem solid ${isResizing ? palette.primary.pressed : isHovering ? palette.border.flowNode : palette.border.lines}`,
    background: palette.background.secondary,
    zIndex: 10,
    transition: isResizing ? 'none' : 'border-color 0.2s ease',
  }),
  resizeHandle: {
    position: 'absolute',
    left: '-0.25rem',
    top: 0,
    width: '.5rem',
    height: '100%',
    cursor: 'ew-resize',
    zIndex: 11,
  },
  header: ({ spacing, palette }) => ({
    height: spacing(5.5),
    padding: spacing(1, 1.5, 1, 2),
    width: '100%',
    borderBottom: `.0625rem solid ${palette.border.lines}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }),
  headerContent: ({ spacing }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: spacing(0.8),
  }),
  headerIcon: ({ spacing }) => ({
    display: 'flex',
    alignItems: 'center',
    fontSize: spacing(2),
  }),
  headerTitle: ({ palette }) => ({
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: palette.text.primary,
  }),
  closeButton: ({ spacing }) => ({
    marginLeft: 0,
    padding: spacing(1),
  }),
  closeIcon: ({ spacing }) => ({
    fontSize: spacing(2.5),
  }),
  content: ({ spacing }) => ({
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    paddingX: spacing(2),
    paddingTop: spacing(2),
    paddingBottom: spacing(2),
    boxSizing: 'border-box',
    width: '100%',
    flex: 1,
    gap: spacing(2),
  }),
});

export default StateDrawer;
