import { useCallback, useEffect, useRef, useState } from 'react';

import useNavBlocker from '@/hooks/useNavBlocker';

export const useEditProjectContext = () => {
  const { isEditingProjectContext, setProjectContextEditingBlockNav } = useNavBlocker();
  const setProjectContextEditingBlockNavRef = useRef(setProjectContextEditingBlockNav);

  useEffect(() => {
    setProjectContextEditingBlockNavRef.current = setProjectContextEditingBlockNav;
  }, [setProjectContextEditingBlockNav]);

  const [editingProjectContext, setEditingProjectContext] = useState(null);

  const onShowProjectContextEditor = useCallback(theSelectedProjectContext => {
    if (!theSelectedProjectContext) return;
    setEditingProjectContext(theSelectedProjectContext);
    setProjectContextEditingBlockNavRef.current(true);
  }, []);

  const onCloseProjectContextEditor = useCallback(() => {
    setProjectContextEditingBlockNavRef.current(false);
    setEditingProjectContext(null);
  }, []);

  useEffect(() => {
    return () => {
      setProjectContextEditingBlockNavRef.current(false);
    };
  }, []);

  return {
    isEditingProjectContext,
    editingProjectContext,
    onShowProjectContextEditor,
    onCloseProjectContextEditor,
  };
};
