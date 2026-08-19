import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import { CodeMirrorLinterHelpers } from '@/[fsd]/shared/lib/helpers';
import { Button, Checkbox, Field, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { SingleSelect } from '@/[fsd]/shared/ui/select';

import { useCreateEvalCodeValidationMutation, useUpdateEvalCodeValidationMutation } from '../../api';
import {
  DEFAULT_CODE_VALIDATION_FORM,
  EVAL_POLARITY,
  EVAL_RETURN_CONTRACT,
  EVIDENCE_SCOPE_OPTIONS,
  NEW_ITEM_EVIDENCE_SCOPE,
  POLARITY_OPTIONS,
  RETURN_CONTRACT_OPTIONS,
} from '../../lib/constants';
import { parseEvalError } from '../../lib/helpers';

const toFormState = codeValidation => {
  if (!codeValidation) {
    return { ...DEFAULT_CODE_VALIDATION_FORM, evidence_scope: { ...NEW_ITEM_EVIDENCE_SCOPE } };
  }
  return {
    evidence_scope: { ...NEW_ITEM_EVIDENCE_SCOPE },
    name: codeValidation.name ?? '',
    description: codeValidation.description ?? '',
    code: codeValidation.code ?? '',
    return_contract: codeValidation.return_contract ?? DEFAULT_CODE_VALIDATION_FORM.return_contract,
    scale_min: codeValidation.scale_min ?? '',
    scale_max: codeValidation.scale_max ?? '',
    polarity: codeValidation.polarity ?? DEFAULT_CODE_VALIDATION_FORM.polarity,
  };
};

const CodeValidationEditorDialog = memo(props => {
  const { open, onClose, projectId, codeValidation, onSaved } = props;

  const isEdit = !!codeValidation?.id;

  const [form, setForm] = useState(() => toFormState(codeValidation));
  const [errorMessage, setErrorMessage] = useState('');
  const [codeExtensions, setCodeExtensions] = useState([]);

  const [createCodeValidation, { isLoading: isCreating }] = useCreateEvalCodeValidationMutation();
  const [updateCodeValidation, { isLoading: isUpdating }] = useUpdateEvalCodeValidationMutation();

  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    let active = true;
    CodeMirrorLinterHelpers.getExtensionsByLang('python').then(({ extensionWithLinter }) => {
      if (active) setCodeExtensions(extensionWithLinter);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (open) {
      setForm(toFormState(codeValidation));
      setErrorMessage('');
    }
  }, [open, codeValidation]);

  const setField = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleEvidence = useCallback(key => {
    setForm(prev => ({
      ...prev,
      evidence_scope: { ...prev.evidence_scope, [key]: !prev.evidence_scope[key] },
    }));
  }, []);

  const validationError = useMemo(() => {
    if (!form.name.trim()) return 'Name is required.';
    if (!form.code.trim()) return 'Code body is required.';
    if (!isEdit && !Object.values(form.evidence_scope).some(Boolean)) {
      return 'Evidence scope must have at least one option selected.';
    }
    if (form.return_contract === EVAL_RETURN_CONTRACT.number) {
      const hasMin = form.scale_min !== '' && form.scale_min !== null;
      const hasMax = form.scale_max !== '' && form.scale_max !== null;
      if (hasMin && hasMax && Number(form.scale_min) >= Number(form.scale_max)) {
        return 'Scale min must be strictly less than scale max.';
      }
      if (!form.polarity) return 'Pick a polarity — inverse metrics must be "Lower is better".';
    }
    return '';
  }, [form, isEdit]);

  const handleSave = useCallback(async () => {
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    setErrorMessage('');

    const hasMin = form.scale_min !== '' && form.scale_min !== null;
    const hasMax = form.scale_max !== '' && form.scale_max !== null;
    const body = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      code: form.code,
      return_contract: form.return_contract,
      scale_min: hasMin ? Number(form.scale_min) : null,
      scale_max: hasMax ? Number(form.scale_max) : null,
      // A bool contract has no direction to state (pass is always the good outcome), so the
      // selector is hidden and the value is fixed rather than left unset.
      polarity:
        form.return_contract === EVAL_RETURN_CONTRACT.number ? form.polarity : EVAL_POLARITY.higher_better,
    };

    try {
      let result;
      if (isEdit) {
        result = await updateCodeValidation({
          projectId,
          codeValidationId: codeValidation.id,
          body,
        }).unwrap();
      } else {
        result = await createCodeValidation({ projectId, body }).unwrap();
      }
      onSaved?.(result, isEdit ? undefined : form.evidence_scope);
      onClose();
    } catch (error) {
      setErrorMessage(parseEvalError(error, 'Failed to save code validation.'));
    }
  }, [
    validationError,
    form,
    isEdit,
    updateCodeValidation,
    projectId,
    codeValidation,
    createCodeValidation,
    onSaved,
    onClose,
  ]);

  const styles = codeValidationEditorDialogStyles();

  const content = (
    <Box sx={styles.content}>
      <Input.InputBase
        data-testid="code-validation-name-input"
        fullWidth
        variant="standard"
        label="Name"
        value={form.name}
        onChange={event => setField('name', event.target.value)}
        inputProps={{ maxLength: 128 }}
      />
      <Input.InputBase
        data-testid="code-validation-description-input"
        fullWidth
        multiline
        minRows={2}
        variant="standard"
        label="Description"
        value={form.description}
        onChange={event => setField('description', event.target.value)}
      />

      <Box sx={styles.field}>
        <Typography variant="labelMedium">Validation code (Python)</Typography>
        <Box sx={styles.editorWrapper}>
          <Field.CodeMirrorEditor
            value={form.code}
            extensions={codeExtensions}
            notifyChange={value => setField('code', value)}
            autoHeight
            minHeight="12rem"
            maxHeight="24rem"
            contentTestId="code-validation-code-input"
          />
        </Box>
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          The code is checked by a safety pre-screen before it is stored. Dangerous imports, builtins, and
          dunder access are rejected.
        </Typography>
      </Box>

      {!isEdit && (
        <Box sx={styles.field}>
          <Typography variant="labelMedium">Evidence scope</Typography>
          <Box sx={styles.evidenceRow}>
            {EVIDENCE_SCOPE_OPTIONS.map(option => (
              <FormControlLabel
                key={option.key}
                control={
                  <Checkbox.BaseCheckbox
                    checked={!!form.evidence_scope[option.key]}
                    onChange={() => toggleEvidence(option.key)}
                    data-testid={`code-validation-evidence-${option.key}`}
                  />
                }
                label={option.label}
              />
            ))}
          </Box>
          <Typography
            variant="bodySmall"
            color="text.secondary"
          >
            Only the selected evidence is available to the script as variables (output, input, structure).
          </Typography>
        </Box>
      )}

      <SingleSelect
        label="Return contract"
        showBorder
        value={form.return_contract}
        options={RETURN_CONTRACT_OPTIONS}
        onValueChange={value => setField('return_contract', value)}
        data-testid="code-validation-return-contract-select"
      />

      {form.return_contract === EVAL_RETURN_CONTRACT.number && (
        <>
          <Box sx={styles.row}>
            <Input.InputBase
              data-testid="code-validation-scale-min-input"
              fullWidth
              type="number"
              variant="standard"
              label="Scale min"
              value={form.scale_min}
              onChange={event => setField('scale_min', event.target.value)}
            />
            <Input.InputBase
              data-testid="code-validation-scale-max-input"
              fullWidth
              type="number"
              variant="standard"
              label="Scale max"
              value={form.scale_max}
              onChange={event => setField('scale_max', event.target.value)}
            />
          </Box>

          <SingleSelect
            label="Polarity"
            showBorder
            value={form.polarity}
            options={POLARITY_OPTIONS}
            onValueChange={value => setField('polarity', value)}
            data-testid="code-validation-polarity-select"
          />
        </>
      )}

      {errorMessage && (
        <Typography
          data-testid="code-validation-editor-error"
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
        disabled={isSaving || !!validationError}
        onClick={handleSave}
        data-testid="code-validation-editor-save"
      >
        {isEdit ? 'Save' : 'Create'}
      </Button.BaseBtn>
    </>
  );

  return (
    <Modal.BaseModal
      open={open}
      title={isEdit ? 'Edit code validation' : 'New code validation'}
      onClose={onClose}
      content={content}
      actions={actions}
      data-testid="code-validation-editor-dialog"
    />
  );
});

CodeValidationEditorDialog.displayName = 'CodeValidationEditorDialog';

/** @type {MuiSx} */
const codeValidationEditorDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minWidth: '38rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  editorWrapper: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.25rem',
    overflow: 'hidden',
  }),
  row: {
    display: 'flex',
    gap: '1rem',
  },
  evidenceRow: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  error: ({ palette }) => ({
    color: palette.error.main,
    whiteSpace: 'pre-wrap',
  }),
});

export default CodeValidationEditorDialog;
