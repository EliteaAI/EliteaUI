import { useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { actions as editorActions } from '@/slices/pipelineEditor.js';

export const useSaveNodesAndEdges = () => {
  const dispatch = useDispatch();

  const setNodes = useCallback(
    param => {
      dispatch(editorActions.setNodes(param));
    },
    [dispatch],
  );

  const setEdges = useCallback(
    param => {
      dispatch(editorActions.setEdges(param));
    },
    [dispatch],
  );

  return {
    setNodes,
    setEdges,
  };
};
