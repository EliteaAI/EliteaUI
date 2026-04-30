import { memo } from 'react';

import { useSelector } from 'react-redux';

import useValidateToolkit from '@/hooks/application/useValidateToolkit';

/**
 * Renders nothing but triggers validation for one toolkit.
 * Skips the API call when validation data already exists in Redux so we
 * don't re-validate on every render; RTK Query handles caching for the rest.
 */
const ToolkitValidator = memo(props => {
  const { toolkitId, projectId } = props;
  const selectorKey = `${projectId}_${toolkitId}`;
  const hasValidationData = useSelector(state => selectorKey in state.chat.toolkitValidationInfo);
  useValidateToolkit({ toolkitId, projectId, forceSkip: hasValidationData });
  return null;
});

ToolkitValidator.displayName = 'ToolkitValidator';

export default ToolkitValidator;
