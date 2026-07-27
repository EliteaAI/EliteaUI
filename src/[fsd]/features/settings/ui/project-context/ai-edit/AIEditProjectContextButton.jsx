import { memo } from 'react';

import { EditEntityButton } from '@/[fsd]/entities/edit-entity-with-ai';
import { PERMISSIONS } from '@/common/constants';

import AIEditProjectContextModal from './AIEditProjectContextModal';

const AIEditProjectContextButton = memo(props => {
  const { currentContent, onApplySave, disabled } = props;

  return (
    <EditEntityButton
      permission={PERMISSIONS.projectContext.edit}
      disabled={disabled}
      buttonTestId="ai-edit-project-context-open-button"
      renderModal={({ open, onClose }) => (
        <AIEditProjectContextModal
          open={open}
          onClose={onClose}
          currentContent={currentContent}
          onApplySave={onApplySave}
        />
      )}
    />
  );
});

AIEditProjectContextButton.displayName = 'AIEditProjectContextButton';

export default AIEditProjectContextButton;
