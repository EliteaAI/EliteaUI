import React, { memo, useCallback, useMemo, useState } from 'react';

import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import { Box, Collapse, IconButton, Skeleton, Typography } from '@mui/material';

import ListInfiniteMoreLoader from '@/ComponentsLib/ListInfiniteMoreLoader';
import { useTheme } from '@emotion/react';

const DateGroup = memo(props => {
  const {
    group,
    renderConversationItem,
    enableDragAndDrop = false,
    getDropAreaState,
    isExpanded,
    onToggleExpanded,
    onLoadMore,
    isLoadingMore = false,
  } = props;

  const theme = useTheme();

  const [hoveredItemId, setHoveredItemId] = useState(null);

  const handleItemHover = useCallback((itemId, isHovered) => {
    setHoveredItemId(isHovered ? itemId : null);
  }, []);

  const handleToggleExpanded = useCallback(() => {
    onToggleExpanded(group.name);
  }, [group.name, onToggleExpanded]);

  const dropAreaState = useMemo(() => {
    if (enableDragAndDrop && getDropAreaState)
      return getDropAreaState(`date-group-${group.name.toLowerCase().replace(' ', '-')}`);

    return {};
  }, [enableDragAndDrop, getDropAreaState, group.name]);

  // eslint-disable-next-line no-unused-vars
  const { isValidDropTarget, isActive, ...otherDropState } = dropAreaState;

  const groupHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '.5rem .25rem',
    cursor: 'pointer',
    borderRadius: '0rem',
    marginBottom: '.25rem',
    gap: '.5rem',

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
            padding: '.125rem',
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
            fontSize: '.75rem',
            fontWeight: 500,
            textTransform: 'none',
            color: theme.palette.mode === 'dark' ? '#A9B7C1' : '#757575',
          }}
        >
          {group.displayName || group.name}
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

          {isLoadingMore &&
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={`skeleton-${index}`}
                animation="wave"
                variant="rectangular"
                width="100%"
                height="2.5rem"
                sx={{ borderRadius: '.375rem', marginBottom: '2px' }}
              />
            ))}

          <ListInfiniteMoreLoader
            listCurrentSize={group.conversations?.length || 0}
            totalAvailableCount={group.total || 0}
            onLoadMore={onLoadMore}
            isLoading={isLoadingMore}
          />
        </Box>
      </Collapse>
    </Box>
  );
});

DateGroup.displayName = 'DateGroup';

export default DateGroup;
