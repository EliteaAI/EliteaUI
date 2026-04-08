import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import ListInfiniteMoreLoader from '@/ComponentsLib/ListInfiniteMoreLoader';
import { Modal } from '@/[fsd]/shared/ui';
import {
  useDeleteSummaryMutation,
  useGetConversationSummariesQuery,
  useUpdateSummaryMutation,
} from '@/api/chat';
import useToast from '@/hooks/useToast';

import SummaryDetailsItem from './SummaryDetailsItem';

const PAGE_SIZE = 10;

const SummaryDetailsModal = memo(props => {
  const { open, onClose, conversationId, projectId } = props;

  const [optimisticUpdates, setOptimisticUpdates] = useState({});
  const [offset, setOffset] = useState(0);

  const { data, isLoading, isFetching } = useGetConversationSummariesQuery(
    { conversationId, projectId, limit: PAGE_SIZE, offset },
    { skip: !open || !conversationId || !projectId },
  );
  const [deleteSummary] = useDeleteSummaryMutation();
  const [updateSummary] = useUpdateSummaryMutation();
  const { toastSuccess, toastError } = useToast();

  // Merge server data with optimistic updates
  const summaries = useMemo(() => {
    const serverSummaries = data?.summaries || [];
    return serverSummaries
      .filter(summary => optimisticUpdates[summary.id]?.deleted !== true)
      .map(summary => {
        const updates = optimisticUpdates[summary.id]?.updated;
        if (!updates) return summary;

        // Deep merge summary_meta to preserve original fields
        const mergedSummaryMeta = updates.summary_meta
          ? {
              ...summary.summary_meta,
              ...updates.summary_meta,
              metrics: {
                ...summary.summary_meta?.metrics,
                ...updates.summary_meta?.metrics,
              },
            }
          : summary.summary_meta;

        return {
          ...summary,
          ...updates,
          summary_meta: mergedSummaryMeta,
        };
      });
  }, [data?.summaries, optimisticUpdates]);

  const styles = summaryDetailsModalStyles();

  const handleDelete = useCallback(
    async summaryId => {
      try {
        // Optimistic update: mark as deleted locally
        setOptimisticUpdates(prev => ({
          ...prev,
          [summaryId]: { ...prev[summaryId], deleted: true },
        }));

        await deleteSummary({ projectId, conversationId, summaryId }).unwrap();
        toastSuccess('Summary deleted successfully');

        // Reset offset - invalidatesTags will trigger refetch from offset: 0
        setOffset(0);
      } catch {
        // Revert optimistic update on error
        setOptimisticUpdates(prev => ({
          ...prev,
          [summaryId]: { ...prev[summaryId], deleted: false },
        }));
        toastError('Failed to delete summary');
      }
    },
    [deleteSummary, projectId, conversationId, toastSuccess, toastError],
  );

  const handleEdit = useCallback(
    async (summaryId, newContent) => {
      try {
        // Optimistic update: update content locally
        setOptimisticUpdates(prev => ({
          ...prev,
          [summaryId]: { ...prev[summaryId], updated: { summary_content: newContent } },
        }));

        const response = await updateSummary({
          projectId,
          conversationId,
          summaryId,
          summary_content: newContent,
        }).unwrap();

        // Update with actual token counts from response
        if (response?.token_impact?.new_token_count !== undefined) {
          setOptimisticUpdates(prev => ({
            ...prev,
            [summaryId]: {
              ...prev[summaryId],
              updated: {
                summary_content: newContent,
                summary_meta: {
                  ...prev[summaryId]?.updated?.summary_meta,
                  metrics: {
                    ...prev[summaryId]?.updated?.summary_meta?.metrics,
                    summary_token_count: response.token_impact.new_token_count,
                  },
                },
              },
            },
          }));
        }

        toastSuccess('Summary updated successfully');
      } catch {
        // Revert optimistic update on error
        setOptimisticUpdates(prev => ({
          ...prev,
          [summaryId]: { ...prev[summaryId], updated: {} },
        }));
        toastError('Failed to update summary');
      }
    },
    [updateSummary, projectId, conversationId, toastSuccess, toastError],
  );

  const loadMore = useCallback(() => {
    setOffset(prev => prev + PAGE_SIZE);
  }, []);

  useEffect(() => {
    if (open) {
      setOffset(0);
      setOptimisticUpdates({});
    }
  }, [open, conversationId]);

  const content = (
    <>
      {isLoading && offset === 0 ? (
        <Box sx={styles.loadingContainer}>
          <CircularProgress />
        </Box>
      ) : summaries.length > 0 ? (
        <Box sx={styles.summariesList}>
          {summaries.map((summary, index) => (
            <SummaryDetailsItem
              key={summary.id}
              summary={summary}
              index={index}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
          <ListInfiniteMoreLoader
            listCurrentSize={summaries.length}
            totalAvailableCount={data?.total_count}
            onLoadMore={loadMore}
            resetPageDependencies={[conversationId]}
          />
          {isFetching && offset > 0 && (
            <Box sx={styles.loadingMore}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>
      ) : (
        <Typography
          variant="bodyMedium"
          sx={styles.emptyText}
        >
          No summaries available
        </Typography>
      )}
    </>
  );

  return (
    <Modal.BaseModal
      open={open}
      onClose={onClose}
      title="Summaries Details"
      content={content}
      sx={styles.dialog}
    />
  );
});

SummaryDetailsModal.displayName = 'SummaryDetailsModal';

/** @type {MuiSx} */
const summaryDetailsModalStyles = () => ({
  summariesList: ({ spacing }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: spacing(3),
    maxHeight: '31.25rem',
    overflowY: 'auto',
    paddingRight: spacing(1),
  }),
  emptyText: ({ palette }) => ({
    color: palette.text.secondary,
    textAlign: 'center',
  }),
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '12.5rem',
  },
  loadingMore: ({ spacing }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing(2),
  }),
  dialog: {
    '& .MuiDialog-paper': {
      width: '43.75rem !important',
    },
  },
});

export default SummaryDetailsModal;
