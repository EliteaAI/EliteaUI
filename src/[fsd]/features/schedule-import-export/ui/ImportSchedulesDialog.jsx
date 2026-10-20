import { memo, useCallback, useRef, useState } from 'react';

import UploadFileOutlined from '@mui/icons-material/UploadFileOutlined';
import { Alert, Box, Typography } from '@mui/material';

import { useImportSchedulesMutation } from '@/[fsd]/entities/schedule';
import { Modal } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { buildErrorMessage } from '@/common/utils';

import ScheduleImportReport from './ScheduleImportReport';

const ImportSchedulesDialog = memo(({ open, onClose, projectId }) => {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [importSchedules, { isLoading }] = useImportSchedulesMutation();

  const handleClose = useCallback(() => {
    if (isLoading) return;
    onClose?.();
  }, [isLoading, onClose]);

  const handlePick = useCallback(() => inputRef.current?.click(), []);

  const handleFileChange = useCallback(event => {
    const input = event.target;
    setFile(input.files?.[0] ?? null);
    input.value = '';
    setError('');
    setReport(null);
  }, []);

  const handleUpload = useCallback(async () => {
    setError('');
    try {
      setReport(await importSchedules({ projectId, file }).unwrap());
    } catch (err) {
      setError(buildErrorMessage(err));
    }
  }, [importSchedules, projectId, file]);

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {!!error && <Alert severity="error">{error}</Alert>}
      {report ? (
        <ScheduleImportReport report={report} />
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            size="small"
            startIcon={<UploadFileOutlined />}
            onClick={handlePick}
            disabled={isLoading}
            data-testid="import-schedules-choose-file"
          >
            Choose a YAML file
          </BaseBtn>
          <Typography
            variant="bodySmall2"
            color="text.secondary"
            noWrap
          >
            {file ? file.name : 'No file selected'}
          </Typography>
          <input
            ref={inputRef}
            type="file"
            aria-label="Schedules YAML file"
            accept=".yaml,.yml"
            hidden
            onChange={handleFileChange}
          />
        </Box>
      )}
    </Box>
  );

  const actions = (
    <>
      <BaseBtn
        variant={BUTTON_VARIANTS.secondary}
        size="small"
        onClick={handleClose}
        disabled={isLoading}
        data-testid="import-schedules-cancel"
      >
        {report ? 'Close' : 'Cancel'}
      </BaseBtn>
      {!report && (
        <BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          size="small"
          onClick={handleUpload}
          disabled={!file || isLoading}
          data-testid="import-schedules-upload"
        >
          {isLoading ? 'Uploading...' : 'Upload'}
        </BaseBtn>
      )}
    </>
  );

  return (
    <Modal.BaseModal
      open={open}
      title="Import Schedules"
      onClose={handleClose}
      content={content}
      actions={actions}
      data-testid="import-schedules-dialog"
      closeButtonTestId="import-schedules-close-button"
    />
  );
});

ImportSchedulesDialog.displayName = 'ImportSchedulesDialog';

export default ImportSchedulesDialog;
