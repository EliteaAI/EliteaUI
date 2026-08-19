import { useContext } from 'react';

import { NodeCardContext } from '@/[fsd]/shared/lib/context';

export const useNodeCardContext = () => {
  const context = useContext(NodeCardContext);

  return context;
};
