import { memo } from 'react';

import { GenerateEntityButton } from '@/[fsd]/entities/generate-entity-with-ai';
import { PERMISSIONS } from '@/common/constants';

import GenerateProjectContextModal from './GenerateProjectContextModal';

const GenerateProjectContextButton = memo(props => {
  const { existingContent, onApply } = props;

  return (
    <GenerateEntityButton
      permission={PERMISSIONS.projectContext.edit}
      renderModal={({ open, onClose }) => (
        <GenerateProjectContextModal
          open={open}
          onClose={onClose}
          existingContent={existingContent}
          onApply={onApply}
        />
      )}
    />
  );
});

GenerateProjectContextButton.displayName = 'GenerateProjectContextButton';

export default GenerateProjectContextButton;
