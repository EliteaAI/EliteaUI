import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, ListItemIcon, ListItemText, Menu, MenuItem, Typography, useTheme } from '@mui/material';

import { NodeTypeSelector } from '@/[fsd]/features/pipelines/flow-editor/ui/add-node';
import NodeIconTile from '@/[fsd]/features/pipelines/flow-editor/ui/nodes/base-node/NodeIconTile';
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
      anchorEl,
      targetNodes,
      availableNodeTypes,
      isNodeCreation: forceNodeCreation || showNodeCreation,
    }),
    [anchorEl, anchorPosition, availableNodeTypes, forceNodeCreation, showNodeCreation, targetNodes],
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

  if (!view || (!view.anchorPosition && !view.anchorEl)) {
    return null;
  }

  const anchorProps = view.anchorEl
    ? {
        anchorEl: view.anchorEl,
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

  const hasTargets = Boolean(view.targetNodes?.length);

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
        list: {
          sx: styles.menuList,
        },
      }}
    >
      <MenuItem
        onClick={handleCreateNewNode}
        sx={styles.createItem}
        data-testid="pipeline-connection-dropdown-create"
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
      {hasTargets ? (
        view.targetNodes.map(node => (
          <MenuItem
            key={node.id}
            onClick={() => handleNodeSelect(node)}
            sx={styles.menuItem}
            data-testid={`pipeline-connection-dropdown-target-${node.id}`}
          >
            <ListItemIcon sx={styles.listItemIcon}>
              <NodeIconTile
                type={node.type}
                size="small"
              />
            </ListItemIcon>
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
        ))
      ) : (
        <Box
          sx={styles.emptyText}
          data-testid="pipeline-connection-dropdown-empty"
        >
          <Typography
            variant="bodySmall"
            color="text.primary"
          >
            No other nodes created yet
          </Typography>
        </Box>
      )}
    </Menu>
  );
});

ConnectionDropdown.displayName = 'ConnectionDropdown';

/** @type {MuiSx} */
const connectionDropdownStyles = () => ({
  menuPaper: ({ palette }) => ({
    maxHeight: '18.75rem',
    minWidth: '15rem',
    maxWidth: '21.875rem',
    borderRadius: '0.75rem',
    border: `.0625rem solid ${palette.border.lines}`,
    boxShadow: palette.boxShadow.default,
    background: palette.background.default.secondary,
    padding: '0rem',
    marginTop: '0.5rem',
  }),
  menuList: {
    padding: '0.25rem 0',
  },
  createItem: ({ palette }) => ({
    minHeight: '2.5rem',
    gap: '0.5rem',
    borderBottom: `.0625rem solid ${palette.border.lines}`,
  }),
  menuItem: {
    minHeight: '2.5rem',
    gap: '0.5rem',
  },
  listItemIcon: {
    display: 'flex',
    justifyContent: 'center',
    minWidth: '1.5rem !important',
    maxWidth: '1.5rem',
  },
  listItemTextPrimary: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '17.5rem',
  },
  emptyText: {
    padding: '0.625rem 1rem',
  },
});

export default ConnectionDropdown;
