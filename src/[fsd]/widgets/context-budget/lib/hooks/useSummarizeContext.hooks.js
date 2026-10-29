import { useCallback, useState } from 'react';

import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { CONTEXT_MESSAGES } from '@/[fsd]/widgets/context-budget/lib/constants';
import { useGenerateSummaryMutation } from '@/api';

/**
 * Manual summarization for one conversation, behind a confirmation dialog.
 */
export const useSummarizeContext = ({ conversationId }) => {
  const selectedProjectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();
  const [generateSummary, { isLoading: isSummarizing }] = useGenerateSummaryMutation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDialog = useCallback(() => setIsDialogOpen(true), []);
  const closeDialog = useCallback(() => setIsDialogOpen(false), []);

  const confirmSummarize = useCallback(async () => {
    try {
      await generateSummary({
        projectId: selectedProjectId,
        conversationId,
      }).unwrap();
      setIsDialogOpen(false);
      toastSuccess(CONTEXT_MESSAGES.SUMMARIZE_SUCCESS);
    } catch (error) {
      setIsDialogOpen(false);
      toastError(error?.data?.error || error?.data?.message || 'Failed to summarize context');
    }
  }, [selectedProjectId, conversationId, generateSummary, toastError, toastSuccess]);

  return { isDialogOpen, openDialog, closeDialog, confirmSummarize, isSummarizing };
};
