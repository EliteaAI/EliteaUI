import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import FileCodeIcon from '@/components/Icons/FileCodeIcon';

import { useImportEvalDatasetMutation } from '../../api';
import { parseEvalError } from '../../lib/helpers';

const ACCEPTED_EXTENSIONS = '.csv,.json';

const detectFormat = fileName => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'json') return 'json';
  return 'csv';
};

const ImportCaseModal = memo(props => {
  const { open, onClose, projectId, datasetId } = props;

  const [file, setFile] = useState(null);
  const [isReading, setIsReading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [report, setReport] = useState(null);
  const fileInputRef = useRef(null);

  const [importDataset, { isLoading: isImporting }] = useImportEvalDatasetMutation();

  useEffect(() => {
    if (open) {
      setFile(null);
      setIsReading(false);
      setErrorMessage('');
      setReport(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [open]);

  const handleFileSelect = useCallback(event => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    const ext = selected.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'json') {
      setErrorMessage('Unsupported file type. Please select a .csv or .json file.');
      setFile(null);
      return;
    }

    setFile(selected);
    setErrorMessage('');
    setReport(null);
  }, []);

  const handleChooseFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImport = useCallback(async () => {
    if (!file) return;
    setIsReading(true);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = async e => {
      const content = e.target.result;
      const format = detectFormat(file.name);

      try {
        if (format === 'json') {
          JSON.parse(content);
        }
      } catch {
        setErrorMessage('Invalid JSON file. Please check the file content and try again.');
        setIsReading(false);
        return;
      }

      try {
        const result = await importDataset({
          projectId,
          datasetId,
          body: { format, content },
        }).unwrap();

        if (result.rejected > 0) {
          setReport(result);
        } else {
          onClose();
        }
      } catch (error) {
        setErrorMessage(parseEvalError(error, 'Failed to import cases.'));
      }
      setIsReading(false);
    };

    reader.onerror = () => {
      setErrorMessage('Failed to read file. Please try again.');
      setIsReading(false);
    };

    reader.readAsText(file);
  }, [file, importDataset, projectId, datasetId, onClose]);

  const styles = importCaseModalStyles();

  const errors = report?.errors ?? [];

  const content = (
    <Box sx={styles.content}>
      <Box sx={styles.dropZone}>
        <Box
          component="span"
          sx={styles.fileIcon}
        >
          <FileCodeIcon />
        </Box>
        <Typography
          variant="bodyMedium"
          sx={styles.dropZoneTitle}
        >
          {file ? file.name : 'Select a file to import'}
        </Typography>
        <Typography
          variant="bodySmall"
          sx={styles.dropZoneHint}
        >
          Supported formats: CSV, JSON
        </Typography>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.secondary}
          onClick={handleChooseFile}
          sx={styles.chooseFileBtn}
        >
          Choose file
        </Button.BaseBtn>
      </Box>

      {report && (
        <Box
          sx={styles.report}
          data-testid="import-case-report"
        >
          <Typography variant="labelMedium">
            Imported {report.accepted ?? 0} case{report.accepted === 1 ? '' : 's'}
            {report.rejected ? `, ${report.rejected} rejected` : ''}.
          </Typography>
          {errors.length > 0 && (
            <Box sx={styles.errorList}>
              {errors.map((err, index) => (
                <Typography
                  key={index}
                  variant="bodySmall"
                  sx={styles.errorItem}
                >
                  {typeof err === 'string'
                    ? err
                    : `Row ${err.row ?? index + 1}: ${err.message ?? err.error ?? JSON.stringify(err)}`}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      )}

      {errorMessage && (
        <Typography
          data-testid="import-case-error"
          variant="bodySmall"
          sx={styles.error}
        >
          {errorMessage}
        </Typography>
      )}
    </Box>
  );

  const actions = report ? (
    <Button.BaseBtn
      variant={BUTTON_VARIANTS.elitea}
      color={BUTTON_COLORS.primary}
      onClick={onClose}
      data-testid="import-case-done"
    >
      Done
    </Button.BaseBtn>
  ) : (
    <>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.secondary}
        onClick={onClose}
      >
        Cancel
      </Button.BaseBtn>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.primary}
        disabled={isImporting || isReading || !file}
        onClick={handleImport}
        data-testid="import-case-submit"
      >
        Import
      </Button.BaseBtn>
    </>
  );

  return (
    <>
      <Box
        component="input"
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleFileSelect}
        hidden
        data-testid="import-case-file-input"
      />
      <Modal.BaseModal
        open={open}
        title="Import Case"
        onClose={onClose}
        content={content}
        actions={actions}
        data-testid="import-case-modal"
      />
    </>
  );
});

ImportCaseModal.displayName = 'ImportCaseModal';

/** @type {MuiSx} */
const importCaseModalStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minWidth: '30rem',
  },
  dropZone: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '2rem',
    borderRadius: '0.5rem',
    border: `0.0625rem dashed ${palette.border.lines}`,
    backgroundColor: palette.background.secondary,
  }),
  fileIcon: ({ palette }) => ({
    display: 'inline-flex',
    '& svg': {
      width: '2rem',
      height: '2rem',
    },
    '& path': {
      fill: palette.text.secondary,
    },
  }),
  dropZoneTitle: ({ palette }) => ({
    color: palette.text.primary,
    fontWeight: 500,
  }),
  dropZoneHint: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  chooseFileBtn: {
    marginTop: '0.5rem',
  },
  report: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  errorList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    maxHeight: '12rem',
    overflowY: 'auto',
  },
  errorItem: ({ palette }) => ({
    color: palette.error.main,
  }),
  error: ({ palette }) => ({
    color: palette.error.main,
    whiteSpace: 'pre-wrap',
  }),
});

export default ImportCaseModal;
