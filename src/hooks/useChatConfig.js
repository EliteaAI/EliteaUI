import { useMemo } from 'react';

import { useGetChatConfigQuery } from '@/api/chatConfig';
import { ATTACHMENT_LIMITS } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

/**
 * Hook to fetch chat attachment limits from backend and provide FE-friendly values.
 * Falls back to ATTACHMENT_LIMITS defaults when API data is unavailable.
 */
export const useChatConfig = () => {
  const projectId = useSelectedProjectId();

  const { data, isLoading, error } = useGetChatConfigQuery(
    { projectId },
    {
      skip: !projectId,
      refetchOnMountOrArgChange: 60,
    },
  );

  const limits = useMemo(() => {
    if (!data) {
      return ATTACHMENT_LIMITS;
    }
    return {
      MAX_ATTACHMENTS: data.chat_max_upload_count ?? ATTACHMENT_LIMITS.MAX_ATTACHMENTS,
      MAX_TOTAL_SIZE: (data.chat_max_upload_size_mb ?? 150) * 1024 * 1024,
      DEFAULT_MAX_FILE_SIZE: (data.chat_max_file_upload_size_mb ?? 150) * 1024 * 1024,
      MAX_IMAGE_ATTACHMENTS: data.chat_max_image_upload_count ?? ATTACHMENT_LIMITS.MAX_IMAGE_ATTACHMENTS,
      MAX_IMAGE_FILE_SIZE: (data.chat_max_image_upload_size_mb ?? 5) * 1024 * 1024,
    };
  }, [data]);

  return { limits, isLoading, error };
};
