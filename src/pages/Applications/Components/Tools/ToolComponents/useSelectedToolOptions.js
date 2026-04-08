import { useMemo } from 'react';

import { getAvailableTools } from '@/common/toolkitUtils';

export default function useSelectedToolOptions({ schema, defaultToolOptions }) {
  const selectedToolsOptions = useMemo(() => {
    return getAvailableTools(schema?.properties?.selected_tools, defaultToolOptions);
  }, [defaultToolOptions, schema?.properties?.selected_tools]);

  return selectedToolsOptions;
}
