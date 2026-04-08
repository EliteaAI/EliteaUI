import { useEffect, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import { useValidateToolkitQuery } from '@/api/toolkits';
import { buildErrorMessage } from '@/common/utils';
import useToast from '@/hooks/useToast';
import { actions } from '@/slices/chat';

export default function useValidateToolkit({ projectId, toolkitId, forceSkip } = {}) {
  const dispatch = useDispatch();
  const { toastError } = useToast();

  // Collect all stored OAuth tokens (MCP, pre-built MCP, config OAuth, etc.) to pass
  // to the GET endpoint via the X-Toolkit-Tokens header.
  const mcpTokens = McpAuthHelpers.getAllTokens();

  // Use the GET query — tokens are forwarded via X-Toolkit-Tokens header so the backend
  // can validate OAuth-enabled toolkit configurations without needing a POST body.
  // RTK Query caching is preserved: the cache key includes mcpTokens so re-fetches
  // happen automatically when tokens change.
  const { error, isError } = useValidateToolkitQuery(
    { projectId, toolkitId, mcpTokens },
    { skip: !toolkitId || !projectId || forceSkip },
  );

  useEffect(() => {
    if (isError) {
      if (error?.status !== 400) {
        toastError(buildErrorMessage(error));
      }

      // Combine settings_errors and connection_errors into a single validation info list
      const settingsErrors = error.data?.settings_errors || [];
      const connectionErrors = (error.data?.connection_errors || []).map(err => ({
        type: 'connection_error',
        msg: err.message,
        loc: [err.configuration_title || err.configuration_type],
        requires_authorization: err.requires_authorization,
        auth_metadata: err.auth_metadata,
      }));

      dispatch(
        actions.setToolkitValidationInfo({
          toolkitId,
          projectId,
          validationInfo: [...settingsErrors, ...connectionErrors],
        }),
      );
    }
  }, [isError, error, toastError, dispatch, toolkitId, projectId]);
}

export function useToolkitValidationInfo({ toolkitId, projectId }) {
  const selectorKey = useMemo(() => `${projectId}_${toolkitId}`, [projectId, toolkitId]);
  const toolkitValidationInfo = useSelector(state => state.chat.toolkitValidationInfo);
  const toolkitValidationInfoList = useMemo(() => {
    if (!projectId || !toolkitId) {
      return [];
    }
    return toolkitValidationInfo[selectorKey] || [];
  }, [projectId, selectorKey, toolkitId, toolkitValidationInfo]);
  return { toolkitValidationInfoList };
}
