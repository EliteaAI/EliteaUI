import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { Box, LinearProgress, Typography } from '@mui/material';

import { IMPORT_STEPS } from '@/[fsd]/features/chat/conversation-list/lib/constants';
import {
  getAttachmentsSelectionSummary,
  getSelectableAttachments,
} from '@/[fsd]/features/chat/conversation-list/lib/helpers';
import { useImportConversation } from '@/[fsd]/features/chat/conversation-list/lib/hooks';
import { Button, Checkbox, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { formatFileSize } from '@/common/attachmentValidationUtils';

import ImportAttachmentRow from './ImportAttachmentRow';

const FILE_INPUT_ACCEPT = '.enc';

const ImportConversationModal = memo(props => {
  const { onClose, onImported } = props;

  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    step,
    file,
    preview,
    selectedPaths,
    uploadProgress,
    selectFile,
    toggleAttachment,
    toggleAll,
    startImport,
    cancel,
  } = useImportConversation({ onImported });

  const attachments = useMemo(() => preview?.attachments || [], [preview]);
  const selectableCount = useMemo(() => getSelectableAttachments(attachments).length, [attachments]);
  const { selectedCount, totalCount, selectedSize } = useMemo(
    () => getAttachmentsSelectionSummary(attachments, selectedPaths),
    [attachments, selectedPaths],
  );

  const isBusy = step === IMPORT_STEPS.checking || step === IMPORT_STEPS.importing;

  const handleClose = useCallback(() => {
    if (step === IMPORT_STEPS.importing) return;
    cancel();
    onClose();
  }, [cancel, onClose, step]);

  const handleChooseFile = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileChange = useCallback(
    event => {
      const [newFile] = event.target.files || [];
      event.target.value = '';
      selectFile(newFile);
    },
    [selectFile],
  );

  const handleDragOver = useCallback(
    event => {
      event.preventDefault();
      if (!isBusy) setIsDragOver(true);
    },
    [isBusy],
  );

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleDrop = useCallback(
    event => {
      event.preventDefault();
      setIsDragOver(false);
      if (isBusy) return;
      const [droppedFile] = event.dataTransfer?.files || [];
      selectFile(droppedFile);
    },
    [isBusy, selectFile],
  );

  const handleImport = useCallback(async () => {
    const isSuccess = await startImport();
    if (isSuccess) onClose();
  }, [onClose, startImport]);

  const styles = importConversationModalStyles();

  const renderPreview = () => (
    <Box
      sx={styles.preview}
      data-testid="import-chat-modal-preview"
    >
      <Typography
        variant="bodyMedium"
        sx={styles.success}
      >
        ✅ File checked successfully
      </Typography>
      <Typography variant="bodySmall">
        <Box
          component="span"
          sx={styles.label}
        >
          Chat name:{' '}
        </Box>
        <Box
          component="span"
          data-testid="import-chat-modal-chat-name"
        >
          {preview.name}
        </Box>
      </Typography>
      <Typography variant="bodySmall">
        <Box
          component="span"
          sx={styles.label}
        >
          Messages:{' '}
        </Box>
        {`${preview.messages_count} ${preview.messages_count === 1 ? 'message' : 'messages'}`}
      </Typography>
      {preview.exported_at && (
        <Typography variant="bodySmall">
          <Box
            component="span"
            sx={styles.label}
          >
            Exported at:{' '}
          </Box>
          {new Date(preview.exported_at).toLocaleString()}
        </Typography>
      )}
      {!preview.include_attachments && (
        <Typography
          variant="bodySmall"
          sx={styles.description}
        >
          {preview.attachments_referenced
            ? 'The file was exported without its archive. Attachments will be shown as "not imported".'
            : 'This chat will be imported without attachments.'}
        </Typography>
      )}
      {preview.include_attachments && totalCount > 0 && (
        <Box sx={styles.attachments}>
          <Box sx={styles.attachmentsHeader}>
            <Checkbox.BaseCheckbox
              size="small"
              checked={selectableCount > 0 && selectedCount === selectableCount}
              indeterminate={selectedCount > 0 && selectedCount < selectableCount}
              disabled={!selectableCount || step === IMPORT_STEPS.importing}
              onChange={toggleAll}
              inputProps={{ 'aria-label': 'Select all' }}
              data-testid="import-chat-modal-select-all"
            />
            <Typography variant="bodySmall">Select all</Typography>
          </Box>
          <Box sx={styles.attachmentsList}>
            {attachments.map(attachment => (
              <ImportAttachmentRow
                key={attachment.export_path || attachment.name}
                attachment={attachment}
                checked={selectedPaths.includes(attachment.export_path)}
                onToggle={toggleAttachment}
              />
            ))}
          </Box>
          <Typography
            variant="bodySmall"
            sx={styles.description}
            data-testid="import-chat-modal-selection-counter"
          >
            {`Selected ${selectedCount} of ${totalCount} attachments (${formatFileSize(selectedSize)})`}
          </Typography>
        </Box>
      )}
    </Box>
  );

  const content = (
    <Box sx={styles.container}>
      <Box
        component="input"
        type="file"
        accept={FILE_INPUT_ACCEPT}
        ref={fileInputRef}
        onChange={handleFileChange}
        sx={styles.hiddenInput}
        data-testid="import-chat-modal-file-input"
      />
      {step !== IMPORT_STEPS.importing && (
        <Box
          sx={styles.dropZone(isDragOver)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Typography
            variant="bodySmall"
            sx={styles.description}
          >
            {file
              ? file.name
              : 'Select an encrypted chat file exported from ELITEA (.json.enc or .zip.enc), or drop it here.'}
          </Typography>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.secondary}
            onClick={handleChooseFile}
            disabled={isBusy}
            data-testid="import-chat-modal-choose-file-button"
          >
            {file ? 'Change file' : 'Choose file'}
          </Button.BaseBtn>
        </Box>
      )}
      {step === IMPORT_STEPS.checking && (
        <Box sx={styles.progress}>
          <Typography variant="bodySmall">Checking file...</Typography>
          <LinearProgress
            variant={uploadProgress < 100 ? 'determinate' : 'indeterminate'}
            value={uploadProgress}
            sx={styles.progressBar}
            data-testid="import-chat-modal-checking-progress"
          />
        </Box>
      )}
      {preview && renderPreview()}
      {step === IMPORT_STEPS.importing && (
        <Box sx={styles.progress}>
          <Typography variant="bodySmall">
            {selectedCount ? `Importing chat... Uploading ${selectedCount} attachment(s)` : 'Importing chat...'}
          </Typography>
          <LinearProgress
            sx={styles.progressBar}
            data-testid="import-chat-modal-importing-progress"
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
        disabled={step === IMPORT_STEPS.importing}
        data-testid="import-chat-modal-cancel-button"
      >
        Cancel
      </Button.BaseBtn>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.primary}
        onClick={handleImport}
        disabled={step !== IMPORT_STEPS.ready}
        data-testid="import-chat-modal-import-button"
      >
        {step === IMPORT_STEPS.importing ? 'Importing...' : 'Import'}
      </Button.BaseBtn>
    </>
  );

  return (
    <Modal.BaseModal
      open
      title="Import chat"
      onClose={handleClose}
      content={content}
      actions={actions}
      data-testid="import-chat-modal"
    />
  );
});

ImportConversationModal.displayName = 'ImportConversationModal';

/** @type {MuiSx} */
const importConversationModalStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  hiddenInput: {
    display: 'none',
  },
  dropZone: isDragOver => ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem dashed ${isDragOver ? palette.primary.main : palette.border.lines}`,
    textAlign: 'center',
    wordBreak: 'break-word',
  }),
  preview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  success: ({ palette }) => ({
    color: palette.text.primary,
  }),
  label: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  description: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  attachments: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  attachmentsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  attachmentsList: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '15rem',
    overflowY: 'auto',
  },
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

export default ImportConversationModal;
