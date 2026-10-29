import { useCallback, useState } from 'react';

import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { useGenerateSummaryMutation } from '@/api';

/**
 * Manual summarization for one conversation, behind a confirmation dialog.
 */
export const useSummarizeContext = ({ conversationId }) => {
  const selectedProjectId = useSelectedProjectId();
  const { toastError } = useToast();
  const [generateSummary, { isLoading: isSummarizing }] = useGenerateSummaryMutation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDialog = useCallback(() => setIsDialogOpen(true), []);
  const closeDialog = useCallback(() => setIsDialogOpen(false), []);

  const confirmSummarize = useCallback(async () => {
    try {
      setIsDialogOpen(false);
      await generateSummary({
        projectId: selectedProjectId,
        conversationId,
      }).unwrap();
    } catch (error) {
      toastError(error?.data?.error || 'Failed to summarize context');
    }
  }, [selectedProjectId, conversationId, generateSummary, toastError]);

  return { isDialogOpen, openDialog, closeDialog, confirmSummarize, isSummarizing };
};
