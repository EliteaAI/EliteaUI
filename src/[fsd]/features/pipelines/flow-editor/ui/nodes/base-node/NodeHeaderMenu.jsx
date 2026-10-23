import { memo, useCallback, useContext, useMemo } from 'react';

import { Box } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import EntrypointIcon from '@/assets/entrypoint-icon.svg?react';
import DotMenu from '@/components/DotMenu';
import DeleteIcon from '@/components/Icons/DeleteIcon';

// Temporary: removed once the node form gets its own actions (#7157)
const NodeHeaderMenu = memo(props => {
  const { name, isEntrypoint, type, id, disabled } = props;
  const { yamlJsonObject, setYamlJsonObject, handleDeleteNode } = useContext(FlowEditorContext);

  const styles = nodeHeaderMenuStyles();

  const handleMakeEntrypoint = useCallback(() => {
    setYamlJsonObject({
      ...yamlJsonObject,
      entry_point: name,
    });
  }, [name, setYamlJsonObject, yamlJsonObject]);

  const handleDelete = useCallback(() => {
    handleDeleteNode(id);
  }, [handleDeleteNode, id]);

  const menuItems = useMemo(() => {
    const deleteItem = {
      label: 'Delete',
      icon: (
        <Box sx={styles.menuIconWrapper}>
          <DeleteIcon style={styles.menuIconStyle} />
        </Box>
      ),
      disabled,
      onClick: handleDelete,
    };
    const canMakeEntrypoint =
      !isEntrypoint &&
      type !== FlowEditorConstants.PipelineNodeTypes.Condition &&
      type !== FlowEditorConstants.PipelineNodeTypes.Decision;

    return canMakeEntrypoint
      ? [
          {
            label: 'Make entrypoint',
            icon: (
              <Box sx={styles.menuIconWrapper}>
                <EntrypointIcon style={styles.menuIconStyle} />
              </Box>
            ),
            disabled,
            onClick: handleMakeEntrypoint,
          },
          deleteItem,
        ]
      : [deleteItem];
  }, [
    isEntrypoint,
    type,
    handleMakeEntrypoint,
    disabled,
    handleDelete,
    styles.menuIconWrapper,
    styles.menuIconStyle,
  ]);

  return (
    <DotMenu
      id="node-menu"
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      slotProps={{
        ListItemText: {
          sx: styles.dotMenuItemText,
          primaryTypographyProps: { variant: 'bodyMedium' },
        },
        ListItemIcon: {
          sx: styles.dotMenuItemIcon,
        },
      }}
    >
      {menuItems}
    </DotMenu>
  );
});

NodeHeaderMenu.displayName = 'NodeHeaderMenu';

/** @type {MuiSx} */
const nodeHeaderMenuStyles = () => ({
  // Style objects for SVG icons (use style prop, not sx)
  menuIconStyle: {
    fontSize: '1rem',
  },
  menuIconWrapper: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '1rem',
    height: '1rem',
    color: palette.icon.default,
  }),
  dotMenuItemText: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  dotMenuItemIcon: {
    minWidth: '1rem !important',
    marginRight: '.75rem',
  },
});

export default NodeHeaderMenu;
