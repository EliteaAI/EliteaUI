import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, FormControlLabel, Radio, RadioGroup, TextField, Typography } from '@mui/material';

import { CodeMirrorLinterHelpers } from '@/[fsd]/shared/lib/helpers';
import { Button, Checkbox, Field, Modal, Tooltip } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { SingleSelect } from '@/[fsd]/shared/ui/select';

import { useUpdateEvalBindingMutation, useUpdateEvalCodeValidationMutation } from '../api';
import {
  BINDING_ENGINE_OPTIONS,
  DEFAULT_EVIDENCE_SCOPE,
  EVAL_BINDING_KIND,
  EVAL_ENGINE,
  EVIDENCE_SCOPE_OPTIONS,
  TARGET_OPERATOR_OPTIONS,
} from '../lib/constants';
import { getBindingKind, getBindingLabel, parseEvalError } from '../lib/helpers';

const toFormState = binding => ({
  engine: binding?.engine ?? EVAL_ENGINE.ai,
  evidence_scope: { ...DEFAULT_EVIDENCE_SCOPE, ...(binding?.evidence_scope || {}) },
  weight: binding?.weight ?? 1,
  target: binding?.target ?? '',
  target_operator: binding?.target_operator ?? '',
});

const BindingDetailDialog = memo(props => {
  const { open, onClose, projectId, suiteId, binding, dimensions = [], codeValidations = [] } = props;

  const [form, setForm] = useState(() => toFormState(binding));
  const [code, setCode] = useState('');
  const [codeExtensions, setCodeExtensions] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const [updateBinding, { isLoading: isSavingBinding }] = useUpdateEvalBindingMutation();
  const [updateCodeValidation, { isLoading: isSavingCode }] = useUpdateEvalCodeValidationMutation();

  const isSaving = isSavingBinding || isSavingCode;

  const kind = getBindingKind(binding);
  const isDimension = kind === EVAL_BINDING_KIND.dimension;
  const isPlatform = kind === EVAL_BINDING_KIND.platform;
  const isCodeValidation = kind === EVAL_BINDING_KIND.codeValidation;
  const label = useMemo(
    () => getBindingLabel(binding, { dimensions, codeValidations }),
    [binding, dimensions, codeValidations],
  );
  const codeValidationDef = useMemo(
    () => codeValidations.find(c => c.id === binding?.code_validation_id) ?? null,
    [codeValidations, binding],
  );
  const dimensionDef = useMemo(
    () => (isDimension ? (dimensions.find(d => d.id === binding?.dimension_id) ?? null) : null),
    [isDimension, dimensions, binding],
  );
  const rubricDescription = dimensionDef?.description || codeValidationDef?.description || '';

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
      setForm(toFormState(binding));
      setCode(codeValidationDef?.code ?? '');
      setErrorMessage('');
    }
  }, [open, binding, codeValidationDef]);

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
    if (!Object.values(form.evidence_scope).some(Boolean)) {
      return 'Evidence scope must have at least one option selected.';
    }
    if (isCodeValidation) {
      if (!code.trim()) return 'Validation code is required.';
      return '';
    }
    const weight = Number(form.weight);
    if (Number.isNaN(weight) || weight < 0) return 'Weight must be a non-negative number.';
    const hasTarget = form.target !== '' && form.target !== null;
    const hasOperator = !!form.target_operator;
    if (hasTarget !== hasOperator) return 'Provide both a target and an operator, or neither.';
    return '';
  }, [form, isCodeValidation, code]);

  const handleApply = useCallback(async () => {
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    setErrorMessage('');

    const hasTarget = form.target !== '' && form.target !== null;
    const body = {
      evidence_scope: form.evidence_scope,
      weight: Number(form.weight),
      target: hasTarget ? Number(form.target) : null,
      target_operator: hasTarget ? form.target_operator : null,
    };
    if (isDimension) body.engine = form.engine;

    try {
      if (isCodeValidation && codeValidationDef && code !== codeValidationDef.code) {
        await updateCodeValidation({
          projectId,
          codeValidationId: codeValidationDef.id,
          body: {
            name: codeValidationDef.name,
            description: codeValidationDef.description ?? null,
            code,
            return_contract: codeValidationDef.return_contract,
            scale_min: codeValidationDef.scale_min ?? null,
            scale_max: codeValidationDef.scale_max ?? null,
            polarity: codeValidationDef.polarity,
          },
        }).unwrap();
      }
      await updateBinding({ projectId, suiteId, bindingId: binding.id, body }).unwrap();
      onClose();
    } catch (error) {
      setErrorMessage(parseEvalError(error, 'Failed to update binding.'));
    }
  }, [
    validationError,
    form,
    isDimension,
    isCodeValidation,
    codeValidationDef,
    code,
    updateCodeValidation,
    updateBinding,
    projectId,
    suiteId,
    binding,
    onClose,
  ]);

  const styles = bindingDetailDialogStyles();

  const content = (
    <Box sx={styles.content}>
      <Box sx={styles.field}>
        <Box sx={styles.labelRow}>
          <Typography variant="labelMedium">Validation</Typography>
          {rubricDescription && <Tooltip.InfoTooltip infoTooltip={rubricDescription} />}
        </Box>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
        >
          {label}
        </Typography>
      </Box>

      <Box sx={styles.field}>
        <Typography variant="labelMedium">Engine</Typography>
        {isDimension ? (
          <RadioGroup
            row
            value={form.engine}
            onChange={event => setField('engine', event.target.value)}
          >
            {BINDING_ENGINE_OPTIONS.map(option => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio data-testid={`binding-engine-${option.value}`} />}
                label={option.label}
              />
            ))}
          </RadioGroup>
        ) : (
          <Typography
            variant="bodyMedium"
            color="text.secondary"
          >
            {isPlatform ? 'Code (platform-defined)' : 'Code'}
          </Typography>
        )}
      </Box>

      {isCodeValidation && (
        <Box sx={styles.field}>
          <Typography variant="labelMedium">Validation code (Python)</Typography>
          <Box sx={styles.editorWrapper}>
            <Field.CodeMirrorEditor
              value={code}
              extensions={codeExtensions}
              notifyChange={setCode}
              autoHeight
              minHeight="12rem"
              maxHeight="24rem"
              contentTestId="binding-code-input"
            />
          </Box>
          <Typography
            variant="bodySmall"
            color="text.secondary"
          >
            Editing this code updates the shared code validation for every scorecard that uses it.
          </Typography>
        </Box>
      )}

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
                  data-testid={`binding-evidence-${option.key}`}
                />
              }
              label={option.label}
            />
          ))}
        </Box>
      </Box>

      {!isCodeValidation && (
        <>
          <TextField
            data-testid="binding-weight-input"
            fullWidth
            type="number"
            variant="standard"
            label="Weight"
            value={form.weight}
            onChange={event => setField('weight', event.target.value)}
          />

          <Box sx={styles.row}>
            <SingleSelect
              label="Target operator"
              showBorder
              displayEmpty
              value={form.target_operator}
              options={TARGET_OPERATOR_OPTIONS}
              onValueChange={value => setField('target_operator', value)}
              onClear={() => setField('target_operator', '')}
              data-testid="binding-target-operator-select"
            />
            <TextField
              data-testid="binding-target-input"
              fullWidth
              type="number"
              variant="standard"
              label="Target"
              value={form.target}
              onChange={event => setField('target', event.target.value)}
            />
          </Box>
        </>
      )}

      {errorMessage && (
        <Typography
          data-testid="binding-editor-error"
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
        onClick={handleApply}
        data-testid="binding-editor-apply"
      >
        Apply
      </Button.BaseBtn>
    </>
  );

  return (
    <Modal.BaseModal
      open={open}
      title="Edit validation"
      onClose={onClose}
      content={content}
      actions={actions}
      data-testid="binding-editor-dialog"
    />
  );
});

BindingDetailDialog.displayName = 'BindingDetailDialog';

/** @type {MuiSx} */
const bindingDetailDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minWidth: '30rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  editorWrapper: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.25rem',
    overflow: 'hidden',
  }),
  evidenceRow: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  row: {
    display: 'flex',
    gap: '1rem',
  },
  error: ({ palette }) => ({
    color: palette.error.main,
    whiteSpace: 'pre-wrap',
  }),
});

export default BindingDetailDialog;
