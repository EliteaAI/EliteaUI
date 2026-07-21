import { memo, useCallback, useEffect, useMemo } from 'react';

import { Formik } from 'formik';
import { useNavigate, useParams } from 'react-router-dom';

import { Box, CircularProgress } from '@mui/material';

import DrawerPageHeader from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader';
import { useGetIndexesListQuery } from '@/[fsd]/features/toolkits/indexes/api';
import { IndexBreadcrumb } from '@/[fsd]/features/toolkits/indexes/ui';
import { useToolkitsDetailsQuery } from '@/api/toolkits.js';
import { buildErrorMessage, isNotFoundError } from '@/common/utils.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import Page404 from '@/pages/Page404.jsx';
import RouteDefinitions from '@/routes';

import CreateIndexForm from './CreateIndexForm';

const emptyToolDetail = {};

const CreateIndex = memo(() => {
  const { tab, toolkitId } = useParams();
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const styles = createIndexStyles();

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
  } = useToolkitsDetailsQuery({ projectId, toolkitId }, { skip: !projectId || !toolkitId });

  useGetIndexesListQuery({ toolkitId, projectId }, { skip: !projectId || !toolkitId });

  const shouldShowNotFoundPage = isError && isNotFoundError(error);

  useEffect(() => {
    if (isError && !shouldShowNotFoundPage) toastError(buildErrorMessage(error));
  }, [error, isError, shouldShowNotFoundPage, toastError]);

  const initialValues = useMemo(() => {
    if (!publicToolkitData?.id) return {};
    return {
      ...publicToolkitData,
      settings: publicToolkitData.settings || {},
      type: publicToolkitData.type || '',
    };
  }, [publicToolkitData]);

  if (shouldShowNotFoundPage) return <Page404 />;

  const toolkitName = publicToolkitData?.name || '';

  return (
    <Box sx={styles.wrapper}>
      <DrawerPageHeader
        showBorder
        title={
          <IndexBreadcrumb
            toolkitName={toolkitName}
            current="New index"
            onToolkitsClick={goToToolkitsList}
            onToolkitClick={goBackToToolkit}
          />
        }
      />
      <Box sx={styles.content}>
        {isFetching || !publicToolkitData?.id ? (
          <Box sx={styles.loading}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Formik
            enableReinitialize
            initialValues={initialValues}
            onSubmit={() => {}}
          >
            <CreateIndexForm
              toolkitId={toolkitId}
              tab={tab}
            />
          </Formik>
        )}
      </Box>
    </Box>
  );
});

CreateIndex.displayName = 'CreateIndex';

/** @type {MuiSx} */
const createIndexStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    padding: '1rem 1.5rem',
    gap: '1rem',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem 0',
  },
});

export default CreateIndex;
