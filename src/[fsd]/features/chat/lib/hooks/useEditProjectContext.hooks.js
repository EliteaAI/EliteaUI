import { useCallback, useEffect, useState } from 'react';

import useNavBlocker from '@/hooks/useNavBlocker';

export const useEditProjectContext = () => {
  const { isEditingProjectContext, setProjectContextEditingBlockNav } = useNavBlocker();
  const [editingProjectContext, setEditingProjectContext] = useState(null);

  const onShowProjectContextEditor = useCallback(
    theSelectedProjectContext => {
      if (!theSelectedProjectContext) return;
      setEditingProjectContext(theSelectedProjectContext);
      setProjectContextEditingBlockNav(true);
    },
    [setProjectContextEditingBlockNav],
  );

  const onCloseProjectContextEditor = useCallback(() => {
    setProjectContextEditingBlockNav(false);
    setEditingProjectContext(null);
  }, [setProjectContextEditingBlockNav]);

  useEffect(() => {
    return () => {
      setProjectContextEditingBlockNav(false);
    };
  }, [setProjectContextEditingBlockNav]);

  return {
    isEditingProjectContext,
    editingProjectContext,
    onShowProjectContextEditor,
    onCloseProjectContextEditor,
  };
};
