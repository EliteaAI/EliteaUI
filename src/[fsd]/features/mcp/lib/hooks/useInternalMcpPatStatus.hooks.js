import { useInternalMcpPatStatusQuery } from '@/api/toolkits.js';

export const useInternalMcpPatStatus = ({ projectId, toolkitType }) => {
  const isMcpType = typeof toolkitType === 'string' && toolkitType.startsWith('mcp');
  const { data, isLoading } = useInternalMcpPatStatusQuery(
    { projectId, toolkitType },
    { skip: !projectId || !isMcpType },
  );

  const patInvalid = !!(data?.internal && data?.state !== 'VALID');

  return {
    patInvalid,
    patState: patInvalid ? data.state : null,
    isLoading,
  };
};
