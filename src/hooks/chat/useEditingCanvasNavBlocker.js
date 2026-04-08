import { useEffect } from 'react';

import useNavBlocker from '../useNavBlocker';

export default function useEditingCanvasNavBlocker(isEditingCanvas) {
  const { setEditingCanvasBlockNav } = useNavBlocker();

  useEffect(() => {
    setEditingCanvasBlockNav(isEditingCanvas);
  }, [setEditingCanvasBlockNav, isEditingCanvas]);

  useEffect(() => {
    return () => {
      setEditingCanvasBlockNav(false);
    };
  }, [setEditingCanvasBlockNav]);

  return {
    setEditingCanvasBlockNav,
  };
}
