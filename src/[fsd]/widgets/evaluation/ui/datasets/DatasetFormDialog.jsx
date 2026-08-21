import { memo, useCallback, useEffect, useState } from 'react';

import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material';

import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { useCreateEvalDatasetMutation, useUpdateEvalDatasetMutation } from '../../api';
import { DEFAULT_DATASET_FORM } from '../../lib/constants';
import { parseEvalError } from '../../lib/helpers';

const toFormState = dataset => {
  if (!dataset) return { ...DEFAULT_DATASET_FORM };
  return {
    name: dataset.name ?? '',
    description: dataset.description ?? '',
    isShared: !!dataset.is_shared,
  };
};

const DatasetFormDialog = memo(props => {
  const { open, onClose, projectId, applicationId, dataset, onSaved } = props;

  const isEdit = !!dataset?.id;

  const [form, setForm] = useState(() => toFormState(dataset));
  const [errorMessage, setErrorMessage] = useState('');

  const [createDataset, { isLoading: isCreating }] = useCreateEvalDatasetMutation();
  const [updateDataset, { isLoading: isUpdating }] = useUpdateEvalDatasetMutation();

  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (open) {
      setForm(toFormState(dataset));
      setErrorMessage('');
    }
  }, [open, dataset]);

  const setField = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    const name = form.name.trim();
    if (!name) {
      setErrorMessage('Name is required.');
      return;
    }
    setErrorMessage('');

    try {
      let result;
      if (isEdit) {
        const body = {
          name,
          description: form.description?.trim() || null,
          is_shared: form.isShared,
        };
        result = await updateDataset({ projectId, datasetId: dataset.id, body }).unwrap();
      } else {
        const body = {
          name,
          description: form.description?.trim() || null,
          agent_id: applicationId,
          is_shared: form.isShared,
        };
        result = await createDataset({ projectId, body }).unwrap();
      }
      onSaved?.(result);
      onClose();
    } catch (error) {
      setErrorMessage(parseEvalError(error, 'Failed to save dataset.'));
    }
  }, [form, isEdit, updateDataset, projectId, applicationId, dataset, createDataset, onSaved, onClose]);

  const styles = datasetFormDialogStyles();

  const content = (
    <Box sx={styles.content}>
      <Input.InputBase
        data-testid="dataset-name-input"
        autoFocus
        fullWidth
        variant="standard"
        label="Name"
        value={form.name}
        onChange={event => setField('name', event.target.value)}
        inputProps={{ maxLength: 256 }}
      />
      <Input.InputBase
        data-testid="dataset-description-input"
        fullWidth
        multiline
        minRows={3}
        variant="standard"
        label="Description (optional)"
        value={form.description}
        onChange={event => setField('description', event.target.value)}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={form.isShared}
            onChange={event => setField('isShared', event.target.checked)}
            data-testid="dataset-shared-checkbox"
          />
        }
        label="Project shared — selectable from any agent's suite config"
      />
      {errorMessage && (
        <Typography
          data-testid="dataset-form-error"
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
        disabled={isSaving || !form.name.trim()}
        onClick={handleSave}
        data-testid="dataset-form-save"
      >
        {isEdit ? 'Save' : 'Create'}
      </Button.BaseBtn>
    </>
  );

  return (
    <Modal.BaseModal
      open={open}
      title={isEdit ? 'Rename dataset' : 'New dataset'}
      onClose={onClose}
      content={content}
      actions={actions}
      data-testid="dataset-form-dialog"
    />
  );
});

DatasetFormDialog.displayName = 'DatasetFormDialog';

/** @type {MuiSx} */
const datasetFormDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minWidth: '28rem',
  },
  error: ({ palette }) => ({
    color: palette.error.main,
    whiteSpace: 'pre-wrap',
  }),
});

export default DatasetFormDialog;
