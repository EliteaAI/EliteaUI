import { memo, useCallback, useEffect, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from '@/common/constants';

import { useCreateEvalSuiteMutation } from '../../api';
import { DEFAULT_SUITE_FORM } from '../../lib/constants';
import { parseEvalError } from '../../lib/helpers';

const CreateSuiteModal = memo(props => {
  const { open, onClose, projectId, applicationId, onCreated } = props;

  const [form, setForm] = useState(DEFAULT_SUITE_FORM);
  const [errorMessage, setErrorMessage] = useState('');

  const [createEvalSuite, { isLoading: isCreating }] = useCreateEvalSuiteMutation();

  useEffect(() => {
    if (open) {
      setForm(DEFAULT_SUITE_FORM);
      setErrorMessage('');
    }
  }, [open]);

  const setField = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleNameChange = useCallback(
    event => {
      setField('name', event.target.value);
    },
    [setField],
  );

  const handleDescriptionChange = useCallback(
    event => {
      setField('description', event.target.value);
    },
    [setField],
  );

  const handleCreate = useCallback(async () => {
    const name = form.name.trim();
    if (!name) {
      setErrorMessage('Name is required.');
      return;
    }
    setErrorMessage('');

    try {
      const created = await createEvalSuite({
        projectId,
        body: {
          application_id: applicationId,
          name,
          description: form.description?.trim() || null,
        },
      }).unwrap();
      onCreated?.(created);
      onClose?.();
    } catch (error) {
      setErrorMessage(parseEvalError(error, 'Failed to create the suite.'));
    }
  }, [form, createEvalSuite, projectId, applicationId, onCreated, onClose]);

  const styles = createSuiteModalStyles();

  const content = (
    <Box sx={styles.content}>
      <Input.InputBase
        data-testid="suite-name-input"
        autoComplete="off"
        autoFocus
        fullWidth
        variant="standard"
        label="Suite Name"
        required
        value={form.name}
        onChange={handleNameChange}
        inputProps={{ maxLength: MAX_NAME_LENGTH }}
      />
      <Input.InputBase
        data-testid="suite-description-input"
        autoComplete="off"
        fullWidth
        variant="standard"
        label="Description"
        multiline
        maxRows={6}
        value={form.description}
        onChange={handleDescriptionChange}
        inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
      />
      {errorMessage && (
        <Typography
          data-testid="suite-form-error"
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
        disabled={isCreating || !form.name.trim()}
        onClick={handleCreate}
        data-testid="suite-form-save"
      >
        Save
      </Button.BaseBtn>
    </>
  );

  return (
    <Modal.BaseModal
      open={open}
      title="Create Suite"
      onClose={onClose}
      content={content}
      actions={actions}
      data-testid="suite-form-dialog"
    />
  );
});

CreateSuiteModal.displayName = 'CreateSuiteModal';

/** @type {MuiSx} */
const createSuiteModalStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    minWidth: '28rem',
  },
  error: ({ palette }) => ({
    color: palette.error.main,
    whiteSpace: 'pre-wrap',
  }),
});

export default CreateSuiteModal;
