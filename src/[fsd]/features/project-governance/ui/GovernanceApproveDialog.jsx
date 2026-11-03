import { memo, useCallback, useState } from 'react';

import { Box, Typography } from '@mui/material';

import * as GovernanceHelpers from '@/[fsd]/features/project-governance/lib/helpers/projectGovernance.helpers';
import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

// The approval of a waiting item (C-1009, #7269), as in the Admin UI: an approval reference and the policy revision
// approved against, both required and recorded with the approval. The server refuses an admin whom the four-eyes rule
// excludes. `onSubmit(approval)` rejects with the refusal; a stale view (STALE_CODES) closes the dialog with
// `onDone('stale')`, because the list was read again. `children`: extra controls (the grant's "also grant to").
const GovernanceApproveDialog = memo(props => {
  const {
    open,
    title,
    description,
    onSubmit,
    onClose,
    onDone,
    children,
    testId = 'governance-approve',
  } = props;
  const styles = approveDialogStyles();
  const [approvalRef, setApprovalRef] = useState('');
  const [policyRevision, setPolicyRevision] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const valid =
    GovernanceHelpers.isValidReference(approvalRef) && GovernanceHelpers.isValidReference(policyRevision);

  const reset = useCallback(() => {
    setApprovalRef('');
    setPolicyRevision('');
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    reset();
    onClose();
  }, [isSubmitting, onClose, reset]);

  const handleConfirm = useCallback(async () => {
    if (!valid) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ approval_ref: approvalRef, policy_revision: policyRevision });
      reset();
      onDone('done');
    } catch (err) {
      const refusal = GovernanceHelpers.toGovernanceError(err, 'The approval failed.');
      if (GovernanceHelpers.STALE_CODES.includes(refusal.code)) {
        reset();
        onDone('stale');
      } else {
        setError(refusal);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [approvalRef, onDone, onSubmit, policyRevision, reset, valid]);

  return (
    <Modal.BaseModal
      open={open}
      title={title}
      onClose={handleClose}
      data-testid={`${testId}-dialog`}
      actions={
        <>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.secondary}
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button.BaseBtn>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.primary}
            onClick={handleConfirm}
            disabled={isSubmitting || !valid}
            data-testid={`${testId}-submit`}
          >
            Approve
          </Button.BaseBtn>
        </>
      }
      content={
        <Box sx={styles.content}>
          {description && <Typography variant="bodyMedium">{description}</Typography>}
          {error && (
            <Typography
              variant="bodySmall"
              color="error"
              data-testid={`${testId}-error`}
            >
              {error.message}
              {error.code ? ` (${error.code})` : ''}
            </Typography>
          )}
          <Input.InputBase
            label="Approval reference"
            value={approvalRef}
            onChange={event => setApprovalRef(event.target.value)}
            enableAutoBlur={false}
            required
            autoFocus
            error={approvalRef !== '' && !GovernanceHelpers.isValidReference(approvalRef)}
            helperText={`A ticket or change number that records the approval. ${GovernanceHelpers.REFERENCE_HELP}`}
            inputProps={{ 'data-testid': `${testId}-ref` }}
          />
          <Input.InputBase
            label="Policy revision"
            value={policyRevision}
            onChange={event => setPolicyRevision(event.target.value)}
            enableAutoBlur={false}
            required
            error={policyRevision !== '' && !GovernanceHelpers.isValidReference(policyRevision)}
            helperText={`The rules you approved against. ${GovernanceHelpers.REFERENCE_HELP}`}
            inputProps={{ 'data-testid': `${testId}-policy` }}
          />
          {children}
        </Box>
      }
    />
  );
});

GovernanceApproveDialog.displayName = 'GovernanceApproveDialog';

/** @type {MuiSx} */
const approveDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingTop: '0.25rem',
    minWidth: '26rem',
  },
});

export default GovernanceApproveDialog;
