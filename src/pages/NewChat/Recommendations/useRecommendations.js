import { useMemo } from 'react';

import { useGetRecommendationsQuery } from '@/api/applications';
import { ChatParticipantType } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export default function useRecommendations() {
  const selectedProjectId = useSelectedProjectId();
  const {
    data = { applications: [] },
    isFetching,
    isLoading,
  } = useGetRecommendationsQuery(
    {
      projectId: selectedProjectId,
      limit: 10,
      days: 30,
    },
    {
      skip: !selectedProjectId,
    },
  );
  const recommendations = useMemo(
    () =>
      data?.applications.map(item => ({
        ...item,
        participantType: ChatParticipantType.Applications,
        project_id: selectedProjectId,
      })) || [],
    [data?.applications, selectedProjectId],
  );
  return {
    recommendations,
    total: data?.total || 0,
    isFetching,
    isLoading,
  };
}
