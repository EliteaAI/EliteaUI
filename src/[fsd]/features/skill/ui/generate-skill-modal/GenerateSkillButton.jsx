import { memo } from 'react';

import { GenerateEntityButton } from '@/[fsd]/entities/generate-entity-with-ai';
import { PERMISSIONS } from '@/common/constants';

import GenerateSkillModal from './GenerateSkillModal';

const GenerateSkillButton = memo(props => {
  const { onSkillCreated } = props;

  return (
    <GenerateEntityButton
      permission={PERMISSIONS.applications.update}
      buttonTestId="generate-skill-open-button"
      renderModal={({ open, onClose }) => (
        <GenerateSkillModal
          open={open}
          onClose={onClose}
          onSkillCreated={onSkillCreated}
        />
      )}
    />
  );
});

GenerateSkillButton.displayName = 'GenerateSkillButton';

export default GenerateSkillButton;
