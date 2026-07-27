import { memo } from 'react';

import { GenerateEntityButton } from '@/[fsd]/entities/generate-entity-with-ai';
import { PERMISSIONS } from '@/common/constants';

import GenerateProjectContextModal from './GenerateProjectContextModal';

const GenerateProjectContextButton = memo(props => {
  const { onApply } = props;

  return (
    <GenerateEntityButton
      permission={PERMISSIONS.projectContext.edit}
      label="Build with AI"
      renderModal={({ open, onClose }) => (
        <GenerateProjectContextModal
          open={open}
          onClose={onClose}
          onApply={onApply}
        />
      )}
    />
  );
});

GenerateProjectContextButton.displayName = 'GenerateProjectContextButton';

export default GenerateProjectContextButton;
