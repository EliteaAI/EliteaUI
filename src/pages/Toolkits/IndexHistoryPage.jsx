import { memo, useCallback, useEffect, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { Box, CircularProgress, IconButton, Typography } from '@mui/material';

import { useGetIndexesListQuery } from '@/[fsd]/features/toolkits/indexes/api';
import { selectIndexesList } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
import { IndexHistory } from '@/[fsd]/features/toolkits/indexes/ui';
import { useToolkitsDetailsQuery } from '@/api/toolkits.js';
import { buildErrorMessage, isNotFoundError } from '@/common/utils.jsx';
import ArrowBackIcon from '@/components/Icons/ArrowBackIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import Page404 from '@/pages/Page404.jsx';
import RouteDefinitions from '@/routes';

const IndexHistoryPage = memo(() => {
  const { tab, toolkitId, indexName: rawIndexName } = useParams();
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const styles = indexHistoryPageStyles();

  const goBackToRunIndex = useCallback(() => {
    const target = RouteDefinitions.ToolkitIndex.replace(':tab', tab ?? 'all')
      .replace(':toolkitId', String(toolkitId))
      .replace(':indexName', rawIndexName ?? '');
    navigate(target);
  }, [navigate, tab, toolkitId, rawIndexName]);

  const indexName = useMemo(() => (rawIndexName ? decodeURIComponent(rawIndexName) : ''), [rawIndexName]);

  const { isError, error } = useToolkitsDetailsQuery(
    { projectId, toolkitId },
    { skip: !projectId || !toolkitId },
  );

  useGetIndexesListQuery({ toolkitId, projectId }, { skip: !projectId || !toolkitId });

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

  const shouldShowNotFoundPage = isError && isNotFoundError(error);

  useEffect(() => {
    if (isError && !shouldShowNotFoundPage) toastError(buildErrorMessage(error));
  }, [error, isError, shouldShowNotFoundPage, toastError]);

  const history = currentIndex?.metadata?.history || [];
  const isLoading = indexesLoading || indexesFetching || !hasData;

  if (shouldShowNotFoundPage) return <Page404 />;

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.header}>
        <IconButton
          variant="elitea"
          color="tertiary"
          onClick={goBackToRunIndex}
          sx={styles.backButton}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          {indexName ? `${indexName} — History` : 'Index history'}
        </Typography>
      </Box>
      {isLoading ? (
        <Box sx={styles.loading}>
          <CircularProgress size={24} />
        </Box>
      ) : !currentIndex ? (
        <Box sx={styles.loading}>
          <Typography
            variant="bodyMedium"
            color="text.secondary"
          >
            Index &quot;{indexName}&quot; was not found for this toolkit.
          </Typography>
        </Box>
      ) : history.length === 0 ? (
        <Box sx={styles.loading}>
          <Typography
            variant="bodyMedium"
            color="text.secondary"
          >
            No history is available for this index yet.
          </Typography>
        </Box>
      ) : (
        <Box sx={styles.body}>
          <IndexHistory history={history} />
        </Box>
      )}
    </Box>
  );
});

IndexHistoryPage.displayName = 'IndexHistoryPage';

/** @type {MuiSx} */
const indexHistoryPageStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '1rem 1.5rem',
    gap: '1rem',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  backButton: ({ palette }) => ({
    margin: 0,
    '&:hover svg path': {
      fill: palette.icon.fill.secondary,
    },
  }),
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem 0',
  },
  body: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
  },
});

export default IndexHistoryPage;
