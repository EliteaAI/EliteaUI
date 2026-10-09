import { memo, useCallback, useEffect, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';

import { DIMENSION_BADGE_TOOLTIP, IMPORTANCE, IMPORTANCE_OPTIONS } from '../../../lib/constants';
import { importanceFormToWeight, weightToImportanceForm } from '../../../lib/helpers';

/**
 * Sets the weight a shared (project or platform) dimension carries in one suite. The dimension
 * itself is not editable from the suite, but its binding's weight is per-suite state.
 */
const BindingWeightDialog = memo(props => {
  const { open, binding, dimensionName, defaultWeight = null, saving = false, onClose, onSave } = props;

  const [form, setForm] = useState(() => weightToImportanceForm(binding?.weight ?? defaultWeight));

  useEffect(() => {
    if (open) setForm(weightToImportanceForm(binding?.weight ?? defaultWeight));
  }, [open, binding, defaultWeight]);

  const isCustom = form.importance === IMPORTANCE.custom;
  const weight = importanceFormToWeight(form.importance, form.customImportanceValue);
  const isInvalid = weight == null;

  const handleImportanceChange = useCallback(value => {
    setForm(prev => ({ ...prev, importance: value }));
  }, []);

  const handleCustomChange = useCallback(event => {
    setForm(prev => ({ ...prev, customImportanceValue: event.target.value }));
  }, []);

  const handleSave = useCallback(() => {
    if (!isInvalid) onSave?.(weight);
  }, [isInvalid, onSave, weight]);

  const styles = bindingWeightDialogStyles();

  const content = (
    <Box sx={styles.content}>
      <Typography
        variant="bodySmall"
        sx={styles.hint}
      >
        {`Applies to ${dimensionName ? `“${dimensionName}”` : 'this dimension'} in this suite only. ` +
          'The shared dimension and other suites keep their own weight.'}
      </Typography>
      <Box sx={styles.field}>
        <Box sx={styles.labelRow}>
          <Typography sx={styles.label}>Importance</Typography>
          <InfoTooltip infoTooltip={DIMENSION_BADGE_TOOLTIP.weight} />
        </Box>
        <SingleSelect
          showBorder
          value={form.importance}
          options={IMPORTANCE_OPTIONS}
          onValueChange={handleImportanceChange}
          data-testid="binding-weight-importance-select"
        />
      </Box>
      {isCustom && (
        <Box sx={styles.field}>
          <Typography sx={styles.label}>Importance Value</Typography>
          <Input.InputBase
            data-testid="binding-weight-custom-input"
            fullWidth
            type="number"
            variant="standard"
            value={form.customImportanceValue}
            onChange={handleCustomChange}
            error={isInvalid}
            inputProps={{ min: 0, step: 'any' }}
          />
          {isInvalid && (
            <Typography
              variant="bodySmall"
              sx={styles.error}
            >
              Enter a number of 0 or more.
            </Typography>
          )}
        </Box>
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
        disabled={saving || isInvalid}
        onClick={handleSave}
        data-testid="binding-weight-save"
      >
        Save
      </Button.BaseBtn>
    </>
  );

  return (
    <Modal.BaseModal
      open={open}
      title="Weight in this suite"
      onClose={onClose}
      content={content}
      actions={actions}
      data-testid="binding-weight-dialog"
    />
  );
});

BindingWeightDialog.displayName = 'BindingWeightDialog';

/** @type {MuiSx} */
const bindingWeightDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    minWidth: '28rem',
  },
  hint: ({ palette }) => ({
    color: palette.text.primary,
  }),
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  label: ({ palette }) => ({
    color: palette.text.primary,
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
  }),
  error: ({ palette }) => ({
    color: palette.error.main,
  }),
});

export default BindingWeightDialog;
