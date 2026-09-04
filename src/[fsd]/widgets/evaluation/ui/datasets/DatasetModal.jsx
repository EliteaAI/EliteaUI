import { memo, useCallback, useEffect, useState } from 'react';

import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material';

import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';

import { useCreateEvalDatasetMutation, useUpdateEvalDatasetMutation } from '../../api';
import { DEFAULT_DATASET_FORM } from '../../lib/constants';
import { isDatasetSharedIn, parseEvalError } from '../../lib/helpers';

const toFormState = dataset => {
  if (!dataset) return { ...DEFAULT_DATASET_FORM };
  return {
    name: dataset.name ?? '',
    description: dataset.description ?? '',
    isShared: !!dataset.is_shared,
  };
};

const DatasetModal = memo(props => {
  const { open, onClose, projectId, applicationId, dataset, onSaved } = props;

  const isEdit = !!dataset?.id;
  // A shared-in dataset (owned by another agent) is never reachable through the rename
  // action, but the checkbox is disabled here too as a second line of defense.
  const isSharedIn = isDatasetSharedIn(dataset, applicationId);

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

  const styles = datasetModalStyles();

  const content = (
    <Box sx={styles.content}>
      <Input.InputBase
        data-testid="dataset-name-input"
        autoFocus
        fullWidth
        variant="standard"
        label="Dataset Name"
        required
        value={form.name}
        onChange={event => setField('name', event.target.value)}
        inputProps={{ maxLength: 256 }}
      />
      <Input.InputBase
        data-testid="dataset-description-input"
        fullWidth
        variant="standard"
        label="Description"
        value={form.description}
        onChange={event => setField('description', event.target.value)}
      />
      <Box sx={styles.checkboxSection}>
        <FormControlLabel
          control={
            <Checkbox
              checked={form.isShared}
              disabled={isSharedIn}
              onChange={event => setField('isShared', event.target.checked)}
              data-testid="dataset-shared-checkbox"
            />
          }
          label={
            <Box sx={styles.checkboxLabelContent}>
              <Typography
                component="span"
                sx={styles.checkboxLabelText}
              >
                Available across the project
              </Typography>
              <InfoTooltip infoTooltip="Allow this dataset to be used by all agents in this project." />
            </Box>
          }
          sx={styles.checkboxLabel}
        />
      </Box>
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
      title={isEdit ? 'Edit Dataset' : 'Create Dataset'}
      onClose={onClose}
      content={content}
      actions={actions}
      data-testid="dataset-form-dialog"
    />
  );
});

DatasetModal.displayName = 'DatasetModal';

/** @type {MuiSx} */
const datasetModalStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    minWidth: '28rem',
  },
  checkboxSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  checkboxLabel: {
    marginLeft: '-0.25rem',
  },
  checkboxLabelContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  checkboxLabelText: {
    fontSize: '0.875rem',
  },
  error: ({ palette }) => ({
    color: palette.error.main,
    whiteSpace: 'pre-wrap',
  }),
});

export default DatasetModal;
