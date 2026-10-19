import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { useProjectBackupSummaryQuery } from '@/[fsd]/features/settings/api';
import { ProjectBackupConstants } from '@/[fsd]/features/settings/lib/constants';
import { ProjectBackupHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { Checkbox, Modal } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import BackupAlert from './BackupAlert';

const { formatCount, formatSize } = ProjectBackupHelpers;
const { CHATS_OPTION, CHAT_BACKUP_OPTION_LABELS, LARGE_BACKUP_BYTES } = ProjectBackupConstants;

const NO_CHATS_TOOLTIP = 'This project has no chats';

const CreateBackupDialog = memo(props => {
  const { open, onClose, onBackup, isDownloading, projectId, projectName } = props;

  const [chats, setChats] = useState(CHATS_OPTION.none);

  const {
    data: summary,
    isFetching: isSummaryLoading,
    isError: isSummaryError,
  } = useProjectBackupSummaryQuery(
    { projectId },
    { skip: !open || !projectId, refetchOnMountOrArgChange: true },
  );

  // Without the summary the chat count is unknown, so the chat options stay available
  const hasChats = isSummaryError || !!summary?.chats_count;
  const chatOptionsDisabled = isDownloading || isSummaryLoading || !hasChats;
  const estimatedSize = chats === CHATS_OPTION.withAttachments ? summary?.attachments_size || 0 : 0;

  const items = useMemo(
    () =>
      Object.values(CHATS_OPTION).map(value => {
        const isChatOption = value !== CHATS_OPTION.none;
        const label = CHAT_BACKUP_OPTION_LABELS[value];
        return {
          value,
          disabled: isChatOption && chatOptionsDisabled,
          label:
            isChatOption && !isSummaryLoading && !hasChats ? (
              <Tooltip
                title={NO_CHATS_TOOLTIP}
                placement="top"
              >
                <Box component="span">{label}</Box>
              </Tooltip>
            ) : (
              label
            ),
        };
      }),
    [chatOptionsDisabled, hasChats, isSummaryLoading],
  );

  const handleClose = useCallback(() => {
    if (isDownloading) return;
    setChats(CHATS_OPTION.none);
    onClose?.();
  }, [isDownloading, onClose]);

  const handleBackup = useCallback(async () => {
    const isDone = await onBackup({ chats, missingAttachments: summary?.missing_attachments });
    if (isDone) {
      setChats(CHATS_OPTION.none);
      onClose?.();
    }
  }, [chats, onBackup, onClose, summary]);

  const styles = createBackupDialogStyles();

  const renderSummary = () => {
    if (isSummaryLoading) return 'Counting chats...';
    if (isSummaryError) return "Couldn't load chat info.";
    if (!summary) return null;
    const parts = [
      formatCount(summary.chats_count, 'chat'),
      formatCount(summary.attachments_count, 'attachment'),
      `~${formatSize(summary.attachments_size)}`,
    ];
    return parts.join(' · ');
  };

  const renderContent = () => (
    <Box sx={styles.root}>
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        Back up the data of{' '}
        <Typography
          component="span"
          variant="labelSmall"
          color="inherit"
        >
          {projectName}
        </Typography>
        . Agents, pipelines, toolkits, MCP servers and skills are always included. Credentials, tokens and
        other secrets are excluded.
      </Typography>

      <Box sx={styles.chats}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          Chats
        </Typography>
        <Checkbox.RadioButtonGroup
          value={chats}
          onChange={setChats}
          items={items}
          disabled={isDownloading}
          testId="project-backup-chats-option"
        />
        <Typography
          variant="bodySmall2"
          color="text.secondary"
          sx={styles.summary}
          data-testid="project-backup-chats-summary"
        >
          {renderSummary()}
        </Typography>
      </Box>

      {chats !== CHATS_OPTION.none && (
        <BackupAlert severity="info">
          Chats contain conversation history of all project members. Store the backup file securely.
        </BackupAlert>
      )}

      {estimatedSize > LARGE_BACKUP_BYTES && (
        <BackupAlert severity="warning">
          Large backup (~{formatSize(estimatedSize)}). It may take a while.
        </BackupAlert>
      )}
    </Box>
  );

  const renderActions = () => (
    <>
      <BaseBtn
        variant={BUTTON_VARIANTS.secondary}
        size="small"
        onClick={handleClose}
        disabled={isDownloading}
        data-testid="project-backup-cancel"
      >
        Cancel
      </BaseBtn>
      <BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        size="small"
        onClick={handleBackup}
        disabled={isDownloading || !projectId}
        data-testid="project-backup-confirm"
      >
        {isDownloading ? 'Preparing...' : 'Backup'}
      </BaseBtn>
    </>
  );

  return (
    <Modal.BaseModal
      open={open}
      title="Create Project Backup"
      onClose={handleClose}
      content={renderContent()}
      actions={renderActions()}
      data-testid="project-backup-modal"
      closeButtonTestId="project-backup-close-button"
    />
  );
});

CreateBackupDialog.displayName = 'CreateBackupDialog';

/** @type {MuiSx} */
const createBackupDialogStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  chats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  summary: {
    paddingLeft: '0.25rem',
  },
});

export default CreateBackupDialog;
