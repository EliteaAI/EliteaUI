import { useCallback, useState } from 'react';

export const PinnedConversations = ({ pinnedConversations, renderConversationItem }) => {
  const [hoveredItemId, setHoveredItemId] = useState(null);
  const handleItemHover = useCallback((itemId, isHovered) => {
    setHoveredItemId(isHovered ? itemId : null);
  }, []);
  return (
    <>
      {pinnedConversations.length > 0 && (
        <>
          {pinnedConversations.map((conversation, index) => {
            const nextConversation = pinnedConversations[index + 1];
            const isNextItemHovered = nextConversation?.id === hoveredItemId;
            return renderConversationItem(conversation, handleItemHover, isNextItemHovered);
          })}
        </>
      )}
    </>
  );
};
