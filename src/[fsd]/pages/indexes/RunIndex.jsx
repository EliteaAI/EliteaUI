import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Formik } from 'formik';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box, CircularProgress, Typography } from '@mui/material';

import DrawerPageHeader from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader';
import { useGetIndexScheduleQuery, useGetIndexesListQuery } from '@/[fsd]/features/toolkits/indexes/api';
import { IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { selectIndexesList } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
import { IndexBreadcrumb } from '@/[fsd]/features/toolkits/indexes/ui';
import { useToolkitsDetailsQuery } from '@/api/toolkits.js';
import { buildErrorMessage, isNotFoundError } from '@/common/utils.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import Page404 from '@/pages/Page404.jsx';
import RouteDefinitions from '@/routes';

import RunIndexPanel from './RunIndexPanel';

const emptyToolDetail = {};
const CREATING_POLL_INTERVAL_MS = 2000;
const CREATING_POLL_TIMEOUT_MS = 45000;

const RunIndex = memo(() => {
  const { tab, toolkitId, indexName: rawIndexName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const indexName = useMemo(() => (rawIndexName ? decodeURIComponent(rawIndexName) : ''), [rawIndexName]);
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const styles = runIndexStyles();

  const goBackToToolkit = useCallback(() => {
    const target = RouteDefinitions.ToolkitDetail.replace(':tab', tab ?? 'all').replace(
      ':toolkitId',
      String(toolkitId),
    );
    navigate(target);
  }, [navigate, tab, toolkitId]);

  const goToToolkitsList = useCallback(() => {
    navigate(RouteDefinitions.ToolkitsWithTab.replace(':tab', tab ?? 'all'));
  }, [navigate, tab]);

  const {
    data: publicToolkitData = emptyToolDetail,
    isFetching,
    isError,
    error,
    refetch: refetchToolkit,
  } = useToolkitsDetailsQuery({ projectId, toolkitId }, { skip: !projectId || !toolkitId });

  const { refetch: refetchIndexesList } = useGetIndexesListQuery(
    { toolkitId, projectId },
    { skip: !projectId || !toolkitId },
  );

  useGetIndexScheduleQuery(
    { projectId, toolkitId },
    { skip: !projectId || !toolkitId, refetchOnMountOrArgChange: true },
  );

  const {
    data: indexesList,
    isLoading: indexesLoading,
    isFetching: indexesFetching,
    hasData,
  } = useSelector(selectIndexesList);

  const currentIndex = useMemo(() => {
    if (!hasData || !indexName) return null;
    return indexesList.find(idx => idx?.metadata?.collection === indexName) || null;
  }, [indexesList, indexName, hasData]);

  const isCreating = Boolean(location.state?.creating);
  const initialConversation = useMemo(() => {
    const id = location.state?.conversation_id;
    const uuid = location.state?.conversation_uuid;
    return id && uuid ? { id, uuid } : null;
  }, [location.state?.conversation_id, location.state?.conversation_uuid]);

  const inflightIndex = useMemo(() => {
    if (!isCreating || !initialConversation) return null;
    return {
      id: null,
      metadata: {
        collection: indexName,
        state: IndexStatuses.progress,
        conversation_id: initialConversation.id,
        conversation_uuid: initialConversation.uuid,
        created_on: Date.now() / 1000,
      },
    };
  }, [isCreating, initialConversation, indexName]);

  const [awaitingCreation, setAwaitingCreation] = useState(isCreating);

  useEffect(() => {
    if (!awaitingCreation) return undefined;
    if (currentIndex) {
      setAwaitingCreation(false);
      return undefined;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - start > CREATING_POLL_TIMEOUT_MS) {
        setAwaitingCreation(false);
        clearInterval(interval);
        return;
      }
      refetchIndexesList();
    }, CREATING_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [awaitingCreation, currentIndex, refetchIndexesList]);

  const selectedIndexTools = useMemo(
    () => publicToolkitData?.settings?.selected_tools ?? [],
    [publicToolkitData],
  );

  const shouldShowNotFoundPage = isError && isNotFoundError(error);

  const initialValues = useMemo(() => {
    if (!publicToolkitData?.id) return {};
    return {
      ...publicToolkitData,
      settings: publicToolkitData.settings || {},
      type: publicToolkitData.type || '',
    };
  }, [publicToolkitData]);

  const handleRefetch = useCallback(async () => {
    await refetchIndexesList();
    await refetchToolkit();
  }, [refetchIndexesList, refetchToolkit]);

  useEffect(() => {
    if (isError && !shouldShowNotFoundPage) toastError(buildErrorMessage(error));
  }, [error, isError, shouldShowNotFoundPage, toastError]);

  if (shouldShowNotFoundPage) return <Page404 />;

  const effectiveIndex = currentIndex ?? inflightIndex;
  // When we already have the inflight index from CreateIndex, don't block RunIndexPanel behind
  // the indexes-list fetch — we need to mount the socket listener immediately so streaming events
  // aren't dropped.
  const isLoading = effectiveIndex
    ? isFetching || !publicToolkitData?.id
    : isFetching || indexesLoading || indexesFetching || !hasData || !publicToolkitData?.id;

  const showCreatingPlaceholder = awaitingCreation && !effectiveIndex;

  return (
    <Box sx={styles.wrapper}>
      <DrawerPageHeader
        showBorder
        title={
          <IndexBreadcrumb
            toolkitName={publicToolkitData?.name || ''}
            current={indexName || 'Index'}
            onToolkitsClick={goToToolkitsList}
            onToolkitClick={goBackToToolkit}
          />
        }
      />
      <Box sx={styles.content}>
        {isLoading || showCreatingPlaceholder ? (
          <Box sx={styles.loading}>
            <CircularProgress size={24} />
            {showCreatingPlaceholder && (
              <Typography
                variant="bodyMedium"
                color="text.secondary"
                sx={{ marginLeft: '0.75rem' }}
              >
                Preparing index &quot;{indexName}&quot;…
              </Typography>
            )}
          </Box>
        ) : !effectiveIndex ? (
          <Box sx={styles.loading}>
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              Index &quot;{indexName}&quot; was not found for this toolkit.
            </Typography>
          </Box>
        ) : (
          <Formik
            enableReinitialize
            initialValues={initialValues}
            onSubmit={() => {}}
          >
            <RunIndexPanel
              toolkitId={toolkitId}
              tab={tab}
              indexName={indexName}
              index={effectiveIndex}
              selectedIndexTools={selectedIndexTools}
              refetchIndexesList={handleRefetch}
              isCreating={isCreating}
              initialConversation={initialConversation}
            />
          </Formik>
        )}
      </Box>
    </Box>
  );
});

RunIndex.displayName = 'RunIndex';

/** @type {MuiSx} */
const runIndexStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    padding: '1rem 1.5rem',
    gap: '1rem',
    overflow: 'hidden',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem 0',
  },
});

export default RunIndex;
