import { memo, useCallback, useMemo, useState } from 'react';

import {
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';

import {
  DeprecatedConstants,
  FlowEditorConstants,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { NodeHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import PlusIcon from '@/components/Icons/PlusIcon';

const getVisibleNodeTypes = () => {
  return Object.keys(FlowEditorConstants.PipelineNodeTypes)
    .sort()
    .filter(nodeType => !DeprecatedConstants.DeprecatedOrInvisibleNode.includes(nodeType))
    .map(nodeType => FlowEditorConstants.PipelineNodeTypes[nodeType]);
};

const PipelineAddNodeMenu = memo(props => {
  const { onAddNode, disabled } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const theme = useTheme();
  const styles = componentStyles();

  const menuItems = useMemo(() => {
    return getVisibleNodeTypes()
      .map(nodeType => ({
        type: nodeType,
        label: FlowEditorConstants.PipelineNodeDisplayNames[nodeType],
        icon: NodeHelpers.getNodeIconByType(nodeType, theme, theme.palette.icon.fill.secondary),
      }))
      .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
  }, [theme]);

  const leftColumnItems = useMemo(() => menuItems.slice(0, 6), [menuItems]);
  const rightColumnItems = useMemo(() => menuItems.slice(6), [menuItems]);

  const handleOpen = useCallback(event => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleItemClick = useCallback(
    nodeType => () => {
      onAddNode(nodeType);
      handleClose();
    },
    [handleClose, onAddNode],
  );

  return (
    <>
      <Tooltip
        title="Add node"
        placement="top"
        enterDelay={500}
      >
        <IconButton
          variant="elitea"
          color="primary"
          id="pipeline-add-node-menu-action"
          aria-label="Add node"
          aria-controls={open ? 'pipeline-add-node-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleOpen}
          disabled={disabled}
          sx={styles.triggerButton}
        >
          <PlusIcon fill={theme.palette.icon.fill.send} />
        </IconButton>
      </Tooltip>
      <Menu
        id="pipeline-add-node-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: styles.menuPaper,
          },
          list: {
            sx: styles.menuList,
          },
        }}
      >
        <Box sx={styles.menuColumns}>
          <Box sx={styles.menuColumn}>
            {leftColumnItems.map(item => (
              <MenuItem
                key={item.type}
                onClick={handleItemClick(item.type)}
                sx={styles.menuItem}
              >
                <ListItemIcon sx={styles.listItemIcon}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      variant="bodyMedium"
                      color="text.secondary"
                      noWrap
                    >
                      {item.label}
                    </Typography>
                  }
                />
              </MenuItem>
            ))}
          </Box>
          <Box sx={styles.menuColumn}>
            {rightColumnItems.map(item => (
              <MenuItem
                key={item.type}
                onClick={handleItemClick(item.type)}
                sx={styles.menuItem}
              >
                <ListItemIcon sx={styles.listItemIcon}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      variant="bodyMedium"
                      color="text.secondary"
                      noWrap
                    >
                      {item.label}
                    </Typography>
                  }
                />
              </MenuItem>
            ))}
          </Box>
        </Box>
      </Menu>
    </>
  );
});

PipelineAddNodeMenu.displayName = 'PipelineAddNodeMenu';

export default PipelineAddNodeMenu;
/** @type {MuiSx} */
const componentStyles = () => ({
  triggerButton: {
    marginLeft: '0px',
  },
  menuPaper: ({ palette }) => ({
    marginTop: '0.625rem',
    padding: '0.5rem',
    borderRadius: '0.75rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    background: palette.background.secondary,
    boxShadow: '0 1rem 2rem rgba(3, 12, 28, 0.35)',
    overflow: 'hidden',
  }),
  menuList: {
    padding: 0,
  },
  menuColumns: {
    display: 'flex',
  },
  menuColumn: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '13rem',
    gap: '0.125rem',
    padding: '0 0.25rem',
  },
  menuItem: ({ palette }) => ({
    minHeight: '3rem',
    borderRadius: '0.625rem',
    '&:hover': {
      backgroundColor: palette.background.conversation.hover,
    },
  }),
  listItemIcon: ({ palette }) => ({
    minWidth: '1.5rem !important',
    maxWidth: '1.5rem',
    color: palette.icon.fill.secondary,
    '& svg': {
      width: '1rem',
      height: '1rem',
      display: 'block',
    },
  }),
});
