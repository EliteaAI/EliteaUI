import { useEffect } from 'react';

import { useInternalMcpPatStatusQuery } from '@/api/toolkits.js';

export const useInternalMcpPatStatus = props => {
  const { projectId, toolkitType } = props;
  const isMcpType = typeof toolkitType === 'string' && toolkitType.startsWith('mcp');
  const skip = !projectId || !isMcpType;
  const { data, isLoading, refetch } = useInternalMcpPatStatusQuery({ projectId, toolkitType }, { skip });

  // The token is created/renewed on the settings page (opened in a new tab), so re-check on return
  // to the tab — otherwise the banner and gated actions stay stale until a full reload.
  useEffect(() => {
    if (skip) return undefined;
    const recheck = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    window.addEventListener('focus', recheck);
    document.addEventListener('visibilitychange', recheck);
    return () => {
      window.removeEventListener('focus', recheck);
      document.removeEventListener('visibilitychange', recheck);
    };
  }, [skip, refetch]);

  const patInvalid = !!(data?.internal && data?.state !== 'VALID');

  return {
    patInvalid,
    patState: patInvalid ? data.state : null,
    isLoading,
  };
};
