import { memo } from 'react';

import { EditEntityButton } from '@/[fsd]/entities/edit-entity-with-ai';
import { PERMISSIONS } from '@/common/constants';

import AIEditAgentModal from './AIEditAgentModal';

const AIEditAgentButton = memo(() => (
  <EditEntityButton
    permission={PERMISSIONS.applications.update}
    buttonTestId="edit-agent-with-ai-button"
    renderModal={({ open, onClose }) => (
      <AIEditAgentModal
        open={open}
        onClose={onClose}
      />
    )}
  />
));

AIEditAgentButton.displayName = 'AIEditAgentButton';

export default AIEditAgentButton;
