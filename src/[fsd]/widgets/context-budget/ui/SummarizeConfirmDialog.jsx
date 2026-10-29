import { memo } from 'react';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Modal } from '@/[fsd]/shared/ui';
import { CONTEXT_MESSAGES } from '@/[fsd]/widgets/context-budget/lib/constants';

/**
 * Confirmation dialog for manual summarization, shared by ContextBudgetPopover and ContextBudgetExpanded.
 */
const SummarizeConfirmDialog = memo(props => {
  const { open, onClose, onConfirm, confirming } = props;

  return (
    <Modal.BaseModal
      open={open}
      variant={ModalConstants.MODAL_VARIANT.simple}
      alarm
      title="Warning"
      content={CONTEXT_MESSAGES.SUMMARIZE_CONFIRM}
      onClose={onClose}
      onConfirm={onConfirm}
      confirming={confirming}
      data-testid="summarize-confirm-dialog"
    />
  );
});

SummarizeConfirmDialog.displayName = 'SummarizeConfirmDialog';

export default SummarizeConfirmDialog;
