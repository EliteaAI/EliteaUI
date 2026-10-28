import { useMemo } from 'react';

import { useFormikContext } from 'formik';

// Toolkit names attached to the pipeline; a node can't take one of them as its id
export const useNodeToolNames = () => {
  const { values: { version_details: { tools = [] } = {} } = {} } = useFormikContext() || {};
  return useMemo(() => tools?.map(tool => tool.toolkit_name || tool.name) || [], [tools]);
};
