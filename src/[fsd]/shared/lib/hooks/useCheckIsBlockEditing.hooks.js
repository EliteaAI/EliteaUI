import { useMemo, useState } from 'react';

export const useCheckIsBlockEditing = (canvasId, selectedCodeBlockInfo) => {
  const [blockId] = useState(new Date().getTime());
  const isBlockEditing = useMemo(
    () =>
      (canvasId === selectedCodeBlockInfo?.canvasId && selectedCodeBlockInfo?.canvasId) ||
      (selectedCodeBlockInfo?.isCreatingCanvas && selectedCodeBlockInfo?.blockId === blockId),
    [
      canvasId,
      selectedCodeBlockInfo?.canvasId,
      selectedCodeBlockInfo?.isCreatingCanvas,
      selectedCodeBlockInfo?.blockId,
      blockId,
    ],
  );
  return { isBlockEditing, blockId };
};
