import { memo, useCallback, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { Box, Typography } from '@mui/material';

import { useApplicationCatalogState } from '@/[fsd]/features/apps/lib/hooks';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { AppsTabs, ContentType, URL_PARAMS_KEY_TAGS, ViewMode } from '@/common/constants';
import EntityCard from '@/components/Card';
import CardList from '@/components/CardList';
import ArrowRightIcon from '@/components/Icons/ArrowRightIcon';
import PlusIcon from '@/components/Icons/PlusIcon';
import RouteDefinitions from '@/routes';

import ApplicationDetailsModal from './ApplicationDetailsModal';
import { applicationActionButtonStyles } from './applicationActionButton.styles';

const APPLICATION_CATALOG_CARD_WIDTH = 'min(42rem, calc(100% - 1rem))';

const ApplicationCatalog = memo(() => {
  const styles = applicationCatalogStyles();
  const location = useLocation();
  const navigate = useNavigate();
  const { applications, isLoading } = useApplicationCatalogState();
  const [selectedApplication, setSelectedApplication] = useState(null);

  const handleOpenDetails = useCallback(application => {
    setSelectedApplication(application);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedApplication(null);
  }, []);

  const handleCreate = useCallback(
    application => {
      navigate(RouteDefinitions.CreateAppType.replace(':appType', application.type));
    },
    [navigate],
  );

  const handleViewConfigured = useCallback(
    application => {
      const searchParams = new URLSearchParams(location.search);
      searchParams.delete(URL_PARAMS_KEY_TAGS);
      searchParams.append(URL_PARAMS_KEY_TAGS, application.typeLabel);

      navigate(
        {
          pathname: `${RouteDefinitions.Apps}/${AppsTabs[1]}`,
          search: searchParams.toString(),
        },
        { state: location.state },
      );
    },
    [location.search, location.state, navigate],
  );

  const handleCatalogTagClick = useCallback(event => {
    event.stopPropagation();
  }, []);

  const handleLoadMore = useCallback(() => {}, []);

  const renderApplicationCard = useCallback(
    (application, cardType, index) => {
      const handleCreateClick = event => {
        event.stopPropagation();
        handleCreate(application);
      };

      const handleViewConfiguredClick = event => {
        event.stopPropagation();
        handleViewConfigured(application);
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
          onCardClick={handleOpenDetails}
          cardDetails={
            <Box sx={styles.cardDetails}>
              <Typography sx={styles.cardDescription}>{application.shortDescription}</Typography>

              <Box sx={styles.cardMeta}>
                <Typography sx={styles.metaText}>{application.typeLabel}</Typography>
                <Box sx={styles.metaDivider} />
                <Typography sx={styles.metaText}>{application.statusLabel}</Typography>
              </Box>

              <Box sx={styles.cardActions}>
                {application.canCreate && (
                  <BaseBtn
                    variant={BUTTON_VARIANTS.contained}
                    startIcon={<PlusIcon />}
                    disabled={isLoading}
                    sx={[styles.actionButton, styles.createActionButton]}
                    onClick={handleCreateClick}
                  >
                    <Typography
                      component="span"
                      variant="labelSmall"
                      sx={styles.actionButtonLabel}
                    >
                      Create App
                    </Typography>
                  </BaseBtn>
                )}

                {application.isConfigured && (
                  <BaseBtn
                    variant={BUTTON_VARIANTS.secondary}
                    startIcon={<ArrowRightIcon />}
                    sx={styles.actionButton}
                    onClick={handleViewConfiguredClick}
                  >
                    <Typography
                      component="span"
                      variant="labelSmall"
                      sx={styles.actionButtonLabel}
                    >
                      View Configured
                    </Typography>
                  </BaseBtn>
                )}

                {application.canRequest && (
                  <Typography sx={styles.requestText}>
                    Request through support at{' '}
                    <Box
                      component="span"
                      sx={styles.supportEmail}
                    >
                      {application.supportEmail}
                    </Box>
                  </Typography>
                )}
              </Box>
            </Box>
          }
        />
      );
    },
    [handleCatalogTagClick, handleCreate, handleOpenDetails, handleViewConfigured, isLoading, styles],
  );

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.header}>
        <Typography
          component="h1"
          variant="h5"
          sx={styles.title}
        >
          Request an application
        </Typography>
        <Typography sx={styles.subtitle}>
          Choose a ready application to configure for this project, or request access when it is not yet
          available.
        </Typography>
      </Box>

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
          cardHeight="14rem"
          cardWidthOverride={APPLICATION_CATALOG_CARD_WIDTH}
          emptyListPlaceHolder={
            <Typography component="span">No applications are available to request.</Typography>
          }
        />
      </Box>

      <ApplicationDetailsModal
        open={Boolean(selectedApplication)}
        application={selectedApplication}
        isResolving={isLoading}
        onClose={handleCloseDetails}
        onCreate={handleCreate}
        onViewConfigured={handleViewConfigured}
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
  header: {
    maxWidth: '48rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  title: ({ palette }) => ({
    color: palette.text.primary,
  }),
  subtitle: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '0.875rem',
    lineHeight: 1.5,
  }),
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
  cardActions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.5rem',
    mb: '0.25rem',
  },
  ...applicationActionButtonStyles,
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
  },
  metaText: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '0.75rem',
    lineHeight: 1.35,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  metaDivider: ({ palette }) => ({
    width: '0.0625rem',
    height: '0.875rem',
    flexShrink: 0,
    backgroundColor: palette.border.lines,
  }),
  requestText: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '0.8125rem',
    lineHeight: 1.45,
  }),
  supportEmail: ({ palette }) => ({
    color: palette.text.primary,
    fontWeight: 600,
    userSelect: 'text',
  }),
});

export default ApplicationCatalog;
