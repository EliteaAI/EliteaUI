import React, { useCallback, useMemo, useState } from 'react';

import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import { Box, Collapse, IconButton, Typography } from '@mui/material';

import { useTheme } from '@emotion/react';

const DateGroup = ({
  group,
  renderConversationItem,
  enableDragAndDrop = false,
  getDropAreaState,
  isExpanded,
  onToggleExpanded,
}) => {
  const theme = useTheme();
  const [hoveredItemId, setHoveredItemId] = useState(null);

  const handleItemHover = useCallback((itemId, isHovered) => {
    setHoveredItemId(isHovered ? itemId : null);
  }, []);

  const handleToggleExpanded = useCallback(() => {
    onToggleExpanded(group.name);
  }, [group.name, onToggleExpanded]);

  const dropAreaState = useMemo(() => {
    if (enableDragAndDrop && getDropAreaState) {
      return getDropAreaState(`date-group-${group.name.toLowerCase().replace(' ', '-')}`);
    }
    return {};
  }, [enableDragAndDrop, getDropAreaState, group.name]);

  // Extract drag state for internal logic, but don't spread to DOM

  // eslint-disable-next-line no-unused-vars
  const { isValidDropTarget, isActive, ...otherDropState } = dropAreaState;

  const groupHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '8px 4px',
    cursor: 'pointer',
    borderRadius: '0px',
    marginBottom: '4px',
    gap: '8px',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  };

  return (
    <Box sx={{ marginBottom: '8px' }}>
      <Box
        sx={groupHeaderStyle}
        onClick={handleToggleExpanded}
      >
        <IconButton
          size="small"
          sx={{
            color: theme.palette.mode === 'dark' ? '#A9B7C1' : '#757575',
            padding: '2px',
            minWidth: 'auto',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        >
          <ArrowForwardIosSharpIcon sx={{ fontSize: '14px' }} />
        </IconButton>
        <Typography
          variant="subtitle2"
          sx={{
            fontSize: '12px',
            fontWeight: 500,
            textTransform: 'none',
            color: theme.palette.mode === 'dark' ? '#A9B7C1' : '#757575',
          }}
        >
          {group.name}
        </Typography>
      </Box>

      <Collapse in={isExpanded}>
        <Box
          sx={{
            paddingLeft: '16px',
          }}
        >
          {group.conversations.map((conversation, index) => {
            const nextConversation = group.conversations[index + 1];
            const isNextItemHovered = nextConversation?.id === hoveredItemId;
            return renderConversationItem(conversation, handleItemHover, isNextItemHovered);
          })}
        </Box>
      </Collapse>
    </Box>
  );
};

export default DateGroup;
