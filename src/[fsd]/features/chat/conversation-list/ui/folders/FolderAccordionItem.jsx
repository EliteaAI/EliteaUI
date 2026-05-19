import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Skeleton, Typography } from '@mui/material';

import ListInfiniteMoreLoader from '@/ComponentsLib/ListInfiniteMoreLoader';
import { useTheme } from '@emotion/react';

const FolderAccordionItem = memo(props => {
  const { folder, renderConversationItem, onLoadMore, isLoadingMore } = props;

  const theme = useTheme();

  const [hoveredItemId, setHoveredItemId] = useState(null);

  const handleItemHover = useCallback((itemId, isHovered) => {
    setHoveredItemId(isHovered ? itemId : null);
  }, []);

  const sortedConversations = useMemo(() => {
    if (!folder?.conversations?.length) return [];

    return [...folder.conversations].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0);
      const dateB = new Date(b.updated_at || b.created_at || 0);

      return dateB.getTime() - dateA.getTime();
    });
  }, [folder?.conversations]);

  return (
    <Box
      sx={{
        borderBottom: !sortedConversations?.length
          ? `1px solid ${theme.palette.background.button.drawerMenu.selected}`
          : undefined,
        color: theme.palette.text.tagChip.disabled,
      }}
    >
      {sortedConversations?.length ? (
        <>
          {sortedConversations.map((conversation, index) => {
            const nextConversation = sortedConversations[index + 1];
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
            listCurrentSize={sortedConversations.length}
            totalAvailableCount={folder.total || 0}
            onLoadMore={onLoadMore || (() => {})}
            isLoading={isLoadingMore}
          />
        </>
      ) : (
        <Typography
          variant="bodyMedium"
          sx={{
            lineHeight: '48px',
            marginLeft: '8px',
          }}
        >
          No conversations added
        </Typography>
      )}
    </Box>
  );
});

FolderAccordionItem.displayName = 'FolderAccordionItem';

export default FolderAccordionItem;
