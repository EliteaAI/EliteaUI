import { memo, useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';

import { REQUEST_STATUS } from '@/[fsd]/features/apps/lib/constants/applicationCatalog.constants';
import { useApplicationCatalogState, useApplicationRequests } from '@/[fsd]/features/apps/lib/hooks';
import RouteDefinitions from '@/routes';

import ApplicationCatalogCard from './ApplicationCatalogCard';
import RequestAccessModal from './RequestAccessModal';

const ApplicationCatalog = memo(() => {
  const styles = applicationCatalogStyles();
  const navigate = useNavigate();
  const { applications, isLoading } = useApplicationCatalogState();
  const { getRequestStatus, submitRequest, isSubmitting, isFetching } = useApplicationRequests();

  const [requestModalApp, setRequestModalApp] = useState(null);

  const handleOpenRequestModal = useCallback(application => {
    setRequestModalApp(application);
  }, []);

  const handleCloseRequestModal = useCallback(() => {
    setRequestModalApp(null);
  }, []);

  const handleSubmitRequest = useCallback(
    (application, reason) => {
      submitRequest(application.type, reason, application.typeLabel);
      setRequestModalApp(null);
    },
    [submitRequest],
  );

  const handleConfigure = useCallback(
    application => {
      navigate(RouteDefinitions.CreateAppType.replace(':appType', application.type));
    },
    [navigate],
  );

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.grid}>
        {applications.map(application => {
          const requestStatus = getRequestStatus(application.type);
          const isPending = requestStatus === REQUEST_STATUS.PENDING;
          const canRequest = !application.canCreate && requestStatus !== REQUEST_STATUS.PENDING;

          return (
            <ApplicationCatalogCard
              key={application.id}
              application={application}
              onConfigure={handleConfigure}
              onRequestAccess={handleOpenRequestModal}
              isPending={isPending}
              canCreate={application.canCreate}
              canRequest={canRequest}
              isLoading={isLoading}
              isFetchingStatus={isFetching}
            />
          );
        })}
      </Box>

      <RequestAccessModal
        open={Boolean(requestModalApp)}
        application={requestModalApp}
        isSubmitting={isSubmitting}
        onClose={handleCloseRequestModal}
        onSubmit={handleSubmitRequest}
      />
    </Box>
  );
});

ApplicationCatalog.displayName = 'ApplicationCatalog';

/** @type {MuiSx} */
const applicationCatalogStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    px: '1.5rem',
    pt: '1rem',
    pb: '2rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 20rem), 36rem))',
    gap: '1rem',
    alignItems: 'stretch',
  },
});

export default ApplicationCatalog;
