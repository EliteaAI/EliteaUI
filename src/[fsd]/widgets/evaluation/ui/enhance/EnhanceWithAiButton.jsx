import { memo } from 'react';

import { EditEntityButton } from '@/[fsd]/entities/edit-entity-with-ai';
import { PERMISSIONS } from '@/common/constants';

import EnhanceWithAiDialog from './EnhanceWithAiDialog';

const EnhanceWithAiButton = memo(props => {
  const { applicationId, runId } = props;

  return (
    <EditEntityButton
      label="Enhance with AI"
      permission={PERMISSIONS.versions.update}
      buttonTestId="enhance-with-ai-button"
      renderModal={({ open, onClose }) => (
        <EnhanceWithAiDialog
          open={open}
          onClose={onClose}
          applicationId={applicationId}
          runId={runId}
        />
      )}
    />
  );
});

EnhanceWithAiButton.displayName = 'EnhanceWithAiButton';

export default EnhanceWithAiButton;
