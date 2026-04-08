import { useCallback, useEffect, useMemo, useState } from 'react';

import useNavBlocker from '@/hooks/useNavBlocker';

export const useEditingArtifactsNavBlocker = () => {
  const { setArtifactEditingBlockNav } = useNavBlocker();

  const [previewingArtifact, setPreviewingArtifact] = useState(null);

  const isEditingArtifact = useMemo(() => !!previewingArtifact, [previewingArtifact]);

  useEffect(() => {
    setArtifactEditingBlockNav(!!previewingArtifact);
  }, [setArtifactEditingBlockNav, previewingArtifact]);

  useEffect(() => {
    return () => {
      setArtifactEditingBlockNav(false);
    };
  }, [setArtifactEditingBlockNav]);

  const artifactGutterStyles = useCallback(
    () => ({
      cursor: isEditingArtifact ? 'col-resize' : 'not-allowed',
      pointerEvents: isEditingArtifact ? 'auto' : 'none',
      width: isEditingArtifact ? '1.5rem' : '0rem',
    }),
    [isEditingArtifact],
  );

  return {
    setArtifactEditingBlockNav,
    previewingArtifact,
    setPreviewingArtifact,
    isEditingArtifact,
    artifactGutterStyles,
  };
};
