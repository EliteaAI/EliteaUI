import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { useAddEvalDatasetCaseMutation, useUpdateEvalDatasetCaseMutation } from '../../api';
import { caseSourceLabel, parseEvalError } from '../../lib/helpers';
import CaseVariablesEditor from './CaseVariablesEditor';

const variablesToRows = variables =>
  Object.entries(variables || {}).map(([key, value]) => ({ key, value: String(value ?? '') }));

const rowsToVariables = rows =>
  rows.reduce((acc, { key, value }) => {
    const trimmedKey = key.trim();
    if (trimmedKey) acc[trimmedKey] = value;
    return acc;
  }, {});

const toFormState = datasetCase => ({
  input: datasetCase?.input ?? '',
  expected_output: datasetCase?.expected_output ?? '',
  variableRows: variablesToRows(datasetCase?.variables),
});

const CaseEditorDialog = memo(props => {
  const { open, onClose, projectId, datasetId, datasetCase } = props;

  const isEdit = !!datasetCase?.id;

  const [form, setForm] = useState(() => toFormState(datasetCase));
  const [errorMessage, setErrorMessage] = useState('');

  const [addCase, { isLoading: isAdding }] = useAddEvalDatasetCaseMutation();
  const [updateCase, { isLoading: isUpdating }] = useUpdateEvalDatasetCaseMutation();

  const isSaving = isAdding || isUpdating;

  useEffect(() => {
    if (open) {
      setForm(toFormState(datasetCase));
      setErrorMessage('');
    }
  }, [open, datasetCase]);

  const setField = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const setVariableRows = useCallback(rows => {
    setForm(prev => ({ ...prev, variableRows: rows }));
  }, []);

  const duplicateKey = useMemo(() => {
    const seen = new Set();
    for (const { key } of form.variableRows) {
      const trimmed = key.trim();
      if (!trimmed) continue;
      if (seen.has(trimmed)) return trimmed;
      seen.add(trimmed);
    }
    return null;
  }, [form.variableRows]);

  const handleSave = useCallback(async () => {
    if (!form.input.trim()) {
      setErrorMessage('Input is required.');
      return;
    }
    if (duplicateKey) {
      setErrorMessage(`Duplicate variable key: ${duplicateKey}`);
      return;
    }
    setErrorMessage('');

    const body = {
      input: form.input,
      variables: rowsToVariables(form.variableRows),
      expected_output: form.expected_output?.trim() ? form.expected_output : null,
    };

    try {
      if (isEdit) {
        await updateCase({ projectId, datasetId, caseId: datasetCase.id, body }).unwrap();
      } else {
        await addCase({ projectId, datasetId, body }).unwrap();
      }
      onClose();
    } catch (error) {
      setErrorMessage(parseEvalError(error, 'Failed to save case.'));
    }
  }, [form, duplicateKey, isEdit, updateCase, projectId, datasetId, datasetCase, addCase, onClose]);

  const styles = caseEditorDialogStyles();

  const content = (
    <Box sx={styles.content}>
      <Input.InputBase
        data-testid="case-input-input"
        autoFocus
        fullWidth
        multiline
        minRows={3}
        variant="standard"
        label="Input"
        value={form.input}
        onChange={event => setField('input', event.target.value)}
      />

      <CaseVariablesEditor
        rows={form.variableRows}
        onChange={setVariableRows}
      />

      <Input.InputBase
        data-testid="case-expected-input"
        fullWidth
        multiline
        minRows={3}
        variant="standard"
        label="Expected output (optional)"
        value={form.expected_output}
        onChange={event => setField('expected_output', event.target.value)}
      />

      {isEdit && datasetCase?.source_type && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
          data-testid="case-source-label"
        >
          Source: {caseSourceLabel(datasetCase.source_type)}
        </Typography>
      )}

      {errorMessage && (
        <Typography
          data-testid="case-editor-error"
          variant="bodySmall"
          sx={styles.error}
        >
          {errorMessage}
        </Typography>
      )}
    </Box>
  );

  const actions = (
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
        disabled={isSaving || !form.input.trim()}
        onClick={handleSave}
        data-testid="case-editor-save"
      >
        {isEdit ? 'Save' : 'Add case'}
      </Button.BaseBtn>
    </>
  );

  return (
    <Modal.BaseModal
      open={open}
      title={isEdit ? 'Edit case' : 'Add case'}
      onClose={onClose}
      content={content}
      actions={actions}
      data-testid="case-editor-dialog"
    />
  );
});

CaseEditorDialog.displayName = 'CaseEditorDialog';

/** @type {MuiSx} */
const caseEditorDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minWidth: '32rem',
  },
  error: ({ palette }) => ({
    color: palette.error.main,
    whiteSpace: 'pre-wrap',
  }),
});

export default CaseEditorDialog;
