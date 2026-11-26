import { memo, useEffect, useRef } from 'react';

import { useFormikContext } from 'formik';

/** Reports the sandbox tools upward; pickers write them through the nested Formik */
const SandboxToolsWatcher = memo(props => {
  const { onToolsChange } = props;
  const { values } = useFormikContext();
  const tools = values?.version_details?.tools;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onToolsChange?.(tools || []);
  }, [onToolsChange, tools]);

  return null;
});

SandboxToolsWatcher.displayName = 'SandboxToolsWatcher';

export default SandboxToolsWatcher;
