import { memo, useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { Box, Typography } from '@mui/material';

import {
  useDeleteIndexItemMutation,
  useGetIndexScheduleQuery,
  useGetIndexesListQuery,
} from '@/[fsd]/features/toolkits/indexes/api';
import { IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { selectIndexesList } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
import { HeadlessReindexRunner, IndexesList } from '@/[fsd]/features/toolkits/indexes/ui';
import { Modal } from '@/[fsd]/shared/ui';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions, { getBasename } from '@/routes';

const IndexesContainer = memo(props => {
  const { toolkitId } = props;

  const { toastSuccess, toastError } = useToast();

  const navigate = useNavigate();
  const { tab } = useParams();

  const projectId = useSelectedProjectId();
  const styles = indexesContainerStyles();

  const buildIndexPath = useCallback(
    (template, indexName) => {
      let path = template.replace(':tab', tab ?? 'all').replace(':toolkitId', String(toolkitId ?? ''));
      if (indexName !== undefined) {
        path = path.replace(':indexName', encodeURIComponent(indexName));
      }
      return path;
    },
    [tab, toolkitId],
  );

  const handleAddIndexNav = useCallback(() => {
    navigate(buildIndexPath(RouteDefinitions.ToolkitIndexNew));
  }, [navigate, buildIndexPath]);

  const handleIndexCardClick = useCallback(
    index => {
      const name = index?.metadata?.collection;
      if (!name) return;
      navigate(buildIndexPath(RouteDefinitions.ToolkitIndex, name));
    },
    [navigate, buildIndexPath],
  );

  useGetIndexScheduleQuery(
    { projectId, toolkitId },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  );

  const { refetch } = useGetIndexesListQuery({ toolkitId, projectId });

  const [reindexTarget, setReindexTarget] = useState(null);
  const [reindexConfirmOpen, setReindexConfirmOpen] = useState(false);
  const [reindexRunning, setReindexRunning] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteIndexModal, setDeleteIndexModal] = useState(false);

  const { data: indexesList, isLoading, isFetching } = useSelector(selectIndexesList);

  const [deleteIndex, { isLoading: isIndexDeleting }] = useDeleteIndexItemMutation();

  const indexesWithStub = useMemo(() => {
    if (!reindexRunning) return indexesList;

    return indexesList.map(item =>
      item.id === reindexRunning.id
        ? {
            ...item,
            metadata: {
              ...item.metadata,
              state: reindexRunning.metadata?.state ?? item.metadata?.state,
              task_id: reindexRunning.metadata?.task_id ?? item.metadata?.task_id,
              conversation_id: reindexRunning.metadata?.conversation_id ?? item.metadata?.conversation_id,
            },
          }
        : item,
    );
  }, [indexesList, reindexRunning]);

  const traceReindex = useCallback((id, metadata) => {
    if (!id) return;
    setReindexRunning(prev =>
      prev && prev.id === id ? { ...prev, metadata: { ...prev.metadata, ...metadata } } : prev,
    );
  }, []);

  const handleRefetchIndexesList = useCallback(async () => {
    await refetch({ toolkitId, projectId });
  }, [refetch, toolkitId, projectId]);

  const closeDeleteIndexModal = useCallback(() => {
    setDeleteIndexModal(false);
    setDeleteTarget(null);
  }, []);

  const handleDeleteFromCard = useCallback(index => {
    setDeleteTarget(index);
    setDeleteIndexModal(true);
  }, []);

  const handleReindexFromCard = useCallback(index => {
    setReindexTarget(index);
    setReindexConfirmOpen(true);
  }, []);

  const handleOpenIndexInNewTab = useCallback(
    index => {
      const name = index?.metadata?.collection;
      if (!name) return;
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const basename = getBasename();
      const url = `${baseUrl}${basename}${buildIndexPath(RouteDefinitions.ToolkitIndex, name)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [buildIndexPath],
  );

  const cancelReindexConfirm = useCallback(() => {
    setReindexConfirmOpen(false);
    setReindexTarget(null);
  }, []);

  const confirmReindex = useCallback(() => {
    if (!reindexTarget) return;
    setReindexRunning({
      ...reindexTarget,
      metadata: { ...reindexTarget.metadata, state: IndexStatuses.progress },
    });
    setReindexConfirmOpen(false);
    setReindexTarget(null);
  }, [reindexTarget]);

  const handleReindexDone = useCallback(() => {
    setReindexRunning(null);
    handleRefetchIndexesList();
  }, [handleRefetchIndexesList]);

  const confirmIndexDeleting = useCallback(async () => {
    if (isIndexDeleting || !deleteTarget) return;

    try {
      await deleteIndex({
        projectId,
        toolkitId,
        indexId: deleteTarget.id,
        indexName: deleteTarget.metadata.collection,
      }).unwrap();

      toastSuccess('Index deleted successfully');
      setDeleteIndexModal(false);
      setDeleteTarget(null);
    } catch {
      toastError('Failed to delete index');
    }
  }, [deleteTarget, deleteIndex, isIndexDeleting, projectId, toastError, toastSuccess, toolkitId]);

  const reindexRunningTargetName = reindexTarget?.metadata?.collection || '';

  return (
    <Box sx={styles.wrapper}>
      <IndexesList
        handleAddIndex={handleAddIndexNav}
        indexesList={indexesWithStub}
        onIndexClick={handleIndexCardClick}
        currentIndex={null}
        loading={isLoading || isFetching}
        onCardReindex={handleReindexFromCard}
        onCardDelete={handleDeleteFromCard}
        onCardOpenNewTab={handleOpenIndexInNewTab}
        reindexingId={reindexRunning?.id}
      />
      {deleteTarget && (
        <Modal.DeleteEntityModal
          name={deleteTarget.metadata.collection}
          shouldRequestInputName
          open={deleteIndexModal}
          onClose={closeDeleteIndexModal}
          onConfirm={confirmIndexDeleting}
        />
      )}
      <Modal.BaseModal
        variant="simple"
        open={reindexConfirmOpen}
        title={`Reindex ${reindexRunningTargetName}?`}
        content={<Typography variant="bodyMedium">This will replace the current index data.</Typography>}
        confirmButtonText="Reindex"
        cancelButtonText="Cancel"
        onClose={cancelReindexConfirm}
        onConfirm={confirmReindex}
      />
      {reindexRunning && (
        <HeadlessReindexRunner
          key={`reindex-${reindexRunning.id}`}
          index={reindexRunning}
          toolkitId={toolkitId}
          traceNewIndex={traceReindex}
          refetchIndexesList={handleRefetchIndexesList}
          onDone={handleReindexDone}
        />
      )}
    </Box>
  );
});

IndexesContainer.displayName = 'IndexesContainer';

/** @type {MuiSx} */
const indexesContainerStyles = () => ({
  wrapper: {
    display: 'flex',
    flexGrow: 1,
    width: '100%',
    height: 'auto',
  },
});

export default IndexesContainer;
