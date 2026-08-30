import { memo, useCallback } from 'react';

import { GenerateEntityModal } from '@/[fsd]/entities/generate-entity-with-ai';
import { useGenerateProjectContextDraftMutation } from '@/[fsd]/features/settings/api/generateProjectContextDraftApi';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import GenerateProjectContextReviewForm from './GenerateProjectContextReviewForm';

const GenerateProjectContextModal = memo(props => {
  const { open, onClose, onApply } = props;

  const projectId = useSelectedProjectId();

  const [generateDraft, { error: generateError, reset: resetGenerate }] =
    useGenerateProjectContextDraftMutation();

  const handleGenerate = useCallback(
    description => generateDraft({ projectId, user_description: description }),
    [generateDraft, projectId],
  );

  const handleApprove = useCallback(
    async draftData => {
      onApply(draftData);
    },
    [onApply],
  );

  const renderReview = useCallback(
    (draft, onChange, onValidationChange) => (
      <GenerateProjectContextReviewForm
        draft={draft}
        onChange={onChange}
        onValidationChange={onValidationChange}
      />
    ),
    [],
  );

  return (
    <GenerateEntityModal
      open={open}
      onClose={onClose}
      entityLabel="project context"
      placeholder="Describe your project: architecture, design decisions, workflows, terminology, constraints, coding standards, deployment process, or other important information."
      onGenerate={handleGenerate}
      generateError={generateError}
      resetGenerate={resetGenerate}
      renderReview={renderReview}
      onApprove={handleApprove}
      approveLabel="Apply"
      approvingLabel="Applying..."
    />
  );
});

GenerateProjectContextModal.displayName = 'GenerateProjectContextModal';

export default GenerateProjectContextModal;
