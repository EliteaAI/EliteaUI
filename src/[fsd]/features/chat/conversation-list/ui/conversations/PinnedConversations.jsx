import { memo, useCallback, useState } from 'react';

const PinnedConversations = memo(props => {
  const { pinnedConversations, renderConversationItem } = props;

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
});

PinnedConversations.displayName = 'PinnedConversations';

export default PinnedConversations;
