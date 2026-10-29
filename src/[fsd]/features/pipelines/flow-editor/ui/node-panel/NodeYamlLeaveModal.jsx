import { memo } from 'react';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Modal } from '@/[fsd]/shared/ui';

// Asked when the node panel is left while its YAML can't be applied
const NodeYamlLeaveModal = memo(props => {
  const { open, onFix, onDiscard } = props;

  return (
    <Modal.BaseModal
      open={open}
      variant={ModalConstants.MODAL_VARIANT.simple}
      titleIcon={ModalConstants.MODAL_ICON_TYPE.warning}
      title="Invalid node YAML"
      content="The node YAML has errors, so it wasn't applied. Fix it, or discard your YAML changes to go back to the last valid version."
      onClose={onFix}
      onConfirm={onDiscard}
      cancelButtonText="Fix"
      confirmButtonText="Discard YAML changes"
      data-testid="pipeline-node-yaml-leave-dialog"
      cancelButtonTestId="pipeline-node-yaml-leave-fix"
      confirmButtonTestId="pipeline-node-yaml-leave-discard"
    />
  );
});

NodeYamlLeaveModal.displayName = 'NodeYamlLeaveModal';

export default NodeYamlLeaveModal;
