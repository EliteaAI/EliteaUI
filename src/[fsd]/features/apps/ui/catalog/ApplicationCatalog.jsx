import { memo, useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Box, Typography } from '@mui/material';

import { REQUEST_STATUS } from '@/[fsd]/features/apps/lib/constants/applicationCatalog.constants';
import { useApplicationCatalogState, useApplicationRequests } from '@/[fsd]/features/apps/lib/hooks';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ClockIcon from '@/assets/clock.svg?react';
import GearIcon from '@/assets/gear-icon.svg?react';
import LinkIcon from '@/assets/link-icon.svg?react';
import { ContentType, ViewMode } from '@/common/constants';
import EntityCard from '@/components/Card';
import CardList from '@/components/CardList';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

import RequestAccessModal from './RequestAccessModal';
import { applicationActionButtonStyles } from './applicationActionButton.styles';

const APPLICATION_CATALOG_CARD_WIDTH = 'min(42rem, calc(100% - 1rem))';

const ApplicationCatalog = memo(() => {
  const styles = applicationCatalogStyles();
  const navigate = useNavigate();
  const { toastSuccess } = useToast();
  const { applications, isLoading } = useApplicationCatalogState();
  const { submitRequest, getRequestStatus } = useApplicationRequests();

  const [requestModalApp, setRequestModalApp] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenRequestModal = useCallback(application => {
    setRequestModalApp(application);
  }, []);

  const handleCloseRequestModal = useCallback(() => {
    setRequestModalApp(null);
  }, []);

  const handleSubmitRequest = useCallback(
    (application, reason) => {
      setIsSubmitting(true);
      submitRequest(application.type, reason);
      setIsSubmitting(false);
      setRequestModalApp(null);
      toastSuccess('Your request sent successfully!');
    },
    [submitRequest, toastSuccess],
  );

  const handleCreate = useCallback(
    application => {
      navigate(RouteDefinitions.CreateAppType.replace(':appType', application.type));
    },
    [navigate],
  );

  const handleCatalogTagClick = useCallback(event => {
    event.stopPropagation();
  }, []);

  const handleLoadMore = useCallback(() => {}, []);

  const renderApplicationCard = useCallback(
    (application, cardType, index) => {
      const requestStatus = getRequestStatus(application.type);
      const isPending = requestStatus === REQUEST_STATUS.PENDING;
      const canRequestAccess = !application.canCreate && requestStatus !== REQUEST_STATUS.PENDING;

      const handleCreateClick = event => {
        event.stopPropagation();
        handleCreate(application);
      };

      const handleRequestClick = event => {
        event.stopPropagation();
        handleOpenRequestModal(application);
      };

      return (
        <EntityCard
          data={application}
          viewMode={ViewMode.Owner}
          type={cardType}
          index={index}
          disableCardActions
          hideCardBottom
          customTagClickHandler={handleCatalogTagClick}
          cardDetails={
            <Box sx={styles.cardDetails}>
              <Box>
                <Typography sx={styles.cardDescription}>{application.shortDescription}</Typography>
                <Box sx={styles.additionalDescription}>
                  <Typography sx={styles.cardDescription}>
                    <Box component="b">Includes: </Box>
                    {application.capabilities.join(', ')}
                  </Typography>
                </Box>
                <Box sx={styles.additionalDescription}>
                  <Typography sx={styles.cardDescription}>
                    <Box component="b">Best for: </Box>
                    {application.bestFor}
                  </Typography>
                </Box>
              </Box>

              <Box sx={styles.cardActions}>
                {application.canCreate && !isPending && (
                  <BaseBtn
                    variant={BUTTON_VARIANTS.contained}
                    startIcon={<GearIcon />}
                    disabled={isLoading}
                    sx={[styles.actionButton, styles.createActionButton]}
                    onClick={handleCreateClick}
                  >
                    <Typography
                      component="span"
                      variant="labelSmall"
                      sx={styles.actionButtonLabel}
                    >
                      Configure
                    </Typography>
                  </BaseBtn>
                )}

                {canRequestAccess && !isPending && (
                  <BaseBtn
                    variant={BUTTON_VARIANTS.auxiliary}
                    onClick={handleRequestClick}
                  >
                    <Typography
                      component="span"
                      variant="labelSmall"
                    >
                      Request Access
                    </Typography>
                  </BaseBtn>
                )}

                {isPending && (
                  <Box sx={styles.pendingStatus}>
                    <ClockIcon />
                    <Typography variant="labelSmall">Pending approval</Typography>
                  </Box>
                )}

                <Box
                  component="a"
                  href={application.documentation}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  sx={styles.documentationLink}
                >
                  <Typography
                    component="span"
                    variant="labelSmall"
                    sx={styles.documentationText}
                  >
                    Documentation
                  </Typography>
                  <LinkIcon />
                </Box>
              </Box>
            </Box>
          }
        />
      );
    },
    [getRequestStatus, handleCatalogTagClick, handleCreate, handleOpenRequestModal, isLoading, styles],
  );

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.cards}>
        <CardList
          cardList={applications}
          total={applications.length}
          isLoading={isLoading}
          isError={false}
          renderCard={renderApplicationCard}
          cardType={ContentType.AppAll}
          loadMoreFunc={handleLoadMore}
          isFullWidth
          disableTableView
          cardHeight="12.5rem"
          cardWidthOverride={APPLICATION_CATALOG_CARD_WIDTH}
          emptyListPlaceHolder={
            <Typography component="span">No applications are available to request.</Typography>
          }
        />
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
  cards: {
    width: '100%',
    ml: '-1.5rem',
  },
  cardDetails: {
    minHeight: 0,
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  cardDescription: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '0.8125rem',
    lineHeight: 1.45,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: '3',
  }),
  additionalDescription: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  cardActions: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.5rem',
    mb: '0.25rem',
  },
  ...applicationActionButtonStyles,
  documentationLink: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    textDecoration: 'none',
    color: palette.text.default,
    transition: 'color 0.2s',
    '&:hover': {
      color: palette.text.secondary,
    },
    '& svg': {
      width: '0.875rem',
      height: '0.875rem',
    },
  }),
  documentationText: {
    fontSize: '0.8125rem',
    lineHeight: 1.45,
    textDecoration: 'underline',
  },
  pendingStatus: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    color: palette.status.onModeration,
  }),
});

export default ApplicationCatalog;
