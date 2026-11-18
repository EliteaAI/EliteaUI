// Starters never take more room than 4 tiles: past 4, the chat grid shows 3 tiles plus a "+N more" tile
// and the New chat list shows 4 rows plus a "Show N more" link.
export const MAX_STARTER_TILES = 4;

export const getChatStartersGridLayout = count => {
  if (count <= MAX_STARTER_TILES) return { tileCount: count, moreCount: 0 };
  return { tileCount: MAX_STARTER_TILES - 1, moreCount: count - (MAX_STARTER_TILES - 1) };
};

export const getNewChatStartersListLayout = (count, isExpanded) => {
  const hiddenCount = Math.max(count - MAX_STARTER_TILES, 0);
  return {
    visibleCount: isExpanded || !hiddenCount ? count : MAX_STARTER_TILES,
    hiddenCount,
  };
};
