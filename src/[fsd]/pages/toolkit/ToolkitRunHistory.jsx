import { memo, useCallback, useEffect } from 'react';

import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { RunHistoryContainer } from '@/[fsd]/entities/run-history/ui';
import { ParticipantEntityTypes } from '@/[fsd]/features/chat/participants/lib/constants/participant.constants';
import DrawerPageHeader from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader';
import { IndexBreadcrumb } from '@/[fsd]/features/toolkits/indexes/ui';
import { useToolkitsDetailsQuery } from '@/api/toolkits.js';
import { buildErrorMessage, isNotFoundError } from '@/common/utils.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import Page404 from '@/pages/Page404.jsx';
import RouteDefinitions from '@/routes';

const ToolkitRunHistory = memo(() => {
  const { tab, toolkitId } = useParams();
  const [searchParams] = useSearchParams();
  const isMCP = searchParams.get('isMCP') === 'true';
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const styles = getStyles();

  const goBackToRunIndex = useCallback(() => {
    const target = RouteDefinitions.ToolkitIndex.replace(':tab', tab ?? 'all').replace(
      ':toolkitId',
      String(toolkitId),
    );
    navigate(target);
  }, [navigate, tab, toolkitId]);

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
    data: publicToolkitData,
    isError,
    error,
  } = useToolkitsDetailsQuery({ projectId, toolkitId }, { skip: !projectId || !toolkitId });

  const shouldShowNotFoundPage = isError && isNotFoundError(error);

  useEffect(() => {
    if (isError && !shouldShowNotFoundPage) toastError(buildErrorMessage(error));
  }, [error, isError, shouldShowNotFoundPage, toastError]);

  if (shouldShowNotFoundPage) return <Page404 />;

  const toolkitName = publicToolkitData?.name || '';

  return (
    <Box sx={styles.wrapper}>
      <DrawerPageHeader
        showBorder
        title={
          <IndexBreadcrumb
            toolkitName={toolkitName}
            current="Run History"
            onToolkitsClick={goToToolkitsList}
            onToolkitClick={goBackToToolkit}
            onIndexClick={goBackToRunIndex}
          />
        }
      />
      <Box sx={styles.content}>
        <RunHistoryContainer
          entityId={toolkitId}
          source={isMCP ? ParticipantEntityTypes.MCP : ParticipantEntityTypes.Toolkit}
          versions={null}
          onClose={goBackToRunIndex}
        />
      </Box>
    </Box>
  );
});

ToolkitRunHistory.displayName = 'ToolkitRunHistory';

/** @type {MuiSx} */
const getStyles = () => ({
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
  body: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    gap: '1.5rem',
    overflow: 'hidden',
  },
  historyColumn: {
    flex: '0 0 24rem',
    minWidth: '20rem',
    maxWidth: '28rem',
    overflow: 'hidden',
  },
  chatColumn: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  chatContainer: {
    height: '100%',
  },
});

export default ToolkitRunHistory;
