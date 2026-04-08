import { useCallback, useState } from 'react';

export const useFileDragAndDrop = onDropHandler => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback(
    event => {
      event.preventDefault();
      event.stopPropagation();
      if (!isDragOver) {
        setIsDragOver(true);
      }
    },
    [isDragOver],
  );

  const handleDragLeave = useCallback(event => {
    event.preventDefault();
    event.stopPropagation();

    const relatedTarget = event.relatedTarget;
    const currentTarget = event.currentTarget;

    if (!currentTarget.contains(relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    event => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);
      if (onDropHandler) {
        onDropHandler(event);
      }
    },
    [onDropHandler],
  );

  return {
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};
