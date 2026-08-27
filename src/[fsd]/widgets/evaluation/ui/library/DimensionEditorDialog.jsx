import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import { CodeMirrorLinterHelpers } from '@/[fsd]/shared/lib/helpers';
import { Button, Checkbox, Field, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { SingleSelect } from '@/[fsd]/shared/ui/select';

import { useCreateEvalDimensionMutation, useUpdateEvalDimensionMutation } from '../../api';
import {
  DEFAULT_DIMENSION_FORM,
  DIMENSION_ENGINE_OPTIONS,
  DIMENSION_TIER_OPTIONS,
  EVAL_ENGINE,
  EVAL_TIER,
  EVIDENCE_SCOPE_OPTIONS,
  NEW_ITEM_EVIDENCE_SCOPE,
  POLARITY_OPTIONS,
  RETURN_CONTRACT_OPTIONS,
  SCALE_TYPE_OPTIONS,
  TARGET_OPERATOR_OPTIONS,
} from '../../lib/constants';
import { parseEvalError } from '../../lib/helpers';

const isCodeOnly = engines => engines?.length === 1 && engines[0] === EVAL_ENGINE.code;

const toFormState = dimension => {
  if (!dimension) {
    return {
      ...DEFAULT_DIMENSION_FORM,
      tier: EVAL_TIER.project,
      evidence_scope: { ...NEW_ITEM_EVIDENCE_SCOPE },
    };
  }
  return {
    name: dimension.name ?? '',
    description: dimension.description ?? '',
    tier: dimension.tier ?? EVAL_TIER.project,
    allowed_engines: dimension.allowed_engines?.length
      ? dimension.allowed_engines
      : DEFAULT_DIMENSION_FORM.allowed_engines,
    scale_type: dimension.scale_type ?? DEFAULT_DIMENSION_FORM.scale_type,
    scale_min: dimension.scale_min ?? DEFAULT_DIMENSION_FORM.scale_min,
    scale_max: dimension.scale_max ?? DEFAULT_DIMENSION_FORM.scale_max,
    polarity: dimension.polarity ?? DEFAULT_DIMENSION_FORM.polarity,
    default_weight: dimension.default_weight ?? DEFAULT_DIMENSION_FORM.default_weight,
    default_target: dimension.default_target ?? '',
    default_target_operator: dimension.default_target_operator ?? '',
    evidence_scope: { ...NEW_ITEM_EVIDENCE_SCOPE },
    code: dimension.code ?? '',
    return_contract: dimension.return_contract ?? DEFAULT_DIMENSION_FORM.return_contract,
  };
};

const DimensionEditorDialog = memo(props => {
  const { open, onClose, projectId, applicationId = null, dimension, onSaved } = props;

  const isEdit = !!dimension?.id;

  const [form, setForm] = useState(() => toFormState(dimension));
  const [errorMessage, setErrorMessage] = useState('');
  const [codeExtensions, setCodeExtensions] = useState([]);

  const [createDimension, { isLoading: isCreating }] = useCreateEvalDimensionMutation();
  const [updateDimension, { isLoading: isUpdating }] = useUpdateEvalDimensionMutation();

  const isSaving = isCreating || isUpdating;
  const isCode = isCodeOnly(form.allowed_engines);

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
      setForm(toFormState(dimension));
      setErrorMessage('');
    }
  }, [open, dimension]);

  const setField = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  // Code is mutually exclusive with ai/human (backend: allowed_engines == ['code'] cannot also
  // contain ai/human, §2.1). Picking Code replaces the set; picking ai/human while Code is
  // selected replaces it too, rather than adding to it.
  const toggleEngine = useCallback(engine => {
    setForm(prev => {
      if (engine === EVAL_ENGINE.code) {
        const next = isCodeOnly(prev.allowed_engines) ? [] : [EVAL_ENGINE.code];
        return { ...prev, allowed_engines: next };
      }
      const base = isCodeOnly(prev.allowed_engines) ? [] : prev.allowed_engines;
      const has = base.includes(engine);
      const next = has ? base.filter(e => e !== engine) : [...base, engine];
      return { ...prev, allowed_engines: next };
    });
  }, []);

  const toggleEvidence = useCallback(key => {
    setForm(prev => ({
      ...prev,
      evidence_scope: { ...prev.evidence_scope, [key]: !prev.evidence_scope[key] },
    }));
  }, []);

  const validationError = useMemo(() => {
    if (!form.name.trim()) return 'Name is required.';
    if (!form.allowed_engines.length) return 'Select at least one engine.';
    if (isCode && !form.code.trim()) return 'Validation code is required.';
    if (!form.polarity) return 'Pick a polarity — inverse metrics must be "Lower is better".';
    if (!isEdit && !Object.values(form.evidence_scope).some(Boolean)) {
      return 'Evidence scope must have at least one option selected.';
    }
    if (!isEdit && form.tier === EVAL_TIER.agent_adhoc && applicationId == null) {
      return '"This agent only" tier is unavailable without an agent context.';
    }
    const min = Number(form.scale_min);
    const max = Number(form.scale_max);
    if (Number.isNaN(min) || Number.isNaN(max)) return 'Scale bounds must be numbers.';
    if (min >= max) return 'Scale min must be strictly less than scale max.';
    const hasTarget = form.default_target !== '' && form.default_target !== null;
    const hasOperator = !!form.default_target_operator;
    if (hasTarget !== hasOperator) return 'Provide both a default target and an operator, or neither.';
    return '';
  }, [form, isCode, isEdit, applicationId]);

  const handleSave = useCallback(async () => {
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    setErrorMessage('');

    const hasTarget = form.default_target !== '' && form.default_target !== null;
    const body = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      allowed_engines: form.allowed_engines,
      scale_type: form.scale_type,
      scale_min: Number(form.scale_min),
      scale_max: Number(form.scale_max),
      polarity: form.polarity,
      default_weight: Number(form.default_weight),
      default_target: hasTarget ? Number(form.default_target) : null,
      default_target_operator: hasTarget ? form.default_target_operator : null,
      code: isCode ? form.code : null,
      return_contract: isCode ? form.return_contract : null,
      ...(!isEdit
        ? {
            tier: form.tier,
            agent_id: form.tier === EVAL_TIER.agent_adhoc ? applicationId : null,
          }
        : {}),
    };

    try {
      let result;
      if (isEdit) {
        result = await updateDimension({ projectId, dimensionId: dimension.id, body }).unwrap();
        onSaved?.(result);
      } else {
        result = await createDimension({ projectId, body }).unwrap();
        onSaved?.(result, form.evidence_scope);
      }
      onClose();
    } catch (error) {
      setErrorMessage(parseEvalError(error, 'Failed to save dimension.'));
    }
  }, [
    validationError,
    form,
    isCode,
    isEdit,
    updateDimension,
    projectId,
    applicationId,
    dimension,
    createDimension,
    onSaved,
    onClose,
  ]);

  const styles = dimensionEditorDialogStyles();

  const content = (
    <Box sx={styles.content}>
      <Input.InputBase
        data-testid="dimension-name-input"
        fullWidth
        variant="standard"
        label="Name"
        value={form.name}
        onChange={event => setField('name', event.target.value)}
        inputProps={{ maxLength: 128 }}
      />
      <Input.InputBase
        data-testid="dimension-rubric-input"
        fullWidth
        multiline
        minRows={isCode ? 2 : 4}
        variant="standard"
        label={isCode ? 'Description' : 'Rubric / description (used as the AI grading prompt)'}
        value={form.description}
        onChange={event => setField('description', event.target.value)}
      />

      {isEdit ? (
        <Input.InputBase
          data-testid="dimension-tier-readonly"
          fullWidth
          disabled
          variant="standard"
          label="Scope"
          value={DIMENSION_TIER_OPTIONS.find(option => option.value === form.tier)?.label ?? form.tier}
        />
      ) : (
        <SingleSelect
          label="Scope"
          showBorder
          value={form.tier}
          options={DIMENSION_TIER_OPTIONS}
          onValueChange={value => setField('tier', value)}
          data-testid="dimension-tier-select"
        />
      )}

      <Box sx={styles.field}>
        <Typography variant="labelMedium">Engines</Typography>
        <Box sx={styles.engineRow}>
          {DIMENSION_ENGINE_OPTIONS.map(option => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox.BaseCheckbox
                  checked={form.allowed_engines.includes(option.value)}
                  onChange={() => toggleEngine(option.value)}
                  data-testid={`dimension-engine-${option.value}`}
                />
              }
              label={option.label}
            />
          ))}
        </Box>
      </Box>

      {isCode && (
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
              contentTestId="dimension-code-input"
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
      )}

      {isCode && (
        <SingleSelect
          label="Return contract"
          showBorder
          value={form.return_contract}
          options={RETURN_CONTRACT_OPTIONS}
          onValueChange={value => setField('return_contract', value)}
          data-testid="dimension-return-contract-select"
        />
      )}

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
                    data-testid={`dimension-evidence-${option.key}`}
                  />
                }
                label={option.label}
              />
            ))}
          </Box>
        </Box>
      )}

      <SingleSelect
        label="Scale type"
        showBorder
        value={form.scale_type}
        options={SCALE_TYPE_OPTIONS}
        onValueChange={value => setField('scale_type', value)}
        data-testid="dimension-scale-type-select"
      />

      <Box sx={styles.row}>
        <Input.InputBase
          data-testid="dimension-scale-min-input"
          fullWidth
          type="number"
          variant="standard"
          label="Scale min"
          value={form.scale_min}
          onChange={event => setField('scale_min', event.target.value)}
        />
        <Input.InputBase
          data-testid="dimension-scale-max-input"
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
        data-testid="dimension-polarity-select"
      />

      <Input.InputBase
        data-testid="dimension-weight-input"
        fullWidth
        type="number"
        variant="standard"
        label="Default weight"
        value={form.default_weight}
        onChange={event => setField('default_weight', event.target.value)}
      />

      <Box sx={styles.row}>
        <SingleSelect
          label="Default target operator"
          showBorder
          displayEmpty
          value={form.default_target_operator}
          options={TARGET_OPERATOR_OPTIONS}
          onValueChange={value => setField('default_target_operator', value)}
          onClear={() => setField('default_target_operator', '')}
          data-testid="dimension-target-operator-select"
        />
        <Input.InputBase
          data-testid="dimension-target-input"
          fullWidth
          type="number"
          variant="standard"
          label="Default target"
          value={form.default_target}
          onChange={event => setField('default_target', event.target.value)}
        />
      </Box>

      {errorMessage && (
        <Typography
          data-testid="dimension-editor-error"
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
        data-testid="dimension-editor-save"
      >
        {isEdit ? 'Save' : 'Create'}
      </Button.BaseBtn>
    </>
  );

  return (
    <Modal.BaseModal
      open={open}
      title={isEdit ? 'Edit dimension' : 'New dimension'}
      onClose={onClose}
      content={content}
      actions={actions}
      data-testid="dimension-editor-dialog"
    />
  );
});

DimensionEditorDialog.displayName = 'DimensionEditorDialog';

/** @type {MuiSx} */
const dimensionEditorDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minWidth: '32rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  engineRow: {
    display: 'flex',
    gap: '1.5rem',
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

export default DimensionEditorDialog;
