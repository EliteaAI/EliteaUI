import { memo } from 'react';

import { GenerateEntityButton } from '@/[fsd]/entities/generate-entity-with-ai';
import { PERMISSIONS } from '@/common/constants';

import GenerateAgentModal from './GenerateAgentModal';

const GenerateAgentButton = memo(props => {
  const { onAgentCreated } = props;

  return (
    <GenerateEntityButton
      permission={PERMISSIONS.applications.update}
      buttonTestId="generate-agent-open-button"
      renderModal={({ open, onClose }) => (
        <GenerateAgentModal
          open={open}
          onClose={onClose}
          onAgentCreated={onAgentCreated}
        />
      )}
    />
  );
});

GenerateAgentButton.displayName = 'GenerateAgentButton';

export default GenerateAgentButton;
