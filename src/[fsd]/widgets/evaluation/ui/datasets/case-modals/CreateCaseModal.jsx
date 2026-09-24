import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Collapse, Tooltip, Typography } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Checkbox, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import PlusIcon from '@/components/Icons/PlusIcon';
import StyledInputModal from '@/components/StyledInputModal';
import useToast from '@/hooks/useToast';

import { useAddEvalDatasetCaseMutation, useUpdateEvalDatasetCaseMutation } from '../../../api';
import { parseEvalError } from '../../../lib/helpers';
import CaseFullScreenButton from './CaseFullScreenButton';

const INPUT_TOOLTIP = 'The request or prompt that will be sent to the agent when this case is evaluated.';
const VARIABLES_TOOLTIP = 'Optional key-value inputs that can be referenced when this case is run.';
const EXPECTED_OUTPUT_TOOLTIP =
  "An optional reference response or expected outcome used to assess the agent's generated response.";

const variablesToRows = variables =>
  Object.entries(variables || {}).map(([key, value]) => ({
    id: crypto.randomUUID(),
    key,
    value: String(value ?? ''),
  }));

const rowsToVariables = rows =>
  rows.reduce((acc, { key, value }) => {
    const trimmedKey = key.trim();
    if (trimmedKey) acc[trimmedKey] = value;
    return acc;
  }, {});

const toFormState = datasetCase => ({
  input: datasetCase?.input ?? '',
  expected_output: datasetCase?.expected_output ?? '',
  hasExpectedOutput: datasetCase?.id ? !!datasetCase?.expected_output : true,
  variableRows: variablesToRows(datasetCase?.variables),
});

