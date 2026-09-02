import { memo, useCallback, useEffect, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { SingleSelect } from '@/[fsd]/shared/ui/select';

import { useImportEvalDatasetMutation } from '../../../api';
import { DEFAULT_IMPORT_FORM, IMPORT_FORMAT_OPTIONS } from '../../../lib/constants';
import { parseEvalError } from '../../../lib/helpers';

const CSV_PLACEHOLDER = 'input,expected_output\nWhat is 2+2?,4';
const JSON_PLACEHOLDER = '[{"input": "What is 2+2?", "expected_output": "4"}]';

const DatasetImportDialog = memo(props => {
  const { open, onClose, projectId, datasetId } = props;

  const [form, setForm] = useState(() => ({ ...DEFAULT_IMPORT_FORM }));
  const [errorMessage, setErrorMessage] = useState('');
  const [report, setReport] = useState(null);

  const [importDataset, { isLoading: isImporting }] = useImportEvalDatasetMutation();

  useEffect(() => {
    if (open) {
      setForm({ ...DEFAULT_IMPORT_FORM });
      setErrorMessage('');
      setReport(null);
    }
  }, [open]);

  const setField = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleImport = useCallback(async () => {
    if (!form.content.trim()) {
      setErrorMessage('Paste some content to import.');
      return;
    }
    setErrorMessage('');
    try {
      const result = await importDataset({
        projectId,
        datasetId,
        body: { format: form.format, content: form.content },
      }).unwrap();
      setReport(result);
    } catch (error) {
      setErrorMessage(parseEvalError(error, 'Failed to import dataset.'));
    }
  }, [form, importDataset, projectId, datasetId]);

  const styles = datasetImportDialogStyles();

  const errors = report?.errors ?? [];

  const content = (
    <Box sx={styles.content}>
      <SingleSelect
        label="Format"
        showBorder
        value={form.format}
        options={IMPORT_FORMAT_OPTIONS}
        onValueChange={value => setField('format', value)}
        data-testid="dataset-import-format-select"
      />
      <Input.InputBase
        data-testid="dataset-import-content-input"
        fullWidth
        multiline
        minRows={8}
        variant="standard"
        label="Content"
        placeholder={form.format === 'json' ? JSON_PLACEHOLDER : CSV_PLACEHOLDER}
        value={form.content}
        onChange={event => setField('content', event.target.value)}
      />

      {report && (
        <Box
          sx={styles.report}
          data-testid="dataset-import-report"
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
                  data-testid={`dataset-import-error-${index}`}
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
          data-testid="dataset-import-error"
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
      data-testid="dataset-import-done"
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
        disabled={isImporting || !form.content.trim()}
        onClick={handleImport}
        data-testid="dataset-import-submit"
      >
        Import
      </Button.BaseBtn>
    </>
  );

  return (
    <Modal.BaseModal
      open={open}
      title="Import cases"
      onClose={onClose}
      content={content}
      actions={actions}
      data-testid="dataset-import-dialog"
    />
  );
});

DatasetImportDialog.displayName = 'DatasetImportDialog';

/** @type {MuiSx} */
const datasetImportDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minWidth: '34rem',
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

export default DatasetImportDialog;
