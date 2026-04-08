import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { Box } from '@mui/material';

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
import { IndexDetails, IndexesList } from '@/[fsd]/features/toolkits/indexes/ui';
import { Modal } from '@/[fsd]/shared/ui';
import { SearchParams } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const IndexesContainer = memo(props => {
  const { toolkitId, selectedIndexTools, editToolDetail } = props;

  const skipAutoSelection = useRef(false);
  const hasSelectedFromUrlRef = useRef(false);

  const { toastSuccess, toastError } = useToast();
  const dispatch = useDispatch();

  const [searchParams, setSearchParams] = useSearchParams();
  const indexNameFromUrl = searchParams.get(SearchParams.IndexName);

  const projectId = useSelectedProjectId();
  const styles = indexesContainerStyles();

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

  const [deleteIndexModal, setDeleteIndexModal] = useState(false);

  const { data: indexesList, isLoading, isFetching } = useSelector(selectIndexesList);

  const [deleteIndex, { isLoading: isIndexDeleting }] = useDeleteIndexItemMutation();

  // Handle index selection from URL parameter (from notification link)
  useEffect(() => {
    if (!indexNameFromUrl || isLoading || isFetching || hasSelectedFromUrlRef.current) return;

    const targetIndex = indexesList.find(idx => idx.metadata?.collection === indexNameFromUrl);

    if (targetIndex) {
      setCurrentIndex(targetIndex);
      hasSelectedFromUrlRef.current = true;

      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete(SearchParams.IndexName);
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [indexNameFromUrl, indexesList, isLoading, isFetching, searchParams, setSearchParams]);

  // Handle index selection on change tab or indexing
  useEffect(() => {
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
  }, [indexesList, isLoading, isFetching, indexNameFromUrl]);

  const view = useMemo(
    () => (currentIndex?.id === 'new_index' ? IndexViewsEnum.create : IndexViewsEnum.edit),
    [currentIndex],
  );

  const indexesWithStub = useMemo(() => {
    if (currentIndex && currentIndex.id === NEW_INDEX_ID) return [currentIndex, ...indexesList];
    if (currentIndex && currentIndex.id !== NEW_INDEX_ID)
      return indexesList.map(item => ({
        ...item,
        metadata: {
          ...item.metadata,
          state: item.id === currentIndex.id ? currentIndex.metadata.state : item.metadata.state,
        },
      }));

    return indexesList;
  }, [currentIndex, indexesList]);

  const handleSelectIndex = useCallback(
    index => {
      setCurrentIndex(prev => {
        if (prev?.id === NEW_INDEX_ID && prev.metadata.state === IndexStatuses.progress) {
          dispatch(actions.addTempLocalIndex({ ...prev, id: uuidv4() }));
          skipAutoSelection.current = true;
        }

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

        setCurrentIndex(prev => ({ ...prev, metadata: { ...prev.metadata, ...metadata } }));
      }, 500);
    },
    [dispatch],
  );

  const handleRefetchIndexesList = useCallback(async () => {
    await refetch({ toolkitId, projectId });
  }, [refetch, toolkitId, projectId]);

  const closeDeleteIndexModal = () => setDeleteIndexModal(false);
  const handleDeleteIndex = useCallback(() => setDeleteIndexModal(true), []);

  const confirmIndexDeleting = useCallback(async () => {
    if (isIndexDeleting) return;

    try {
      await deleteIndex({
        projectId,
        toolkitId,
        indexId: currentIndex.id,
        indexName: currentIndex.metadata.collection,
      }).unwrap();

      toastSuccess('Index deleted successfully');
      setDeleteIndexModal(false);
      setCurrentIndex(null);
    } catch {
      toastError('Failed to delete index');
    }
  }, [currentIndex, deleteIndex, isIndexDeleting, projectId, toastError, toastSuccess, toolkitId]);

  return (
    <Box sx={styles.wrapper}>
      <IndexesList
        handleAddIndex={() =>
          handleSelectIndex({ id: NEW_INDEX_ID, metadata: { collection: 'New Index', state: '' } })
        }
        indexesList={indexesWithStub}
        onIndexClick={handleSelectIndex}
        currentIndex={currentIndex}
        loading={isLoading || isFetching}
      />
      {currentIndex && (
        <IndexDetails
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
      {currentIndex && (
        <Modal.DeleteEntityModal
          name={currentIndex.metadata.collection}
          shouldRequestInputName
          open={deleteIndexModal}
          onClose={closeDeleteIndexModal}
          onCancel={closeDeleteIndexModal}
          onConfirm={confirmIndexDeleting}
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
    height: '100%',
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
  },
});

export default IndexesContainer;
