import { memo, useCallback } from 'react';

import { Box, Chip, Typography } from '@mui/material';

import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import BaseModal from '@/[fsd]/shared/ui/modal/BaseModal';
import ArrowRightIcon from '@/components/Icons/ArrowRightIcon';
import PlusIcon from '@/components/Icons/PlusIcon';

import { applicationActionButtonStyles } from './applicationActionButton.styles';

const ApplicationDetailsModal = memo(props => {
  const { application, isResolving, onClose, onCreate, onViewConfigured, open } = props;
  const styles = applicationDetailsModalStyles();

  const handleCreate = useCallback(() => {
    if (application) {
      onCreate(application);
    }
  }, [application, onCreate]);

  const handleViewConfigured = useCallback(() => {
    if (application) {
      onViewConfigured(application);
    }
  }, [application, onViewConfigured]);

  if (!application) return null;

  const hasActions = application.isConfigured || application.canCreate;

  const content = (
    <Box sx={styles.content}>
      <Box sx={styles.summaryRow}>
        <Box sx={styles.iconBox}>{application.icon}</Box>
        <Box sx={styles.summaryText}>
          <Typography sx={styles.description}>{application.description}</Typography>
          <Typography sx={styles.bestFor}>{application.bestFor}</Typography>
        </Box>
      </Box>

      <Box sx={styles.section}>
        <Typography
          component="h4"
          variant="subtitle2"
          sx={styles.sectionTitle}
        >
          What it includes
        </Typography>
        <Box sx={styles.capabilities}>
          {application.capabilities.map(capability => (
            <Chip
              key={capability}
              size="small"
              label={capability}
              sx={styles.capabilityChip}
            />
          ))}
        </Box>
      </Box>

      {application.canRequest && (
        <Box sx={styles.requestInfo}>
          <Typography sx={styles.requestText}>
            To request this application for your environment, contact support at{' '}
            <Box
              component="span"
              sx={styles.supportEmail}
            >
              {application.supportEmail}
            </Box>
            .
          </Typography>
        </Box>
      )}
    </Box>
  );

  const actions = hasActions ? (
    <Box sx={styles.actions}>
      {application.canCreate && (
        <BaseBtn
          variant={BUTTON_VARIANTS.contained}
          startIcon={<PlusIcon />}
          disabled={isResolving}
          sx={[styles.actionButton, styles.createActionButton]}
          onClick={handleCreate}
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
          onClick={handleViewConfigured}
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
    </Box>
  ) : null;

  return (
    <BaseModal
      open={open}
      title={application.name}
      titleVariant="h5"
      content={content}
      actions={actions}
      onClose={onClose}
    />
  );
});

ApplicationDetailsModal.displayName = 'ApplicationDetailsModal';

/** @type {MuiSx} */
const applicationDetailsModalStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  summaryRow: {
    display: 'flex',
    gap: '1rem',
  },
  iconBox: ({ palette }) => ({
    width: '3rem',
    height: '3rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: '0.5rem',
    backgroundColor: palette.background.secondary,
    '& svg': {
      width: '1.5rem',
      height: '1.5rem',
    },
  }),
  summaryText: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  description: ({ palette }) => ({
    color: palette.text.primary,
    lineHeight: 1.5,
  }),
  bestFor: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '0.875rem',
    lineHeight: 1.45,
  }),
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  sectionTitle: ({ palette }) => ({
    color: palette.text.primary,
  }),
  capabilities: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  capabilityChip: ({ palette }) => ({
    backgroundColor: palette.background.secondary,
    color: palette.text.primary,
  }),
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.5rem',
  },
  ...applicationActionButtonStyles,
  requestInfo: ({ palette }) => ({
    borderRadius: '0.5rem',
    backgroundColor: palette.background.tabPanel,
    border: `0.0625rem solid ${palette.border.lines}`,
    px: '0.875rem',
    py: '0.75rem',
  }),
  requestText: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '0.875rem',
    lineHeight: 1.45,
  }),
  supportEmail: ({ palette }) => ({
    color: palette.text.primary,
    fontWeight: 600,
    userSelect: 'text',
  }),
});

export default ApplicationDetailsModal;
