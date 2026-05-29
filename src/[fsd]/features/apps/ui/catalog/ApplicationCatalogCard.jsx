import { memo, useCallback } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ClockIcon from '@/assets/clock.svg?react';
import GearIcon from '@/assets/gear-icon.svg?react';
import LinkIcon from '@/assets/link-icon.svg?react';
import EntityIcon from '@/components/EntityIcon';
import HighlightQuery from '@/components/HighlightQuery';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { getCardGradientStyles } from '@/utils/cardStyles';

const ApplicationCatalogCard = memo(props => {
  const {
    application,
    onConfigure,
    onRequestAccess,
    isPending,
    canCreate,
    canRequest,
    isLoading,
    isFetchingStatus,
  } = props;
  const projectId = useSelectedProjectId();
  const styles = applicationCatalogCardStyles();

  const handleConfigureClick = useCallback(
    event => {
      event.stopPropagation();
      onConfigure?.(application);
    },
    [application, onConfigure],
  );

  const handleRequestClick = useCallback(
    event => {
      event.stopPropagation();
      onRequestAccess?.(application);
    },
    [application, onRequestAccess],
  );

  return (
    <Box sx={styles.card}>
      <Box sx={styles.header}>
        <Box sx={styles.iconWrapper}>
          <EntityIcon
            icon={application.icon_meta}
            entityType="application"
            projectId={projectId}
            editable={false}
          />
        </Box>
        <StyledTooltip
          placement="top"
          enterDelay={1000}
          enterNextDelay={1000}
          title={
            <>
              <Typography
                variant="bodySmall2"
                sx={styles.titleTooltip}
              >
                {application.name || ''}
              </Typography>
              <Typography
                variant="bodySmall2"
                sx={styles.descriptionTooltip}
              >
                {application.description || ''}
              </Typography>
            </>
          }
        >
          <Typography
            color="text.secondary"
            variant="headingSmall"
            sx={styles.title}
          >
            <HighlightQuery
              text={application.name}
              color="text.secondary"
              variant="headingSmall"
            />
          </Typography>
        </StyledTooltip>
      </Box>

      <Box sx={styles.content}>
        <Box sx={styles.descriptionContainer}>
          <Typography sx={styles.descriptionText}>
            <Box component="b">Use it to: </Box>
            {application.shortDescription}
          </Typography>
          <Typography sx={styles.descriptionText}>
            <Box component="b">Includes: </Box>
            {application.capabilities?.join(', ')}
          </Typography>
          <Typography sx={styles.descriptionText}>
            <Box component="b">Best for: </Box>
            {application.bestFor}
          </Typography>
        </Box>

        <Box sx={styles.actions}>
          {isFetchingStatus ? (
            <CircularProgress size={18} />
          ) : (
            <>
              {canCreate && !isPending && (
                <BaseBtn
                  variant={BUTTON_VARIANTS.special}
                  startIcon={<GearIcon />}
                  disabled={isLoading}
                  sx={styles.configureButton}
                  onClick={handleConfigureClick}
                >
                  <Typography
                    component="span"
                    variant="labelSmall"
                  >
                    Configure
                  </Typography>
                </BaseBtn>
              )}

              {canRequest && !isPending && (
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
            </>
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
    </Box>
  );
});

ApplicationCatalogCard.displayName = 'ApplicationCatalogCard';

/** @type {MuiSx} */
const applicationCatalogCardStyles = () => {
  const lineClamp = lines => ({
    width: '100%',
    wordWrap: 'wrap',
    overflowWrap: 'break-word',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: String(lines),
  });

  return {
    card: ({ palette }) => ({
      ...getCardGradientStyles(palette),
      padding: '1rem 1.25rem',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
    }),
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '0.75rem',
    },
    iconWrapper: {
      width: '2.25rem',
      height: '2.25rem',
      flexShrink: 0,
    },
    title: {
      maxHeight: '3rem',
      ...lineClamp(2),
    },
    titleTooltip: {
      fontWeight: 700,
      ...lineClamp(2),
    },
    descriptionTooltip: {
      ...lineClamp(4),
    },
    content: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    descriptionContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      marginBottom: '1rem',
    },
    descriptionText: ({ palette }) => ({
      color: palette.text.secondary,
      fontSize: '0.8125rem',
      lineHeight: 1.45,
      ...lineClamp(3),
    }),
    actions: {
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '0.5rem',
      minHeight: '2rem',
    },
    configureButton: ({ palette }) => ({
      '& svg': {
        width: '1rem',
        height: '1rem',
      },
      '& svg path': {
        fill: palette.icon.fill.white,
      },
    }),
    pendingStatus: ({ palette }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      color: palette.status.onModeration,
    }),
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
  };
};

export default ApplicationCatalogCard;
