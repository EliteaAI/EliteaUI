import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { Box, Typography } from '@mui/material';

import { useDeleteIndexItemMutation, useGetIndexScheduleQuery } from '@/[fsd]/features/toolkits/indexes/api';
import { IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { useIndexesListPolling } from '@/[fsd]/features/toolkits/indexes/lib/hooks';
import { selectIndexesList } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
import { HeadlessReindexRunner, IndexesList } from '@/[fsd]/features/toolkits/indexes/ui';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
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

  const [reindexTarget, setReindexTarget] = useState(null);
  const [reindexConfirmOpen, setReindexConfirmOpen] = useState(false);
  const [reindexRunning, setReindexRunning] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteIndexModal, setDeleteIndexModal] = useState(false);

  const { refetch, startedTimeStamp, fulfilledTimeStamp } = useIndexesListPolling({
    toolkitId,
    projectId,
    forcePoll: Boolean(reindexRunning),
  });

  const { data: indexesList, isLoading, isFetching } = useSelector(selectIndexesList);

  // A hard-killed run never emits the terminal trace onDone needs, so the stub (and
  // its isReindexing lock) would pin the cards all session. Expire it only on a
  // completed snapshot from a request issued after the last observed activity
  // (in-flight fetches carry pre-run data) that shows the row stale or gone — "not
  // in_progress" is no evidence, since a post-click GET isn't ordered against the
  // socket-side pre-create.
  useEffect(() => {
    if (!reindexRunning?.observedAt || !startedTimeStamp || !fulfilledTimeStamp) return;
    if (startedTimeStamp <= reindexRunning.observedAt) return;
    if (fulfilledTimeStamp < startedTimeStamp) return;
    const serverRow = indexesList?.find(item => item.id === reindexRunning.id);
    if (!serverRow || serverRow.stale) setReindexRunning(null);
  }, [reindexRunning, startedTimeStamp, fulfilledTimeStamp, indexesList]);

  const [deleteIndex, { isLoading: isIndexDeleting }] = useDeleteIndexItemMutation();

  const indexesWithStub = useMemo(() => {
    if (!reindexRunning) return indexesList;

    return indexesList.map(item =>
      item.id === reindexRunning.id
        ? {
            ...item,
            // An observed start proves not-stale; the expiry effect above owns the
            // other direction — while the stub lives, the run counts as alive.
            stale: false,
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

  const traceReindex = useCallback(
    (id, metadata) => {
      if (!id) return;
      setReindexRunning(prev =>
        prev && prev.id === id
          ? { ...prev, observedAt: Date.now(), metadata: { ...prev.metadata, ...metadata } }
          : prev,
      );
      if (metadata.state === IndexStatuses.success) {
        toastSuccess('Reindex has completed successfully!');
      } else if (metadata.state === IndexStatuses.fail) {
        toastError('Reindexing has failed!');
      }
    },
    [toastError, toastSuccess],
  );

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
      const url = `${baseUrl}${basename}/${projectId}${buildIndexPath(RouteDefinitions.ToolkitIndex, name)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [buildIndexPath, projectId],
  );

  const cancelReindexConfirm = useCallback(() => {
    setReindexConfirmOpen(false);
    setReindexTarget(null);
  }, []);

  const confirmReindex = useCallback(() => {
    if (!reindexTarget) return;
    setReindexRunning({
      ...reindexTarget,
      observedAt: Date.now(),
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
      <Modal.DeleteEntityModal
        title="Reindex confirmation"
        name={reindexRunningTargetName}
        shouldRequestInputName={false}
        open={reindexConfirmOpen}
        confirmButtonText="Reindex"
        cancelButtonText="Cancel"
        onClose={cancelReindexConfirm}
        onConfirm={confirmReindex}
        textContent="Are you sure to reindex the "
        inlineExtraContent=" index?"
        extraContent={
          <Typography variant="bodyMedium">
            {"This will replace all current index data and can't be undone once started."}
          </Typography>
        }
        alarm={false}
        titleIcon={ModalConstants.MODAL_ICON_TYPE.info}
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
