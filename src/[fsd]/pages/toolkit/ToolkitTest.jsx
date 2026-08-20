import { memo, useCallback, useEffect, useMemo } from 'react';

import { Formik } from 'formik';
import { useNavigate, useParams } from 'react-router-dom';

import { Box, CircularProgress } from '@mui/material';

import { McpAuthStatus, McpPatBanner } from '@/[fsd]/features/mcp';
import DrawerPageHeader from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader';
import { ToolkitFormHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { ToolkitTestPanel } from '@/[fsd]/features/toolkits/ui';
import { NavigationHelpers, isMcpToolkitType } from '@/[fsd]/shared/lib/helpers';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { useToolkitsDetailsQuery } from '@/api/toolkits.js';
import { buildErrorMessage, isNotFoundError } from '@/common/utils.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import RouteDefinitions from '@/routes';

const emptyToolDetail = {};

const ToolkitTest = memo(() => {
  const { tab, toolkitId, mcpId } = useParams();
  const entityId = mcpId ?? toolkitId;
  const isMCP = !!mcpId;
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const styles = toolkitTestStyles();

  const goToList = useCallback(() => {
    const listRoute = isMCP ? RouteDefinitions.MCPsWithTab : RouteDefinitions.ToolkitsWithTab;
    navigate(NavigationHelpers.buildRoute(listRoute, { tab: tab ?? 'all' }));
  }, [isMCP, navigate, tab]);

  const {
    data: toolkitData = emptyToolDetail,
    isFetching,
    isError,
    error,
  } = useToolkitsDetailsQuery({ projectId, toolkitId: entityId }, { skip: !projectId || !entityId });

  useEffect(() => {
    if (!isError) return;

    if (!isNotFoundError(error)) toastError(buildErrorMessage(error));
    goToList();
  }, [error, isError, goToList, toastError]);

  const initialValues = useMemo(
    () => ToolkitFormHelpers.buildToolkitFormInitialValues(toolkitData),
    [toolkitData],
  );

  if (isError) return null;

  return (
    <Box sx={styles.wrapper}>
      <DrawerPageHeader
        showBorder
        title={<Breadcrumbs />}
      />
      <Box sx={styles.content}>
        {isFetching || !toolkitData?.id ? (
          <Box sx={styles.loading}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Formik
            enableReinitialize
            initialValues={initialValues}
            onSubmit={() => {}}
          >
            <Box sx={styles.body}>
              {isMcpToolkitType(toolkitData?.type) && (
                <Box sx={styles.mcpStatus}>
                  <McpPatBanner
                    projectId={projectId}
                    toolkitType={toolkitData?.type}
                  />
                  <McpAuthStatus />
                </Box>
              )}
              <ToolkitTestPanel toolkitId={entityId} />
            </Box>
          </Formik>
        )}
      </Box>
    </Box>
  );
});

ToolkitTest.displayName = 'ToolkitTest';

/** @type {MuiSx} */
const toolkitTestStyles = () => ({
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
  body: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
  mcpStatus: {
    flexShrink: 0,
    padding: '0.75rem 1.5rem 0',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem 0',
  },
});

export default ToolkitTest;
