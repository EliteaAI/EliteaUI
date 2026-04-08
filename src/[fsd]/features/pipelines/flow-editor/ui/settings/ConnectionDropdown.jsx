import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, ListItemIcon, ListItemText, Menu, MenuItem, Typography, useTheme } from '@mui/material';

import {
  DeprecatedConstants,
  FlowEditorConstants,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { NodeHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { capitalizeFirstChar } from '@/common/utils';
import PlusIcon from '@/components/Icons/PlusIcon';

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
    if (!open) {
      setShowNodeCreation(false);
      return;
    }

    if (forceNodeCreation) {
      setShowNodeCreation(true);
      return;
    }

    // When there are no existing targets, open directly into the node grid.
    setShowNodeCreation(!targetNodes?.length);
  }, [forceNodeCreation, open, targetNodes]);

  const nodeCreationMenuItems = useMemo(() => {
    // Use provided availableNodeTypes if available, otherwise fall back to all types
    const nodeTypesToShow =
      availableNodeTypes?.filter(nodeType => !DeprecatedConstants.DeprecatedNodes.includes(nodeType)) ||
      Object.keys(FlowEditorConstants.PipelineNodeTypes)
        .sort()
        .filter(item => !DeprecatedConstants.DeprecatedOrInvisibleNode.includes(item))
        .map(key => FlowEditorConstants.PipelineNodeTypes[key]);

    return nodeTypesToShow
      .map(nodeType => {
        return {
          label:
            FlowEditorConstants.PipelineNodeDisplayNames?.[nodeType] ||
            capitalizeFirstChar(nodeType.split('_').join(' ')),
          type: nodeType,
          icon: NodeHelpers.getNodeIconByType(nodeType, theme, theme.palette.icon.fill.secondary),
        };
      })
      .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
  }, [theme, availableNodeTypes]);

  const handleClose = useCallback(() => {
    setShowNodeCreation(false);
    onClose();
  }, [onClose]);

  const handleNodeSelect = useCallback(
    node => {
      if (node) {
        onNodeSelect(node);
        handleClose();
      }
    },
    [handleClose, onNodeSelect],
  );

  const handleCreateNewNode = useCallback(() => {
    setShowNodeCreation(true);
  }, []);

  const handleNodeTypeSelect = useCallback(
    nodeType => {
      onNodeCreate(nodeType);
      handleClose();
    },
    [handleClose, onNodeCreate],
  );

  const getNodeTypeIcon = nodeType => {
    return NodeHelpers.getNodeIconByType(nodeType, theme, theme.palette.icon.fill.default);
  };

  if (!open || (!anchorPosition && !anchorEl)) {
    return null;
  }

  const menuAnchorProps = anchorEl
    ? {
        anchorEl,
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'center',
        },
        transformOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      }
    : {
        anchorReference: 'anchorPosition',
        anchorPosition: {
          top: anchorPosition.y,
          left: anchorPosition.x,
        },
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'left',
        },
        transformOrigin: {
          vertical: 'top',
          horizontal: 'left',
        },
      };

  return (
    <Menu
      open={open}
      onClose={handleClose}
      {...menuAnchorProps}
      slotProps={{
        paper: {
          sx: showNodeCreation ? styles.gridMenuPaper : styles.menuPaper,
        },
      }}
    >
      {showNodeCreation ? (
        <>
          {(() => {
            const midpoint = Math.ceil(nodeCreationMenuItems.length / 2);
            const firstColumnItems = nodeCreationMenuItems.slice(0, midpoint);
            const secondColumnItems = nodeCreationMenuItems.slice(midpoint);

            return (
              <>
                <Box
                  component="div"
                  sx={styles.gridColumn}
                >
                  {firstColumnItems.map(item => (
                    <MenuItem
                      key={item.type}
                      onClick={() => handleNodeTypeSelect(item.type)}
                      sx={styles.gridMenuItem}
                    >
                      <ListItemIcon sx={styles.gridListItemIcon}>{item.icon}</ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            variant="bodyMedium"
                            color="text.secondary"
                            sx={styles.gridListItemTextPrimary}
                          >
                            {item.label}
                          </Typography>
                        }
                      />
                    </MenuItem>
                  ))}
                </Box>
                <Box
                  component="div"
                  sx={styles.gridColumn}
                >
                  {secondColumnItems.map(item => (
                    <MenuItem
                      key={item.type}
                      onClick={() => handleNodeTypeSelect(item.type)}
                      sx={styles.gridMenuItem}
                    >
                      <ListItemIcon sx={styles.gridListItemIcon}>{item.icon}</ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            variant="bodyMedium"
                            color="text.secondary"
                            sx={styles.gridListItemTextPrimary}
                          >
                            {item.label}
                          </Typography>
                        }
                      />
                    </MenuItem>
                  ))}
                </Box>
              </>
            );
          })()}
        </>
      ) : (
        <>
          <MenuItem
            onClick={handleCreateNewNode}
            sx={targetNodes?.length ? styles.addNewNodeItem : styles.addNewNodeItemWithoutBorder}
          >
            <ListItemIcon sx={styles.listItemIcon}>
              <PlusIcon fill={theme.palette.icon.fill.default} />
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
          {targetNodes &&
            targetNodes.length > 0 &&
            targetNodes.map(node => (
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
        </>
      )}
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
    background: palette.background.secondary,
    padding: '0rem',
    marginTop: '0.5rem',
  }),
  gridMenuPaper: ({ palette }) => ({
    maxHeight: 300,
    minWidth: '27.25rem',
    maxWidth: '27.25rem',
    borderRadius: '0.75rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    boxShadow: '0 1rem 2rem rgba(3, 12, 28, 0.35)',
    background: palette.background.secondary,
    padding: '0.5rem 0.75rem',
    marginTop: '0.625rem',
    overflow: 'hidden',
    '& .MuiMenu-list': {
      display: 'flex',
      flexDirection: 'row',
      padding: 0,
    },
  }),
  gridColumn: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
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
  gridListItemIcon: ({ palette }) => ({
    minWidth: '1.5rem !important',
    maxWidth: '1.5rem',
    color: palette.icon.fill.secondary,
    '& svg': {
      width: '1rem',
      height: '1rem',
      display: 'block',
    },
  }),
  gridMenuItem: ({ palette }) => ({
    minHeight: '3rem',
    borderRadius: '0.625rem',
    gap: '0.5rem',
    '&:hover': {
      backgroundColor: palette.background.conversation.hover,
    },
  }),
  gridListItemTextPrimary: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '10.25rem',
  },
});

export default ConnectionDropdown;
