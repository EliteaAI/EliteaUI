import { useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

const useChangeFormikTools = ({ toolIndex }) => {
  const { values, setFieldValue } = useFormikContext();
  const isAdding = useMemo(
    () => toolIndex === (values?.version_details?.tools || []).length,
    [toolIndex, values?.version_details?.tools],
  );
  const onChangeTools = useCallback(
    newTool => {
      const newTools = (values?.version_details?.tools || []).map((tool, idx) =>
        idx === toolIndex ? newTool : tool,
      );
      setFieldValue('version_details.tools', newTools);
    },
    [toolIndex, setFieldValue, values?.version_details?.tools],
  );
  return {
    isAdding,
    onChangeTools,
  };
};

export default useChangeFormikTools;
