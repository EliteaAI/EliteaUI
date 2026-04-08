import { useContext } from 'react';

import { NodeCardContext } from '@/[fsd]/app/providers';

export const useNodeCardContext = () => {
  const context = useContext(NodeCardContext);

  return context;
};
