import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Formik } from 'formik';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { Box, CircularProgress, Typography } from '@mui/material';

import DrawerPageHeader from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader';
import {
  hasRetainedIndexData,
  indexSearchBlockedReason,
  isAbandonedRun,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexDetails.helpers';
import { useIndexesListPolling } from '@/[fsd]/features/toolkits/indexes/lib/hooks';
import { selectIndexesList } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
import { IndexSearchPanel } from '@/[fsd]/features/toolkits/indexes/ui';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { useToolkitsDetailsQuery } from '@/api/toolkits.js';
import { buildErrorMessage, isNotFoundError } from '@/common/utils.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import RouteDefinitions from '@/routes';

const emptyToolDetail = {};

const IndexSearch = memo(() => {
  const { tab, toolkitId, indexName: rawIndexName } = useParams();
  const indexName = useMemo(() => (rawIndexName ? decodeURIComponent(rawIndexName) : ''), [rawIndexName]);
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const styles = indexSearchStyles();

  const goToToolkitsList = useCallback(() => {
    navigate(NavigationHelpers.buildRoute(RouteDefinitions.ToolkitsWithTab, { tab: tab ?? 'all' }));
  }, [navigate, tab]);

  const {
    data: toolkitData = emptyToolDetail,
    isFetching,
    isError,
    error,
  } = useToolkitsDetailsQuery({ projectId, toolkitId }, { skip: !projectId || !toolkitId });

  useIndexesListPolling({ toolkitId, projectId, skip: !projectId || !toolkitId });

  const { data: indexesList, isLoading: indexesLoading, hasData } = useSelector(selectIndexesList);

  const currentIndex = useMemo(() => {
    if (!hasData || !indexName) return null;
    return indexesList.find(idx => idx?.metadata?.collection === indexName) || null;
  }, [indexesList, indexName, hasData]);

  const selectedIndexTools = useMemo(() => toolkitData?.settings?.selected_tools ?? [], [toolkitData]);

  const initialValues = useMemo(() => {
    if (!toolkitData?.id) return {};
    return {
      ...toolkitData,
      settings: toolkitData.settings || {},
      type: toolkitData.type || '',
    };
  }, [toolkitData]);

  const shouldShowNotFoundPage = isError && isNotFoundError(error);

  useEffect(() => {
    if (isError && !shouldShowNotFoundPage) toastError(buildErrorMessage(error));
  }, [error, isError, shouldShowNotFoundPage, toastError]);

  useEffect(() => {
    if (shouldShowNotFoundPage) goToToolkitsList();
  }, [shouldShowNotFoundPage, goToToolkitsList]);

  const [lastResolvedIndex, setLastResolvedIndex] = useState(null);

  useEffect(() => {
    if (currentIndex) setLastResolvedIndex(currentIndex);
  }, [currentIndex]);

  const indexOutlivingRefetches = currentIndex ?? lastResolvedIndex;

  if (shouldShowNotFoundPage) return null;

  const isLoading = indexOutlivingRefetches
    ? !toolkitData?.id
    : isFetching || indexesLoading || !hasData || !toolkitData?.id;

  const blockedReason = indexSearchBlockedReason(
    indexOutlivingRefetches?.metadata?.state,
    selectedIndexTools,
    isAbandonedRun(indexOutlivingRefetches),
    hasRetainedIndexData(indexOutlivingRefetches?.metadata),
  );

  return (
    <Box sx={styles.wrapper}>
      <DrawerPageHeader
        showBorder
        title={<Breadcrumbs />}
      />
      <Box sx={styles.content}>
        {isLoading && (
          <Box sx={styles.message}>
            <CircularProgress size={24} />
          </Box>
        )}
        {!isLoading && !indexOutlivingRefetches && (
          <Box sx={styles.message}>
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              Index &quot;{indexName}&quot; was not found for this toolkit.
            </Typography>
          </Box>
        )}
        {!isLoading && indexOutlivingRefetches && (
          <Formik
            enableReinitialize
            initialValues={initialValues}
            onSubmit={() => {}}
          >
            <IndexSearchPanel
              toolkitId={toolkitId}
              indexName={indexName}
              selectedIndexTools={selectedIndexTools}
              blockedReason={blockedReason}
            />
          </Formik>
        )}
      </Box>
    </Box>
  );
});

IndexSearch.displayName = 'IndexSearch';

/** @type {MuiSx} */
const indexSearchStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  message: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem 0',
  },
});

export default IndexSearch;
