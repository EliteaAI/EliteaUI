import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch } from 'react-redux';

import CheckOutlined from '@mui/icons-material/CheckOutlined';
import UploadFileOutlined from '@mui/icons-material/UploadFileOutlined';
import { Box, FormControlLabel, Tooltip, Typography } from '@mui/material';

import {
  useInvalidateAfterRestoreMutation,
  useRestoreProjectBackupMutation,
  useRestoreProjectJobQuery,
} from '@/[fsd]/features/settings/api';
import { ProjectBackupConstants } from '@/[fsd]/features/settings/lib/constants';
import { ProjectBackupHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { Checkbox, Modal } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { TypographyWithConditionalTooltip } from '@/[fsd]/shared/ui/tooltip';
import { actions as chatActions } from '@/slices/chat';

import BackupAlert from './BackupAlert';

const {
  formatCount,
  formatSize,
  getRestoreErrorMessage,
  getDefaultRestoreChats,
  getChatsSummaryText,
  getSkillFilesSummaryText,
  getRestoreWarningText,
  isRestoreJobFinished,
  getRestoreJobError,
  saveRestoreJob,
  loadRestoreJob,
  clearRestoreJob,
} = ProjectBackupHelpers;
const {
  CHATS_OPTION,
  CHAT_RESTORE_OPTION_LABELS,
  RESTORE_OPTION_LABELS,
  RESTORE_JOB_POLL_MS,
  RESTORE_JOB_STATUS,
} = ProjectBackupConstants;

const NO_FILES_TOOLTIP = 'This backup has no attachment files';
const STOP_POLLING_STATUSES = [401, 403, 404];

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
  // The restore runs on the server after the upload; the dialog follows its job
  const [job, setJob] = useState(null);

  const [restoreProject, { isLoading: isStarting }] = useRestoreProjectBackupMutation();
  const [invalidateAfterRestore] = useInvalidateAfterRestoreMutation();
  // Polled while the dialog is closed too, as long as the settings page stays open;
  // after leaving it the job is picked up again from sessionStorage on return
  const { data: jobState, error: jobError } = useRestoreProjectJobQuery(
    { projectId, jobId: job?.jobId },
    { skip: !job?.jobId, pollingInterval: RESTORE_JOB_POLL_MS },
  );
  const { toastWarning } = useToast();
  const dispatch = useDispatch();
  const isRestoring = isStarting || !!job;
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

  // A restore started before the page was reloaded is followed again
  useEffect(() => {
    if (job) return;
    const saved = loadRestoreJob(projectId);
    if (saved?.jobId) setJob(saved);
  }, [job, projectId]);

  const handleFinished = useCallback(
    (finished, started) => {
      setJob(null);
      clearRestoreJob(projectId);
      if (finished.status === RESTORE_JOB_STATUS.failed) {
        setError(getRestoreErrorMessage(getRestoreJobError(finished)));
        if (finished.artifact) setArtifact(finished.artifact);
        if (finished.result) setResult(finished);
        return;
      }
      const response = finished.result;
      setResult(response);
      if (response?.artifact) setArtifact(response.artifact);
      const summary = response?.result;
      invalidateAfterRestore({
        projectId,
        dryRun: summary?.dry_run,
        restoreChats: started?.restoreChats,
      });
      // Replacing the chats deletes the one the chat page would reopen
      if (started?.truncate && summary?.chats && !summary.dry_run) {
        dispatch(chatActions.resetLastSelectedConversationId({ projectId }));
      }
      const warning = getRestoreWarningText(summary);
      if (warning) toastWarning(warning);
    },
    [projectId, invalidateAfterRestore, dispatch, toastWarning],
  );

  useEffect(() => {
    if (job && jobState?.job_id === job.jobId && isRestoreJobFinished(jobState)) {
      handleFinished(jobState, job);
    }
  }, [job, jobState, handleFinished]);

  // A job that can not be read any more (expired, no access) is not followed forever;
  // other errors (gateway, timeout, network) are transient and polling goes on
  useEffect(() => {
    if (!job || !STOP_POLLING_STATUSES.includes(jobError?.status)) return;
    setJob(null);
    clearRestoreJob(projectId);
    setError(
      jobError.status === 404
        ? 'The status of the last restore is no longer available.'
        : getRestoreErrorMessage(jobError),
    );
  }, [job, jobError, projectId]);

  // Closing does not stop a running restore: it is picked up again on reopen
  const handleClose = useCallback(() => {
    if (isInspecting || isStarting) return;
    if (!job) reset();
    onClose?.();
  }, [isInspecting, isStarting, job, reset, onClose]);

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

    const chats = hasChats ? restoreChats : undefined;
    try {
      const response = await restoreProject({
        projectId,
        file,
        truncate,
        dryRun,
        allowProjectMismatch: isMismatch && allowMismatch,
        restoreChats: chats,
      }).unwrap();
      if (response?.artifact) setArtifact(response.artifact);
      const started = { jobId: response?.job_id, truncate, restoreChats: chats };
      // A backend without restore jobs answers with the synchronous result
      if (!started.jobId) {
        handleFinished({ status: RESTORE_JOB_STATUS.done, result: response }, started);
        return;
      }
      saveRestoreJob(projectId, started);
      setJob(started);
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
    handleFinished,
  ]);

  const handleTruncateChange = useCallback(event => setTruncate(event.target.checked), []);
  const handleDryRunChange = useCallback(event => setDryRun(event.target.checked), []);
  const handleAllowMismatchChange = useCallback(event => setAllowMismatch(event.target.checked), []);

  const summary = result?.result;
  const chatsSummary = getChatsSummaryText(summary);
  const skillFilesSummary = getSkillFilesSummaryText(summary);

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
        {file ? (
          <Box sx={styles.fileInfo}>
            <TypographyWithConditionalTooltip
              title={file.name}
              placement="top"
              variant="bodySmall2"
              color="text.secondary"
              sx={styles.fileName}
              data-testid="project-restore-file-name"
            >
              {file.name}
            </TypographyWithConditionalTooltip>
            <Typography
              variant="bodySmall2"
              color="text.secondary"
              sx={styles.fileSize}
            >
              ({formatSize(file.size)})
            </Typography>
          </Box>
        ) : (
          <Typography
            variant="bodySmall2"
            color="text.secondary"
          >
            No files selected
          </Typography>
        )}
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

      {isMismatch && !truncate && (
        <BackupAlert
          severity="warning"
          data-testid="project-restore-merge-warning"
        >
          Merging a backup of another project can attach its agent and skill versions to this project&apos;s
          own. Restore it into a new project, or check &quot;{RESTORE_OPTION_LABELS.truncate}&quot;.
        </BackupAlert>
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
          {!!skillFilesSummary && (
            <Typography
              variant="bodySmall2"
              color="inherit"
              sx={styles.summaryBody}
              data-testid="project-restore-skill-files-summary"
            >
              {skillFilesSummary}
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
        disabled={isInspecting || isStarting}
        data-testid="project-restore-cancel"
      >
        {isRestoreCompleted || job ? 'Close' : 'Cancel'}
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
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    minWidth: 0,
  },
  fileName: {
    minWidth: 0,
  },
  fileSize: {
    flexShrink: 0,
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
    overflowWrap: 'anywhere',
  },
});

export default RestoreProjectDialog;
