import { useContext, useMemo } from 'react';

import { FlowEditorContext } from '@/[fsd]/app/providers';

export const useNodeOptions = (nodeFilter = () => true, addEndNode) => {
  const { yamlJsonObject } = useContext(FlowEditorContext);

  const inputOptions = useMemo(() => {
    const options = (yamlJsonObject.nodes || [])
      .filter(nodeFilter)
      .map(node => ({ label: node.id, value: node.id }));

    if (addEndNode) {
      options.push({ label: 'END', value: 'END' });
    }

    return options;
  }, [nodeFilter, addEndNode, yamlJsonObject.nodes]);

  return inputOptions;
};
