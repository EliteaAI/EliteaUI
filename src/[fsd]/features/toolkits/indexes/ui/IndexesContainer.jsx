import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { Box, Typography } from '@mui/material';

import {
  useDeleteIndexItemMutation,
  useGetIndexScheduleQuery,
  useGetIndexesListQuery,
} from '@/[fsd]/features/toolkits/indexes/api';
import {
  IndexStatuses,
  IndexViewsEnum,
  NEW_INDEX_ID,
} from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { actions, selectIndexesList } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
import { HeadlessReindexRunner, IndexDetails, IndexesList } from '@/[fsd]/features/toolkits/indexes/ui';
import { Modal } from '@/[fsd]/shared/ui';
import { SearchParams } from '@/common/constants';
import AlertDialog from '@/components/AlertDialog';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions, { getBasename } from '@/routes';

const IndexesContainer = memo(props => {
  const { toolkitId, selectedIndexTools, editToolDetail, listOnly = false } = props;

  const skipAutoSelection = useRef(false);
  const hasSelectedFromUrlRef = useRef(false);
  const detailsKeyRef = useRef(0);

  const { toastSuccess, toastError } = useToast();
  const dispatch = useDispatch();

  const [searchParams, setSearchParams] = useSearchParams();
  const indexNameFromUrl = searchParams.get(SearchParams.IndexName);
  const navigate = useNavigate();
  const { tab } = useParams();

  const projectId = useSelectedProjectId();
  const styles = indexesContainerStyles(listOnly);

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

  const [currentIndex, setCurrentIndex] = useState(null);
  const [reindexTarget, setReindexTarget] = useState(null);
  const [reindexConfirmOpen, setReindexConfirmOpen] = useState(false);
  const [reindexRunning, setReindexRunning] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [deleteIndexModal, setDeleteIndexModal] = useState(false);
  const [indexNotFoundOpen, setIndexNotFoundOpen] = useState(false);

  const { data: indexesList, isLoading, isFetching, hasData } = useSelector(selectIndexesList);

  const [deleteIndex, { isLoading: isIndexDeleting }] = useDeleteIndexItemMutation();

  // Handle index selection from URL parameter (from notification link)
  useEffect(() => {
    if (listOnly) return;
    if (!indexNameFromUrl || isLoading || isFetching || !hasData || hasSelectedFromUrlRef.current) return;

    const targetIndex = indexesList.find(idx => idx.metadata?.collection === indexNameFromUrl);

    hasSelectedFromUrlRef.current = true;

    if (targetIndex) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete(SearchParams.IndexName);
      setSearchParams(newSearchParams, { replace: true });
      setCurrentIndex(targetIndex);
    } else {
      setIndexNotFoundOpen(true);
    }
  }, [
    indexNameFromUrl,
    indexesList,
    isLoading,
    isFetching,
    hasData,
    searchParams,
    setSearchParams,
    listOnly,
  ]);

  // Handle index selection on change tab or indexing (only when details panel is present)
  useEffect(() => {
    if (listOnly) return;
    const reindexing = currentIndex?.metadata?.history?.length >= 1;

    if (isLoading || isFetching || indexNameFromUrl) return;

    if (skipAutoSelection.current) {
      skipAutoSelection.current = false;
      return;
    }

    const firstValidIndex = indexesList.find(idx => idx.metadata && idx.metadata.indexed !== undefined);
    const reindexingCurrentIndex = indexesList.find(idx => idx.id === currentIndex?.id);

    if (firstValidIndex) setCurrentIndex(firstValidIndex);
    if (reindexingCurrentIndex && reindexing) setCurrentIndex(reindexingCurrentIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexesList, isLoading, isFetching, indexNameFromUrl, listOnly]);

  const view = useMemo(
    () => (currentIndex?.id === 'new_index' ? IndexViewsEnum.create : IndexViewsEnum.edit),
    [currentIndex],
  );

  // Keep progress state (from reindex runner) reflected on the list card.
  const indexesWithStub = useMemo(() => {
    let list = indexesList;

    if (reindexRunning) {
      list = list.map(item =>
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
    }

    if (listOnly) return list;

    if (currentIndex && currentIndex.id === NEW_INDEX_ID) return [currentIndex, ...list];
    if (currentIndex && currentIndex.id !== NEW_INDEX_ID)
      return list.map(item => ({
        ...item,
        metadata: {
          ...item.metadata,
          state: item.id === currentIndex.id ? currentIndex.metadata.state : item.metadata.state,
        },
      }));

    return list;
  }, [currentIndex, indexesList, reindexRunning, listOnly]);

  const handleSelectIndex = useCallback(
    index => {
      setCurrentIndex(prev => {
        if (prev?.id === NEW_INDEX_ID && prev.metadata.state === IndexStatuses.progress) {
          dispatch(actions.addTempLocalIndex({ ...prev, id: uuidv4() }));
          skipAutoSelection.current = true;
        }

        if (prev?.id === NEW_INDEX_ID && index.id === NEW_INDEX_ID) detailsKeyRef.current += 1;

        return index;
      });
    },
    [dispatch],
  );

  const traceNewIndex = useCallback(
    (id, metadata) => {
      setTimeout(() => {
        if (id && id !== NEW_INDEX_ID) {
          dispatch(
            actions.updateIndexDepMeta({
              id,
              state: metadata.state,
              task_id: metadata.task_id,
              conversation_id: metadata.conversation_id,
            }),
          );
        }

        if (!listOnly) {
          setCurrentIndex(prev => (prev ? { ...prev, metadata: { ...prev.metadata, ...metadata } } : prev));
        }
      }, 500);
    },
    [dispatch, listOnly],
  );

  const traceReindex = useCallback((id, metadata) => {
    if (!id) return;
    setReindexRunning(prev =>
      prev && prev.id === id ? { ...prev, metadata: { ...prev.metadata, ...metadata } } : prev,
    );
  }, []);

  const handleRefetchIndexesList = useCallback(async () => {
    await refetch({ toolkitId, projectId });
  }, [refetch, toolkitId, projectId]);

  const closeDeleteIndexModal = () => {
    setDeleteIndexModal(false);
    setDeleteTarget(null);
  };
  const handleCloseIndexNotFound = useCallback(() => {
    setIndexNotFoundOpen(false);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete(SearchParams.IndexName);
    setSearchParams(newSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);
  const handleDeleteIndex = useCallback(() => setDeleteIndexModal(true), []);

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

  const deleteEntity = deleteTarget || currentIndex;

  const confirmIndexDeleting = useCallback(async () => {
    if (isIndexDeleting || !deleteEntity) return;

    try {
      await deleteIndex({
        projectId,
        toolkitId,
        indexId: deleteEntity.id,
        indexName: deleteEntity.metadata.collection,
      }).unwrap();

      toastSuccess('Index deleted successfully');
      setDeleteIndexModal(false);
      setDeleteTarget(null);
      if (!deleteTarget) setCurrentIndex(null);
    } catch {
      toastError('Failed to delete index');
    }
  }, [
    deleteEntity,
    deleteTarget,
    deleteIndex,
    isIndexDeleting,
    projectId,
    toastError,
    toastSuccess,
    toolkitId,
  ]);

  const reindexRunningTargetName = reindexTarget?.metadata?.collection || '';

  return (
    <Box sx={styles.wrapper}>
      <IndexesList
        listOnly={listOnly}
        handleAddIndex={
          listOnly
            ? handleAddIndexNav
            : () =>
                handleSelectIndex({
                  id: NEW_INDEX_ID,
                  metadata: { collection: 'New Index', state: '' },
                })
        }
        indexesList={indexesWithStub}
        onIndexClick={listOnly ? handleIndexCardClick : handleSelectIndex}
        currentIndex={currentIndex}
        loading={isLoading || isFetching}
        onCardReindex={listOnly ? handleReindexFromCard : undefined}
        onCardDelete={listOnly ? handleDeleteFromCard : undefined}
        onCardOpenNewTab={listOnly ? handleOpenIndexInNewTab : undefined}
        reindexingId={reindexRunning?.id}
      />
      {!listOnly && currentIndex && (
        <IndexDetails
          key={`${currentIndex.id}-${detailsKeyRef.current}`}
          index={currentIndex}
          traceNewIndex={traceNewIndex}
          view={view}
          refetchIndexesList={handleRefetchIndexesList}
          handleDeleteIndex={handleDeleteIndex}
          isIndexDeleting={isIndexDeleting}
          selectedIndexTools={selectedIndexTools}
          toolkitId={toolkitId}
          editToolDetail={editToolDetail}
        />
      )}
      {deleteEntity && (
        <Modal.DeleteEntityModal
          name={deleteEntity.metadata.collection}
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
      <AlertDialog
        open={indexNotFoundOpen}
        title="Item no longer exists"
        alertContent="This item was deleted and can't be opened."
        confirmButtonText="Got it"
        cancelButtonText=""
        onClose={handleCloseIndexNotFound}
        onConfirm={handleCloseIndexNotFound}
      />
    </Box>
  );
});

IndexesContainer.displayName = 'IndexesContainer';

/** @type {MuiSx} */
const indexesContainerStyles = listOnly => ({
  wrapper: {
    display: 'flex',
    flexGrow: 1,
    ...(listOnly
      ? {
          width: '100%',
          height: 'auto',
        }
      : {
          height: '100%',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
        }),
  },
});

export default IndexesContainer;
