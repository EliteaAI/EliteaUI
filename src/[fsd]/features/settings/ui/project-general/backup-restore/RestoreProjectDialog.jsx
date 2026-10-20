import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { useDispatch } from 'react-redux';

import CheckOutlined from '@mui/icons-material/CheckOutlined';
import UploadFileOutlined from '@mui/icons-material/UploadFileOutlined';
import { Box, FormControlLabel, Tooltip, Typography } from '@mui/material';

import { useRestoreProjectBackupMutation } from '@/[fsd]/features/settings/api';
import { ProjectBackupConstants } from '@/[fsd]/features/settings/lib/constants';
import { ProjectBackupHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { Checkbox, Modal } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { actions as chatActions } from '@/slices/chat';

import BackupAlert from './BackupAlert';

const { formatCount, formatSize, getRestoreErrorMessage, getDefaultRestoreChats, getChatsSummaryText } =
  ProjectBackupHelpers;
const { CHATS_OPTION, CHAT_RESTORE_OPTION_LABELS, RESTORE_OPTION_LABELS } = ProjectBackupConstants;

const NO_FILES_TOOLTIP = 'This backup has no attachment files';

const RestoreProjectDialog = memo(props => {
  const { open, onClose, projectId, projectName } = props;

  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [artifact, setArtifact] = useState(null);
  const [truncate, setTruncate] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [allowMismatch, setAllowMismatch] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [restoreChats, setRestoreChats] = useState(CHATS_OPTION.none);
  const [isInspecting, setIsInspecting] = useState(false);

  const [restoreProject, { isLoading: isRestoring }] = useRestoreProjectBackupMutation();
  const { toastWarning } = useToast();
  const dispatch = useDispatch();
  const isLoading = isRestoring || isInspecting;

  const backupChats = artifact?.chats_included ?? CHATS_OPTION.none;
  const hasChats = backupChats !== CHATS_OPTION.none;
  const hasFiles = !!artifact?.has_attachment_files;
  const isChatRestore = hasChats && restoreChats !== CHATS_OPTION.none;

  // The backend recognizes the uploaded file and reports what it found in
  // "artifact"; the dialog only reacts to that answer.
  // projectId can arrive as a string from the store, so compare numerically
  const isMismatch =
    typeof artifact?.project_id === 'number' &&
    projectId != null &&
    artifact.project_id !== Number(projectId);

  const reset = useCallback(() => {
    setFile(null);
    setArtifact(null);
    setTruncate(false);
    setDryRun(true);
    setAllowMismatch(false);
    setError('');
    setResult(null);
    setRestoreChats(CHATS_OPTION.none);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    reset();
    onClose?.();
  }, [isLoading, reset, onClose]);

  const handlePick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async event => {
      const picked = event.target.files?.[0] ?? null;
      setError('');
      setResult(null);
      setArtifact(null);
      setAllowMismatch(false);
      setDryRun(true);
      setRestoreChats(CHATS_OPTION.none);
      setFile(picked);
      if (!picked) return;

      // Read what the backup carries right away, so the chat options can be offered
      setIsInspecting(true);
      try {
        const response = await restoreProject({
          projectId,
          file: picked,
          inspect: true,
          allowProjectMismatch: true,
        }).unwrap();
        if (response?.artifact) {
          setArtifact(response.artifact);
          setRestoreChats(getDefaultRestoreChats(response.artifact));
        }
      } catch (err) {
        setError(getRestoreErrorMessage(err));
        if (err?.data?.artifact) setArtifact(err.data.artifact);
      } finally {
        setIsInspecting(false);
      }
    },
    [projectId, restoreProject],
  );

  const handleSubmit = useCallback(async () => {
    setError('');
    setResult(null);

    try {
      const response = await restoreProject({
        projectId,
        file,
        truncate,
        dryRun,
        allowProjectMismatch: isMismatch && allowMismatch,
        restoreChats: hasChats ? restoreChats : undefined,
      }).unwrap();
      setResult(response);
      if (response?.artifact) setArtifact(response.artifact);
      // Replacing the chats deletes the one the chat page would reopen
      if (truncate && response?.result?.chats && !response.result.dry_run) {
        dispatch(chatActions.resetLastSelectedConversationId({ projectId }));
      }
      const failedAttachments = response?.result?.attachments?.failed;
      if (failedAttachments && !response.result.dry_run) {
        toastWarning(`Restore completed. ${failedAttachments} attachment file(s) could not be restored.`);
      }
    } catch (err) {
      setError(getRestoreErrorMessage(err));
      // A project mismatch comes back as 409 with the artifact the backend read,
      // so the confirmation checkbox below can be offered
      if (err?.data?.artifact) setArtifact(err.data.artifact);
      if (err?.data?.result) setResult(err.data);
    }
  }, [
    restoreProject,
    projectId,
    file,
    truncate,
    dryRun,
    isMismatch,
    allowMismatch,
    hasChats,
    restoreChats,
    toastWarning,
    dispatch,
  ]);

  const handleTruncateChange = useCallback(event => setTruncate(event.target.checked), []);
  const handleDryRunChange = useCallback(event => setDryRun(event.target.checked), []);
  const handleAllowMismatchChange = useCallback(event => setAllowMismatch(event.target.checked), []);

  const summary = result?.result;
  const chatsSummary = getChatsSummaryText(summary);

  const chatItems = useMemo(
    () =>
      Object.values(CHATS_OPTION).map(value => {
        const label = CHAT_RESTORE_OPTION_LABELS[value];
        const noFiles = value === CHATS_OPTION.withAttachments && !hasFiles;
        return {
          value,
          disabled: noFiles,
          label: noFiles ? (
            <Tooltip
              title={NO_FILES_TOOLTIP}
              placement="top"
            >
              <Box component="span">{label}</Box>
            </Tooltip>
          ) : (
            label
          ),
        };
      }),
    [hasFiles],
  );

  // Once data was actually written (not a preview) without errors, there is nothing left to
  // submit — an active "Restore" again reads as if it did not happen, so it turns into a
  // disabled "Restored" confirmation
  const isRestoreCompleted = !!result?.ok && !!summary && !summary.dry_run && !error;

  // A backup taken before a migration carries columns this project no longer
  // has; the backend drops them and lists them per table
  const droppedColumns = Object.entries(summary?.dropped_columns ?? {}).flatMap(([table, columns]) =>
    columns.map(column => `${table}.${column}`),
  );

  // The reverse drift: this project requires a column the backup has no value
  // for, so the backend restored it empty
  const filledColumns = Object.entries(summary?.filled_columns ?? {}).flatMap(([table, columns]) =>
    columns.map(column => `${table}.${column}`),
  );

  const styles = restoreProjectDialogStyles();

  const renderContent = () => (
    <Box sx={styles.root}>
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        Restore data from the backup file into{' '}
        <Typography
          component="span"
          variant="labelSmall"
          color="inherit"
        >
          {projectName}
        </Typography>
        {'. Credentials and tokens will not be restored. Backup data from another project can be applied '}
        {'here only after you solve the conflicts and confirm the differences.'}
      </Typography>

      {!!error && <BackupAlert severity="error">{error}</BackupAlert>}

      <Box sx={styles.filePicker}>
        <BaseBtn
          variant={BUTTON_VARIANTS.secondary}
          size="small"
          startIcon={<UploadFileOutlined />}
          onClick={handlePick}
          disabled={isLoading}
          sx={styles.chooseFileButton}
          data-testid="project-restore-choose-file"
        >
          Choose a backup file
        </BaseBtn>
        <Typography
          variant="bodySmall2"
          color="text.secondary"
          sx={styles.fileName}
        >
          {file ? `${file.name} (${formatSize(file.size)})` : 'No files selected'}
        </Typography>
        <Box
          component="input"
          ref={inputRef}
          type="file"
          accept=".enc,.sql,.zip,text/plain,application/sql,application/zip,application/octet-stream"
          sx={styles.hiddenInput}
          onChange={handleFileChange}
        />
      </Box>

      {isMismatch && (
        <>
          <BackupAlert severity="warning">
            This data was backed up from project {artifact.project_id}. If you restore it to{' '}
            {projectName ? `"${projectName}"` : 'this project'} (project {projectId}), you will put foreign
            data into the project.
          </BackupAlert>
          <FormControlLabel
            control={
              <Checkbox.BaseCheckbox
                checked={allowMismatch}
                onChange={handleAllowMismatchChange}
                disabled={isLoading}
                data-testid="project-restore-allow-mismatch"
              />
            }
            label={
              <Typography
                variant="bodyMedium"
                color="text.secondary"
              >
                {RESTORE_OPTION_LABELS.allowMismatch}
              </Typography>
            }
          />
        </>
      )}

      <Box sx={styles.options}>
        <FormControlLabel
          control={
            <Checkbox.BaseCheckbox
              checked={dryRun}
              onChange={handleDryRunChange}
              disabled={isLoading}
              data-testid="project-restore-dry-run"
            />
          }
          label={
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              {RESTORE_OPTION_LABELS.dryRun}
            </Typography>
          }
        />
        <FormControlLabel
          control={
            <Checkbox.BaseCheckbox
              checked={truncate}
              onChange={handleTruncateChange}
              disabled={isLoading}
              data-testid="project-restore-truncate"
            />
          }
          label={
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              {RESTORE_OPTION_LABELS.truncate}
            </Typography>
          }
        />
      </Box>

      {!!artifact && !hasChats && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
          data-testid="project-restore-no-chats"
        >
          This backup does not contain chats.
        </Typography>
      )}

      {hasChats && (
        <Box sx={styles.chats}>
          <Typography
            variant="labelMedium"
            color="text.secondary"
          >
            Chats
          </Typography>
          <Checkbox.RadioButtonGroup
            value={restoreChats}
            onChange={setRestoreChats}
            items={chatItems}
            wrapRow
            disabled={isLoading}
            testId="project-restore-chats-option"
          />
          <Typography
            variant="bodySmall2"
            color="text.secondary"
            data-testid="project-restore-chats-info"
          >
            Backup contains {formatCount(artifact.chats_count ?? 0, 'chat')} ·{' '}
            {formatCount(artifact.attachments_count ?? 0, 'attachment')}
            {hasFiles ? ` (~${formatSize(artifact.attachments_size)})` : ''}
          </Typography>
        </Box>
      )}

      {truncate && (
        <BackupAlert severity="warning">
          If checked, the existing rows in the affected tables will be deleted before applying the backup. If
          unchecked, the existing rows will be preserved and new rows will be merged with them.
        </BackupAlert>
      )}

      {truncate && isChatRestore && (
        <BackupAlert
          severity="warning"
          data-testid="project-restore-replace-chats-warning"
        >
          All existing chats in {projectName || 'this project'} will be permanently deleted and replaced with
          the chats from the backup.
        </BackupAlert>
      )}

      {!!summary && (
        <BackupAlert severity={result?.ok ? 'success' : 'warning'}>
          <Typography
            variant="labelMedium"
            color="inherit"
          >
            {summary.dry_run ? 'Dry run finished' : 'Restore applied'}
            {summary.mode ? ` (${summary.mode})` : ''}
          </Typography>
          <Typography
            variant="bodySmall2"
            color="inherit"
            sx={styles.summaryBody}
          >
            {summary.statements} statements, {summary.total_rows} rows into{' '}
            {summary.applied_tables?.length ?? 0} tables
            {summary.truncated_tables?.length ? ` · truncated ${summary.truncated_tables.length}` : ''}
            {summary.skipped_tables?.length ? ` · skipped ${summary.skipped_tables.join(', ')}` : ''}
          </Typography>
          {droppedColumns.length > 0 && (
            <Typography
              variant="bodySmall2"
              color="inherit"
              sx={styles.summaryBody}
            >
              Columns missing in this project were dropped: {droppedColumns.join(', ')}
              {summary.dropped_values ? ` (${summary.dropped_values} values not restored)` : ''}
            </Typography>
          )}
          {!!chatsSummary && (
            <Typography
              variant="bodySmall2"
              color="inherit"
              sx={styles.summaryBody}
              data-testid="project-restore-chats-summary"
            >
              {chatsSummary}
            </Typography>
          )}
          {filledColumns.length > 0 && (
            <Typography
              variant="bodySmall2"
              color="inherit"
              sx={styles.summaryBody}
            >
              Columns this project requires were restored empty: {filledColumns.join(', ')}
            </Typography>
          )}
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
        disabled={isLoading}
        data-testid="project-restore-cancel"
      >
        {isRestoreCompleted ? 'Close' : 'Cancel'}
      </BaseBtn>
      <BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        size="small"
        onClick={handleSubmit}
        startIcon={isRestoreCompleted ? <CheckOutlined /> : undefined}
        disabled={isRestoreCompleted || isLoading || !file || (isMismatch && !allowMismatch)}
        data-testid="project-restore-submit"
      >
        {isRestoreCompleted ? 'Restored' : isLoading ? 'Restoring...' : dryRun ? 'Preview' : 'Restore'}
      </BaseBtn>
    </>
  );

  return (
    <Modal.BaseModal
      open={open}
      title="Restore Project Data"
      onClose={handleClose}
      content={renderContent()}
      actions={renderActions()}
      data-testid="project-restore-modal"
      closeButtonTestId="project-restore-close-button"
    />
  );
});

RestoreProjectDialog.displayName = 'RestoreProjectDialog';

/** @type {MuiSx} */
const restoreProjectDialogStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  filePicker: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  chooseFileButton: {
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  fileName: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  hiddenInput: {
    display: 'none',
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
  },
  chats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  summaryBody: {
    marginTop: '0.25rem',
  },
});

export default RestoreProjectDialog;
