import { memo } from 'react';

import { EditEntityButton } from '@/[fsd]/entities/edit-entity-with-ai';
import { PERMISSIONS } from '@/common/constants';

import AIEditSkillModal from './AIEditSkillModal';

const AIEditSkillButton = memo(() => (
  <EditEntityButton
    permission={PERMISSIONS.skills.update}
    buttonTestId="edit-skill-with-ai-button"
    renderModal={({ open, onClose }) => (
      <AIEditSkillModal
        open={open}
        onClose={onClose}
      />
    )}
  />
));

AIEditSkillButton.displayName = 'AIEditSkillButton';

export default AIEditSkillButton;
