import { memo } from 'react';

import { EditEntityButton } from '@/[fsd]/entities/edit-entity-with-ai';
import { PERMISSIONS } from '@/common/constants';

import AIEditPipelineModal from './AIEditPipelineModal';

const AIEditPipelineButton = memo(props => {
  const { label, isCreateMode = false } = props;
  return (
    <EditEntityButton
      permission={PERMISSIONS.applications.update}
      buttonTestId="edit-pipeline-with-ai-button"
      label={label}
      renderModal={({ open, onClose }) => (
        <AIEditPipelineModal
          open={open}
          onClose={onClose}
          isCreateMode={isCreateMode}
        />
      )}
    />
  );
});

AIEditPipelineButton.displayName = 'AIEditPipelineButton';

export default AIEditPipelineButton;
