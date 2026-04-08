import { useEffect } from 'react';

import { useKeyPress } from '@xyflow/react';

export const useCtrlASelectAll = ({ display, setFlowNodes, setFlowEdges }) => {
  const cmdAndAPressed = useKeyPress(['Meta+a', 'Strg+a', 'Control+a'], {
    target: null,
  });

  useEffect(() => {
    if (cmdAndAPressed && display !== 'none') {
      setFlowNodes(prevNodes => prevNodes.map(node => ({ ...node, selected: true })));
      setFlowEdges(prevEdges => prevEdges.map(edge => ({ ...edge, selected: true })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmdAndAPressed]);
};
