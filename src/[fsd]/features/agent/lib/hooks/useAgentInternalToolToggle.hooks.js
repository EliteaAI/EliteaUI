import { useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

export const useAgentInternalToolToggle = ({ name, unavailable = false }) => {
  const { values, setFieldValue } = useFormikContext();

  const internalTools = useMemo(
    () => values?.version_details?.meta?.internal_tools || [],
    [values?.version_details?.meta],
  );

  const checked = internalTools.includes(name) && !unavailable;

  const onToggle = useCallback(
    checkedValue => {
      if (unavailable) return;
      setFieldValue(
        'version_details.meta.internal_tools',
        checkedValue ? [...new Set([...internalTools, name])] : internalTools.filter(t => t !== name),
      );
    },
    [setFieldValue, internalTools, name, unavailable],
  );

  return { checked, onToggle };
};
