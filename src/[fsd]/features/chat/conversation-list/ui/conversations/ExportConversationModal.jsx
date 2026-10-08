import { memo, useCallback, useMemo, useState } from 'react';

import { Box, LinearProgress, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useConversationExportSummaryQuery } from '@/[fsd]/features/chat/api';
import { useExportConversation } from '@/[fsd]/features/chat/conversation-list/lib/hooks';
import { Button, Checkbox, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { formatFileSize } from '@/common/attachmentValidationUtils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const EXPORT_OPTIONS = {
  without: 'without',
  with: 'with',
};

const OPTION_DESCRIPTIONS = {
  [EXPORT_OPTIONS.without]: 'Only chat messages will be exported as a JSON file.',
  [EXPORT_OPTIONS.with]:
    'Chat messages and all attached and generated files/images will be exported as a ZIP archive.',
};

const LARGE_EXPORT_BYTES = 500 * 1024 * 1024;

const ExportConversationModal = memo(props => {
  const { conversation = {}, onClose } = props;

  const projectId = useSelectedProjectId();
  const [selectedOption, setSelectedOption] = useState(EXPORT_OPTIONS.without);
  const { isExporting, startExport, cancelExport } = useExportConversation();

  const { data: summary, isFetching: isSummaryLoading } = useConversationExportSummaryQuery(
    { projectId, conversationId: conversation.id },
    { skip: !conversation.id, refetchOnMountOrArgChange: true },
  );

  const attachmentsCount = summary?.attachments_count ?? 0;
  const totalSize = summary?.total_size;
  const includeAttachments = selectedOption === EXPORT_OPTIONS.with;
  const hasNoAttachments = !isSummaryLoading && attachmentsCount === 0;

  const attachmentsLabel = useMemo(() => {
    if (isSummaryLoading || !attachmentsCount) return 'With attachments';
    const filesLabel = `${attachmentsCount} ${attachmentsCount === 1 ? 'file' : 'files'}`;
    return `With attachments (${totalSize ? `${filesLabel} · ${formatFileSize(totalSize)}` : filesLabel})`;
  }, [attachmentsCount, isSummaryLoading, totalSize]);

  const options = useMemo(
    () => [
      { value: EXPORT_OPTIONS.without, label: 'Without attachments', disabled: isExporting },
      {
        value: EXPORT_OPTIONS.with,
        label: attachmentsLabel,
        disabled: isExporting || isSummaryLoading || hasNoAttachments,
        info: hasNoAttachments ? 'This chat has no attachments' : undefined,
      },
    ],
    [attachmentsLabel, hasNoAttachments, isExporting, isSummaryLoading],
  );

  const handleClose = useCallback(() => {
    if (isExporting) cancelExport();
    onClose();
  }, [cancelExport, isExporting, onClose]);

  const handleExport = useCallback(async () => {
    const isSuccess = await startExport({ conversation, includeAttachments });
    if (isSuccess) onClose();
  }, [conversation, includeAttachments, onClose, startExport]);

  const styles = exportConversationModalStyles();

  const content = (
    <Box sx={styles.container}>
      <Tooltip
        title={conversation.name}
        placement="top"
      >
        <Typography
          variant="bodyMedium"
          sx={styles.chatName}
          data-testid="export-chat-modal-chat-name"
        >
          {conversation.name}
        </Typography>
      </Tooltip>
      <Checkbox.RadioButtonGroup
        value={selectedOption}
        items={options}
        onChange={setSelectedOption}
        wrapRow
        testId="export-chat-modal-option"
      />
      <Typography
        variant="bodySmall"
        sx={styles.description}
        data-testid="export-chat-modal-option-description"
      >
        {OPTION_DESCRIPTIONS[selectedOption]}
      </Typography>
      {includeAttachments && totalSize > LARGE_EXPORT_BYTES && (
        <Typography
          variant="bodySmall"
          sx={styles.warning}
          data-testid="export-chat-modal-large-warning"
        >
          {`Large export (${formatFileSize(totalSize)}). This may take a while.`}
        </Typography>
      )}
      {isExporting && includeAttachments && (
        <Box sx={styles.progress}>
          <Typography variant="bodySmall">
            {`Exporting chat... ${attachmentsCount} ${attachmentsCount === 1 ? 'file' : 'files'}`}
          </Typography>
          <LinearProgress
            sx={styles.progressBar}
            data-testid="export-chat-modal-progress"
          />
        </Box>
      )}
    </Box>
  );

  const actions = (
    <>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.secondary}
        onClick={handleClose}
        data-testid="export-chat-modal-cancel-button"
      >
        Cancel
      </Button.BaseBtn>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.primary}
        onClick={handleExport}
        disabled={isExporting || isSummaryLoading}
        data-testid="export-chat-modal-export-button"
      >
        {isExporting ? 'Exporting...' : 'Export'}
      </Button.BaseBtn>
    </>
  );

  return (
    <Modal.BaseModal
      open
      title="Export chat"
      onClose={handleClose}
      content={content}
      actions={actions}
      data-testid="export-chat-modal"
    />
  );
});

ExportConversationModal.displayName = 'ExportConversationModal';

/** @type {MuiSx} */
const exportConversationModalStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  chatName: ({ palette }) => ({
    color: palette.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  description: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  warning: ({ palette }) => ({
    color: palette.text.warning,
  }),
  progress: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  progressBar: {
    height: '0.5rem',
    borderRadius: '0.25rem',
  },
});

export default ExportConversationModal;
