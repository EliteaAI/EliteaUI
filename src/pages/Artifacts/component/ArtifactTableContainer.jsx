import { memo, useCallback, useMemo, useState } from 'react';

import { GridTableContainer } from '@/[fsd]/entities/grid-table/ui';

const ArtifactTableContainer = memo(props => {
  const { children, toolbar, onDrop, isLoading, loadingMessage } = props;

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback(event => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    event => {
      event.preventDefault();
      setIsDragOver(false);
      onDrop?.(event);
    },
    [onDrop],
  );

  const dragDropProps = useMemo(
    () => ({
      onDrop: handleDrop,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
    }),
    [handleDrop, handleDragOver, handleDragLeave],
  );

  const dragDropStyles = useMemo(() => artifactTableContainerStyles(isDragOver), [isDragOver]);

  return (
    <GridTableContainer
      toolbar={toolbar}
      isLoading={isLoading}
      loadingMessage={loadingMessage}
      sx={dragDropStyles.root}
      containerProps={dragDropProps}
    >
      {children}
    </GridTableContainer>
  );
});

ArtifactTableContainer.displayName = 'ArtifactTableContainer';

/** @type {MuiSx} */
const artifactTableContainerStyles = isDragOver => ({
  root: ({ palette }) => ({
    backgroundColor: isDragOver ? palette.background.dragging : undefined,
    transition: 'background-color 0.2s ease',
  }),
});

export default ArtifactTableContainer;
