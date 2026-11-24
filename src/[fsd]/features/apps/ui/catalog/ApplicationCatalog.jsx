import { memo, useCallback, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';

import { REQUEST_STATUS } from '@/[fsd]/features/apps/lib/constants/applicationCatalog.constants';
import { filterApplicationsByQuery } from '@/[fsd]/features/apps/lib/helpers';
import { useApplicationCatalogState, useApplicationRequests } from '@/[fsd]/features/apps/lib/hooks';
import { APPLICATIONS_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import { Category } from '@/[fsd]/shared/ui';
import RouteDefinitions from '@/routes';

import ApplicationCatalogCard from './ApplicationCatalogCard';
import RequestAccessModal from './RequestAccessModal';

const ApplicationCatalog = memo(props => {
  const { query = '' } = props;
  const styles = applicationCatalogStyles();
  const navigate = useNavigate();
  const { applications, isLoading } = useApplicationCatalogState();
  const { getRequestStatus, submitRequest, isSubmitting, isFetching } = useApplicationRequests();

  const [requestModalApp, setRequestModalApp] = useState(null);

  const visibleApplications = useMemo(
    () => filterApplicationsByQuery(applications, query),
    [applications, query],
  );

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
      {!visibleApplications.length ? (
        <Category.NoResultsMessage
          title="No applications found"
          description="Try adjusting your search terms"
        />
      ) : (
        <Box
          sx={styles.grid}
          data-tour={APPLICATIONS_TOUR_TARGET_IDS.catalogGrid}
        >
          {visibleApplications.map(application => {
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
      )}

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
  // Scrolls by itself: the section page's Discover box does not
  wrapper: {
    height: '100%',
    overflowY: 'auto',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    px: '1.5rem',
    pt: '1rem',
    pb: '2rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 20rem), 33.75rem))',
    gap: '1rem',
    alignItems: 'stretch',
  },
});

export default ApplicationCatalog;
