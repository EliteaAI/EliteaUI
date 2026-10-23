import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ListItemIcon, ListItemText, Menu, MenuItem, Typography, useTheme } from '@mui/material';

import { NodeHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { NodeTypeSelector } from '@/[fsd]/features/pipelines/flow-editor/ui/add-node';
import PlusIcon from '@/components/Icons/PlusIcon';

const POSITION_ANCHOR_ORIGIN = { vertical: 'bottom', horizontal: 'left' };
const POSITION_TRANSFORM_ORIGIN = { vertical: 'top', horizontal: 'left' };
const ELEMENT_ANCHOR_ORIGIN = { vertical: 'bottom', horizontal: 'center' };
const ELEMENT_TRANSFORM_ORIGIN = { vertical: 'top', horizontal: 'center' };

const ConnectionDropdown = memo(props => {
  const {
    open,
    anchorPosition,
    anchorEl,
    targetNodes,
    availableNodeTypes,
    onNodeSelect,
    onNodeCreate,
    onClose,
    forceNodeCreation = false,
  } = props;
  const [showNodeCreation, setShowNodeCreation] = useState(false);
  const theme = useTheme();

  const styles = connectionDropdownStyles();

  useEffect(() => {
    if (!open) setShowNodeCreation(false);
  }, [open]);

  const openView = useMemo(
    () => ({
      anchorPosition: anchorPosition ? { top: anchorPosition.y, left: anchorPosition.x } : undefined,
      targetNodes,
      availableNodeTypes,
      // With no existing targets, open directly into the node type selector
      isNodeCreation: forceNodeCreation || showNodeCreation || !targetNodes?.length,
    }),
    [anchorPosition, availableNodeTypes, forceNodeCreation, showNodeCreation, targetNodes],
  );

  const lastOpenViewRef = useRef(null);

  useEffect(() => {
    if (open) lastOpenViewRef.current = openView;
  }, [open, openView]);

  // The parent clears the position and targets on close, so the last open view is kept for the exit transition
  const view = open ? openView : lastOpenViewRef.current;

  const handleNodeSelect = useCallback(
    node => {
      if (node) {
        onNodeSelect(node);
        onClose();
      }
    },
    [onClose, onNodeSelect],
  );

  const handleCreateNewNode = useCallback(() => {
    setShowNodeCreation(true);
  }, []);

  const getNodeTypeIcon = nodeType => {
    return NodeHelpers.getNodeIconByType(nodeType, theme, theme.palette.icon.default);
  };

  if (!view || (!view.anchorPosition && !anchorEl)) {
    return null;
  }

  const anchorProps = anchorEl
    ? {
        anchorEl,
        anchorOrigin: ELEMENT_ANCHOR_ORIGIN,
        transformOrigin: ELEMENT_TRANSFORM_ORIGIN,
      }
    : {
        anchorReference: 'anchorPosition',
        anchorPosition: view.anchorPosition,
        anchorOrigin: POSITION_ANCHOR_ORIGIN,
        transformOrigin: POSITION_TRANSFORM_ORIGIN,
      };

  if (view.isNodeCreation) {
    return (
      <NodeTypeSelector
        open={open}
        {...anchorProps}
        availableTypes={view.availableNodeTypes}
        onSelect={onNodeCreate}
        onClose={onClose}
      />
    );
  }

  return (
    <Menu
      data-testid="pipeline-connection-dropdown-menu"
      open={open}
      onClose={onClose}
      {...anchorProps}
      slotProps={{
        paper: {
          sx: styles.menuPaper,
        },
      }}
    >
      <MenuItem
        onClick={handleCreateNewNode}
        sx={view.targetNodes?.length ? styles.addNewNodeItem : styles.addNewNodeItemWithoutBorder}
      >
        <ListItemIcon sx={styles.listItemIcon}>
          <PlusIcon fill={theme.palette.icon.default} />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography
              variant="bodyMedium"
              color="text.secondary"
              sx={styles.listItemTextPrimary}
            >
              Create new node
            </Typography>
          }
        />
      </MenuItem>
      {view.targetNodes?.map(node => (
        <MenuItem
          key={node.id}
          onClick={() => handleNodeSelect(node)}
          sx={styles.menuItem}
        >
          <ListItemIcon sx={styles.listItemIcon}>{getNodeTypeIcon(node.type)}</ListItemIcon>
          <ListItemText
            primary={
              <Typography
                variant="bodyMedium"
                color="text.secondary"
                sx={styles.listItemTextPrimary}
              >
                {node.data?.label || node.id}
              </Typography>
            }
          />
        </MenuItem>
      ))}
    </Menu>
  );
});

ConnectionDropdown.displayName = 'ConnectionDropdown';

/** @type {MuiSx} */
const connectionDropdownStyles = () => ({
  menuPaper: ({ palette }) => ({
    maxHeight: 300,
    minWidth: 200,
    maxWidth: 350,
    borderRadius: '0.75rem',
    border: `.0625rem solid ${palette.border.lines}`,
    boxShadow: palette.boxShadow.default,
    background: palette.background.default.secondary,
    padding: '0rem',
    marginTop: '0.5rem',
  }),
  menuItem: {
    minHeight: '2.5rem',
  },
  addNewNodeItem: ({ palette }) => ({
    minHeight: '2.5rem',
    borderBottom: `.0625rem solid ${palette.border.lines}`,
  }),
  addNewNodeItemWithoutBorder: {
    minHeight: '2.5rem',
  },
  listItemIcon: {
    minWidth: '1.5rem',
    maxWidth: '1.5rem',
  },
  listItemTextPrimary: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 280,
  },
});

export default ConnectionDropdown;
