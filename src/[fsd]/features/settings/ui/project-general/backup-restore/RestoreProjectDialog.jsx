import { memo, useCallback, useRef, useState } from 'react';

import UploadFileOutlined from '@mui/icons-material/UploadFileOutlined';
import { Alert, Box, FormControlLabel, Typography } from '@mui/material';

import { useRestoreProjectBackupMutation } from '@/[fsd]/features/settings/api';
import { ProjectBackupHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { Checkbox, Modal } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

const { formatSize } = ProjectBackupHelpers;

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

  const [restoreProject, { isLoading }] = useRestoreProjectBackupMutation();

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

  const handleFileChange = useCallback(event => {
    setError('');
    setResult(null);
    setArtifact(null);
    setAllowMismatch(false);
    setDryRun(true);
    setFile(event.target.files?.[0] ?? null);
  }, []);

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
      }).unwrap();
      setResult(response);
      if (response?.artifact) setArtifact(response.artifact);
    } catch (err) {
      const message = err?.data?.error ?? err?.error ?? 'Restore failed.';
      const detail = err?.data?.detail;
      setError(detail ? `${message}: ${detail}` : message);
      // A project mismatch comes back as 409 with the artifact the backend read,
      // so the confirmation checkbox below can be offered
      if (err?.data?.artifact) setArtifact(err.data.artifact);
      if (err?.data?.result) setResult(err.data);
    }
  }, [restoreProject, projectId, file, truncate, dryRun, isMismatch, allowMismatch]);

  const handleTruncateChange = useCallback(event => setTruncate(event.target.checked), []);
  const handleDryRunChange = useCallback(event => setDryRun(event.target.checked), []);
  const handleAllowMismatchChange = useCallback(event => setAllowMismatch(event.target.checked), []);

  const summary = result?.result;

  const renderContent = () => (
    <Box sx={componentStyles.root}>
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        Restore a redacted backup into{' '}
        <Typography
          component="span"
          variant="labelSmall"
          color="inherit"
        >
          {projectName}
        </Typography>
        {'. Credentials and tokens are not part of a redacted backup, so they are not restored either. A '}
        {'backup taken from another project can be applied here once you confirm the mismatch.'}
      </Typography>

      {!!error && (
        <Alert
          severity="error"
          sx={componentStyles.alert('error')}
        >
          {error}
        </Alert>
      )}

      <Box sx={componentStyles.filePicker}>
        <BaseBtn
          variant={BUTTON_VARIANTS.secondary}
          size="small"
          startIcon={<UploadFileOutlined />}
          onClick={handlePick}
          disabled={isLoading}
          data-testid="project-restore-choose-file"
        >
          Choose backup file
        </BaseBtn>
        <Typography
          variant="bodySmall2"
          color="text.secondary"
          sx={componentStyles.fileName}
        >
          {file ? `${file.name} (${formatSize(file.size)})` : 'No file selected'}
        </Typography>
        <Box
          component="input"
          ref={inputRef}
          type="file"
          accept=".enc,.sql,text/plain,application/sql,application/octet-stream"
          sx={componentStyles.hiddenInput}
          onChange={handleFileChange}
        />
      </Box>

      {isMismatch && (
        <>
          <Alert
            severity="warning"
            sx={componentStyles.alert('warning')}
          >
            This backup was taken from project {artifact.project_id}, not{' '}
            {projectName ? `"${projectName}"` : 'this project'} (project {projectId}). Restoring it here puts
            that data into a different project than it came from.
          </Alert>
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
                Restore into this project anyway
              </Typography>
            }
          />
        </>
      )}

      <Box sx={componentStyles.options}>
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
              Preview only (nothing is saved)
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
              Replace existing data instead of merging
            </Typography>
          }
        />
      </Box>

      {truncate && (
        <Alert
          severity="warning"
          sx={componentStyles.alert('warning')}
        >
          Existing rows in the affected tables are deleted before the backup is applied, and{' '}
          <Box
            component="code"
            sx={componentStyles.inlineCode}
          >
            CASCADE
          </Box>{' '}
          removes rows referencing them. Without this option rows are merged and existing ones are kept.
        </Alert>
      )}

      {!!summary && (
        <Alert
          severity={result?.ok ? 'success' : 'warning'}
          sx={componentStyles.alert(result?.ok ? 'success' : 'warning')}
        >
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
            sx={componentStyles.summaryBody}
          >
            {summary.statements} statements, {summary.total_rows} rows into{' '}
            {summary.applied_tables?.length ?? 0} tables
            {summary.truncated_tables?.length ? ` · truncated ${summary.truncated_tables.length}` : ''}
            {summary.skipped_tables?.length ? ` · skipped ${summary.skipped_tables.join(', ')}` : ''}
          </Typography>
        </Alert>
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
        {result && !dryRun ? 'Close' : 'Cancel'}
      </BaseBtn>
      <BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        size="small"
        onClick={handleSubmit}
        disabled={isLoading || !file || (isMismatch && !allowMismatch)}
        data-testid="project-restore-submit"
      >
        {isLoading ? 'Restoring...' : dryRun ? 'Preview' : 'Restore'}
      </BaseBtn>
    </>
  );

  return (
    <Modal.BaseModal
      open={open}
      title="Restore Project"
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
const componentStyles = {
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
  fileName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  hiddenInput: {
    display: 'none',
  },
  inlineCode: {
    fontFamily: 'monospace',
    fontWeight: 600,
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
  },
  summaryBody: {
    marginTop: '0.25rem',
  },
  // MuiAlert only carries theme overrides for the "filled" variant (and those use raw,
  // non-palette colors), so the default "standard" Alerts we render here fall back to
  // MUI's stock palette and clash with the app background. Re-theme them with the same
  // background/border/icon/text tokens the toolkits "index result" banners already use.
  alert:
    severity =>
    ({ palette }) => ({
      borderRadius: '0.5rem',
      border: `0.0625rem solid ${palette.border.indexResult[severity] || palette.border.indexResult.info}`,
      backgroundColor: palette.background.indexResult[severity] || palette.background.indexResult.info,
      '& .MuiAlert-icon': {
        color: palette.icon.indexResult[severity] || palette.icon.indexResult.info,
      },
      '& .MuiAlert-message': {
        width: '100%',
        color: palette.text.indexResult[severity] || palette.text.indexResult.info,
      },
    }),
};

export default RestoreProjectDialog;
