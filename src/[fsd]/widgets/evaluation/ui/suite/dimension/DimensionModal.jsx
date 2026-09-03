import { memo, useCallback, useEffect, useState } from 'react';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { useCreateEvalDimensionMutation, useUpdateEvalDimensionMutation } from '../../../api';
import { parseEvalError } from '../../../lib/helpers';
import DimensionForm, {
  buildDimensionApiBody,
  getDefaultFormState,
  getValidationError,
  mapDimensionToForm,
} from './DimensionForm';

const DimensionModal = memo(props => {
  const { open, onClose, projectId, applicationId = null, dimension = null, onSaved } = props;

  const isEditMode = dimension != null;

  const [form, setForm] = useState(() =>
    isEditMode ? mapDimensionToForm(dimension) : getDefaultFormState(),
  );
  const [errorMessage, setErrorMessage] = useState('');

  const [createDimension, { isLoading: isCreating }] = useCreateEvalDimensionMutation();
  const [updateDimension, { isLoading: isUpdating }] = useUpdateEvalDimensionMutation();

  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (open) {
      setForm(isEditMode ? mapDimensionToForm(dimension) : getDefaultFormState());
      setErrorMessage('');
    }
  }, [open, isEditMode, dimension]);

  const validationError = getValidationError(form);

  const handleSave = useCallback(async () => {
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    setErrorMessage('');

    const body = buildDimensionApiBody(form, applicationId);

    try {
      if (isEditMode) {
        const result = await updateDimension({
          projectId,
          dimensionId: dimension.id,
          agentId: applicationId,
          body,
        }).unwrap();
        onSaved?.(result);
      } else {
        const result = await createDimension({ projectId, body }).unwrap();
        onSaved?.(result, form.evaluationTarget, form.evaluator);
      }
      onClose();
    } catch (error) {
      setErrorMessage(
        parseEvalError(error, isEditMode ? 'Failed to update dimension.' : 'Failed to create dimension.'),
      );
    }
  }, [
    validationError,
    form,
    isEditMode,
    applicationId,
    dimension,
    createDimension,
    updateDimension,
    projectId,
    onSaved,
    onClose,
  ]);

  const styles = dimensionModalStyles();

  const content = (
    <DimensionForm
      form={form}
      setForm={setForm}
      errorMessage={errorMessage}
      isEditMode={isEditMode}
    />
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
        data-testid="dimension-modal-save"
      >
        {isSaving ? 'Saving...' : 'Save'}
      </Button.BaseBtn>
    </>
  );

  return (
    <Modal.BaseModal
      open={open}
      title={isEditMode ? 'Edit Dimension' : 'New Dimension'}
      onClose={onClose}
      content={content}
      actions={actions}
      variant={ModalConstants.MODAL_VARIANT.complex}
      sx={styles.dialogPaper}
      dialogSx={styles.dialog}
      data-testid={isEditMode ? 'edit-dimension-modal' : 'create-dimension-modal'}
    />
  );
});

DimensionModal.displayName = 'DimensionModal';

/** @type {MuiSx} */
const dimensionModalStyles = () => ({
  dialogPaper: {
    width: '50rem',
  },
  dialog: {
    minHeight: '32rem',
  },
});

export default DimensionModal;