const CreateCaseModal = memo(props => {
  const { open, onClose, projectId, datasetId, datasetCase, readOnly = false } = props;

  const isEdit = !!datasetCase?.id;

  const [form, setForm] = useState(() => toFormState(datasetCase));
  const [initialForm, setInitialForm] = useState(() => toFormState(datasetCase));
  const [errorMessage, setErrorMessage] = useState('');
  const [variablesExpanded, setVariablesExpanded] = useState(true);
  const [expandedField, setExpandedField] = useState(null);

  const [addCase, { isLoading: isAdding }] = useAddEvalDatasetCaseMutation();
  const [updateCase, { isLoading: isUpdating }] = useUpdateEvalDatasetCaseMutation();
  const { toastSuccess, toastError } = useToast();

  const isSaving = isAdding || isUpdating;

  useEffect(() => {
    if (open) {
      const newFormState = toFormState(datasetCase);
      setForm(newFormState);
      setInitialForm(newFormState);
      setErrorMessage('');
      setVariablesExpanded(true);
      setExpandedField(null);
    }
  }, [open, datasetCase]);

  useEffect(() => {
    if (errorMessage) setErrorMessage('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const setField = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const setVariableRows = useCallback(rows => {
    setForm(prev => ({ ...prev, variableRows: rows }));
  }, []);

  const handleVariableField = useCallback(
    (index, field, value) => {
      const next = form.variableRows.map((row, i) => (i === index ? { ...row, [field]: value } : row));
      setVariableRows(next);
    },
    [form.variableRows, setVariableRows],
  );

  const handleAddVariable = useCallback(() => {
    setVariableRows([...form.variableRows, { id: crypto.randomUUID(), key: '', value: '' }]);
  }, [form.variableRows, setVariableRows]);

  const handleRemoveVariable = useCallback(
    index => {
      setVariableRows(form.variableRows.filter((_, i) => i !== index));
    },
    [form.variableRows, setVariableRows],
  );

  const handleToggleExpectedOutput = useCallback(event => {
    setForm(prev => ({
      ...prev,
      hasExpectedOutput: event.target.checked,
      expected_output: event.target.checked ? prev.expected_output : '',
    }));
  }, []);

  const handleToggleVariables = useCallback(() => {
    setVariablesExpanded(prev => !prev);
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
      expected_output: form.hasExpectedOutput && form.expected_output?.trim() ? form.expected_output : null,
    };

    try {
      if (isEdit) {
        await updateCase({ projectId, datasetId, caseId: datasetCase.id, body }).unwrap();
        toastSuccess('Case has been successfully updated.');
      } else {
        await addCase({ projectId, datasetId, body }).unwrap();
        toastSuccess('Case has been successfully created.');
      }
      onClose();
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to save case.'));
    }
  }, [
    form,
    duplicateKey,
    isEdit,
    updateCase,
    projectId,
    datasetId,
    datasetCase,
    addCase,
    onClose,
    toastSuccess,
    toastError,
  ]);

  const handleOpenExpanded = useCallback((fieldName, value, rowIndex, rowKey) => {
    setExpandedField({ fieldName, value, rowIndex, rowKey });
  }, []);

  const handleCloseExpanded = useCallback(() => {
    setExpandedField(null);
  }, []);

  const handleExpandedChange = useCallback(
    event => {
      if (!expandedField) return;
      const { fieldName } = expandedField;
      const newValue = event.target.value;
      if (fieldName === 'Input') {
        setField('input', newValue);
      } else if (fieldName === 'Expected Output') {
        setField('expected_output', newValue);
      } else if (fieldName === 'Variable') {
        handleVariableField(expandedField.rowIndex, 'value', newValue);
      }
    },
    [expandedField, setField, handleVariableField],
  );

  const isDirty = useMemo(() => {
    if (form.input !== initialForm.input) return true;
    if (form.expected_output !== initialForm.expected_output) return true;
    if (form.hasExpectedOutput !== initialForm.hasExpectedOutput) return true;
    if (form.variableRows.length !== initialForm.variableRows.length) return true;
    for (let i = 0; i < form.variableRows.length; i++) {
      if (form.variableRows[i].key !== initialForm.variableRows[i]?.key) return true;
      if (form.variableRows[i].value !== initialForm.variableRows[i]?.value) return true;
    }
    return false;
  }, [form, initialForm]);

  const isValid = !!form.input.trim();

  const isSaveDisabled = isSaving || !isValid || (isEdit && !isDirty);
  const readOnlyInputProps = readOnly ? { 'aria-readonly': true, readOnly: true, tabIndex: -1 } : undefined;

  const getExpandedFieldValue = useCallback(() => {
    if (!expandedField) return '';
    const { fieldName } = expandedField;
    if (fieldName === 'Input') return form.input;
    if (fieldName === 'Expected Output') return form.expected_output;
    if (fieldName === 'Variable') {
      return form.variableRows[expandedField.rowIndex]?.value ?? '';
    }
    return expandedField.value;
  }, [expandedField, form.input, form.expected_output, form.variableRows]);

  const styles = createCaseModalStyles();

  const content = (
    <Box sx={styles.content}>
      <Box sx={styles.fieldSection}>
        <Box sx={styles.labelRow}>
          <Typography sx={styles.label}>Input</Typography>
          {!readOnly && <InfoTooltip infoTooltip={INPUT_TOOLTIP} />}
          <Box sx={styles.expandButton}>
            <CaseFullScreenButton
              readOnly={readOnly}
              onClick={() => handleOpenExpanded('Input', form.input)}
              sx={styles.iconButton}
            />
          </Box>
        </Box>
        <Input.InputBase
          data-testid="create-case-input"
          fullWidth
          multiline
          minRows={5}
          variant="outlined"
          placeholder=""
          value={form.input}
          onChange={readOnly ? undefined : event => setField('input', event.target.value)}
          inputProps={readOnlyInputProps}
          showFullScreenAction={false}
          showCopyAction={false}
          showExpandAction={false}
          sx={[styles.textareaField, readOnly && styles.readOnlyField]}
        />
      </Box>

      <Box sx={styles.variablesSection}>
        <Box
          sx={styles.variablesHeader}
          onClick={handleToggleVariables}
        >
          <ArrowDownIcon style={variablesExpanded ? styles.chevron : styles.chevronCollapsed} />
          <Typography sx={styles.variablesLabel}>VARIABLES</Typography>
          {!readOnly && (
            <Box onClick={event => event.stopPropagation()}>
              <InfoTooltip infoTooltip={VARIABLES_TOOLTIP} />
            </Box>
          )}
        </Box>
        <Collapse in={variablesExpanded}>
          <Box sx={styles.variablesContent}>
            {form.variableRows.length === 0 ? (
              <Typography sx={styles.noVariablesText}>No variables added yet.</Typography>
            ) : (
              form.variableRows.map((row, index) => (
                <Box
                  key={row.id}
                  sx={styles.variableRow}
                >
                  <Box sx={styles.keyFieldWrapper}>
                    <Input.InputBase
                      fullWidth
                      variant="outlined"
                      placeholder="Key"
                      value={row.key}
                      onChange={
                        readOnly ? undefined : event => handleVariableField(index, 'key', event.target.value)
                      }
                      inputProps={readOnlyInputProps}
                      data-testid={`create-case-variable-key-${index}`}
                      showFullScreenAction={false}
                      showCopyAction={false}
                      showExpandAction={false}
                      sx={[styles.variableField, readOnly && styles.readOnlyField]}
                    />
                  </Box>
                  <Box sx={styles.valueFieldWrapper}>
                    <Input.InputBase
                      fullWidth
                      variant="outlined"
                      placeholder="Value"
                      value={row.value}
                      onChange={
                        readOnly
                          ? undefined
                          : event => handleVariableField(index, 'value', event.target.value)
                      }
                      inputProps={readOnlyInputProps}
                      data-testid={`create-case-variable-value-${index}`}
                      showFullScreenAction={false}
                      showCopyAction={false}
                      showExpandAction={false}
                      sx={[styles.variableField, readOnly && styles.readOnlyField]}
                    />
                    <CaseFullScreenButton
                      readOnly={readOnly}
                      onClick={() => handleOpenExpanded('Variable', row.value, index, row.key)}
                      sx={styles.valueExpandButton}
                    />
                  </Box>
                  {!readOnly && (
                    <Tooltip
                      title="Remove variable"
                      placement="top"
                    >
                      <Button.BaseBtn
                        variant={BUTTON_VARIANTS.tertiary}
                        onClick={() => handleRemoveVariable(index)}
                        data-testid={`create-case-variable-remove-${index}`}
                        sx={styles.deleteButton}
                      >
                        <DeleteIcon sx={styles.deleteIcon} />
                      </Button.BaseBtn>
                    </Tooltip>
                  )}
                </Box>
              ))
            )}
            {!readOnly && (
              <Button.BaseBtn
                color={BUTTON_COLORS.secondary}
                startIcon={<PlusIcon />}
                onClick={handleAddVariable}
                sx={styles.addVariableButton}
                data-testid="create-case-add-variable"
              >
                Variable
              </Button.BaseBtn>
            )}
          </Box>
        </Collapse>
      </Box>

      <Box sx={styles.expectedOutputSection}>
        <Box sx={styles.expectedOutputHeader}>
          <Checkbox.BaseCheckbox
            checked={form.hasExpectedOutput}
            onChange={readOnly ? undefined : handleToggleExpectedOutput}
            disabled={readOnly}
            sx={styles.checkbox}
            data-testid="create-case-expected-output-checkbox"
          />
          <Typography sx={styles.expectedOutputLabel}>Expected Output</Typography>
          {!readOnly && <InfoTooltip infoTooltip={EXPECTED_OUTPUT_TOOLTIP} />}
          <Box sx={styles.expandButton}>
            {form.hasExpectedOutput ? (
              <CaseFullScreenButton
                readOnly={readOnly}
                onClick={() => handleOpenExpanded('Expected Output', form.expected_output)}
                sx={styles.iconButton}
              />
            ) : (
              <Box sx={styles.expandIconPlaceholder} />
            )}
          </Box>
        </Box>
        {form.hasExpectedOutput && (
          <Input.InputBase
            data-testid="create-case-expected-output"
            fullWidth
            multiline
            minRows={5}
            variant="outlined"
            placeholder=""
            value={form.expected_output}
            onChange={readOnly ? undefined : event => setField('expected_output', event.target.value)}
            inputProps={readOnlyInputProps}
            showFullScreenAction={false}
            showCopyAction={false}
            showExpandAction={false}
            sx={[styles.textareaField, readOnly && styles.readOnlyField]}
          />
        )}
      </Box>

      {!readOnly && errorMessage && (
        <Typography
          data-testid="create-case-error"
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
        data-testid="create-case-cancel"
      >
        Cancel
      </Button.BaseBtn>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.primary}
        disabled={isSaveDisabled}
        onClick={handleSave}
        data-testid="create-case-save"
      >
        Save
      </Button.BaseBtn>
    </>
  );

  return (
    <>
      <Modal.BaseModal
        open={open}
        variant={ModalConstants.MODAL_VARIANT.complex}
        title={readOnly ? 'Case Details' : isEdit ? 'Edit Case' : 'Create Case'}
        onClose={onClose}
        content={content}
        actions={readOnly ? undefined : actions}
        sx={styles.dialogPaper}
        dialogSx={styles.dialogContent}
        data-testid={readOnly ? 'case-details-modal' : 'create-case-modal'}
      />
      {expandedField && (
        <StyledInputModal
          open={!!expandedField}
          title={
            expandedField.fieldName === 'Variable'
              ? `Variable: ${expandedField.rowKey || 'Value'}`
              : expandedField.fieldName
          }
          value={getExpandedFieldValue()}
          hasOnChangeCallback={!readOnly}
          onChange={readOnly ? undefined : handleExpandedChange}
          onClose={handleCloseExpanded}
          specifiedLanguage="text"
          disabled={readOnly}
        />
      )}
    </>
  );
});

CreateCaseModal.displayName = 'CreateCaseModal';

/** @type {MuiSx} */
const createCaseModalStyles = () => ({
  dialogPaper: {
    width: '50rem',
  },
  dialogContent: {
    minHeight: '32rem',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  fieldSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  textareaField: {
    '& .MuiOutlinedInput-input.MuiInputBase-inputMultiline': {
      maxHeight: '7.5rem',
      overflowY: 'auto',
    },
  },
  readOnlyField: ({ palette }) => ({
    pointerEvents: 'none',
    '& .MuiInputBase-input': {
      caretColor: 'transparent',
    },
    '& .MuiOutlinedInput-root:not(.Mui-error):hover .MuiOutlinedInput-notchedOutline, & .MuiOutlinedInput-root.Mui-focused:not(.Mui-error) .MuiOutlinedInput-notchedOutline':
      {
        borderColor: palette.border.lines,
      },
  }),
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  label: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    color: palette.text.primary,
  }),
  expandButton: {
    marginLeft: 'auto',
  },
  iconButton: ({ palette }) => ({
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
  }),
  expandIconPlaceholder: {
    width: '1.5rem',
    height: '1.5rem',
  },
  variablesSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  variablesHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    padding: '0.25rem 0',
  },
  chevron: {
    width: '1rem',
    height: '1rem',
    transition: 'transform 0.2s ease',
  },
  chevronCollapsed: {
    width: '1rem',
    height: '1rem',
    transition: 'transform 0.2s ease',
    transform: 'rotate(-90deg)',
  },
  variablesLabel: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    color: palette.text.primary,
  }),
  variablesContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '0.75rem',
    padding: '0 0 0 1.5rem',
  },
  noVariablesText: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: '1.5rem',
    color: palette.text.muted,
  }),
  variableRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  keyFieldWrapper: {
    flex: 1,
  },
  valueFieldWrapper: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  variableField: {
    '& .MuiOutlinedInput-root': {
      minHeight: '2.5rem',
    },
  },
  valueExpandButton: ({ palette }) => ({
    position: 'absolute',
    right: '0.25rem',
    top: '50%',
    transform: 'translateY(-50%)',
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
  }),
  deleteButton: ({ palette }) => ({
    padding: '0.25rem',
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
  }),
  deleteIcon: ({ palette }) => ({
    fontSize: '1rem',
    '& path': {
      fill: palette.icon.default,
    },
  }),
  addVariableButton: ({ palette }) => ({
    alignSelf: 'flex-start',
    padding: '0.375rem 0.75rem',
    borderRadius: '1.25rem',
    borderColor: palette.border.lines,
    color: palette.text.secondary,
    fontSize: '0.75rem',
    lineHeight: '1rem',
    fontWeight: 500,
    '& .MuiButton-startIcon svg': {
      width: '0.75rem',
      height: '0.75rem',
    },
    '& svg path': {
      fill: palette.icon.secondary,
    },
    '&:hover': {
      borderColor: palette.border.lines,
      backgroundColor: palette.background.surface.interactive.default,
    },
  }),
  expectedOutputSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  expectedOutputHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  checkbox: {
    padding: 0,
    marginRight: '0.25rem',
  },
  expectedOutputLabel: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    color: palette.text.primary,
  }),
  error: ({ palette }) => ({
    fontSize: '0.875rem',
    color: palette.error.main,
    whiteSpace: 'pre-wrap',
  }),
});

export default CreateCaseModal;
