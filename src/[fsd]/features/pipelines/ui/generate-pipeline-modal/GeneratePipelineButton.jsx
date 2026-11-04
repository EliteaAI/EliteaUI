import { memo } from 'react';

import { GenerateEntityButton } from '@/[fsd]/entities/generate-entity-with-ai';
import { PERMISSIONS } from '@/common/constants';

import GeneratePipelineModal from './GeneratePipelineModal';

const GeneratePipelineButton = memo(props => {
  const { onPipelineCreated } = props;

  return (
    <GenerateEntityButton
      permission={PERMISSIONS.applications.update}
      buttonTestId="generate-pipeline-open-button"
      renderModal={({ open, onClose }) => (
        <GeneratePipelineModal
          open={open}
          onClose={onClose}
          onPipelineCreated={onPipelineCreated}
        />
      )}
    />
  );
});

GeneratePipelineButton.displayName = 'GeneratePipelineButton';

export default GeneratePipelineButton;
