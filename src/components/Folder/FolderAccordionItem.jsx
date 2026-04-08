import { useCallback, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { useTheme } from '@emotion/react';

export const FolderAccordionItem = ({ folder, renderConversationItem }) => {
  const theme = useTheme();
  const [hoveredItemId, setHoveredItemId] = useState(null);

  const handleItemHover = useCallback((itemId, isHovered) => {
    setHoveredItemId(isHovered ? itemId : null);
  }, []);
  // Sort conversations by updated_at (most recent first) for better user experience
  const sortedConversations = useMemo(() => {
    if (!folder?.conversations?.length) return [];

    return [...folder.conversations].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0);
      const dateB = new Date(b.updated_at || b.created_at || 0);
      return dateB.getTime() - dateA.getTime(); // Most recent first
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
        sortedConversations.map((conversation, index) => {
          const nextConversation = sortedConversations[index + 1];
          const isNextItemHovered = nextConversation?.id === hoveredItemId;
          return renderConversationItem(conversation, handleItemHover, isNextItemHovered);
        })
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
};
