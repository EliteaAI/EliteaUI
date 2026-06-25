import { memo, useCallback, useState } from 'react';

import { GenerateEntityModal } from '@/[fsd]/entities/generate-entity-with-ai';
import { useGenerateProjectContextDraftMutation } from '@/[fsd]/features/settings/api/generateProjectContextDraftApi';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import GenerateProjectContextReviewForm, { APPLY_MODE } from './GenerateProjectContextReviewForm';

const GenerateProjectContextModal = memo(props => {
  const { open, onClose, existingContent, onApply } = props;

  const projectId = useSelectedProjectId();

  const [generateDraft, { error: generateError, reset: resetGenerate }] = useGenerateProjectContextDraftMutation();
  const [applyMode, setApplyMode] = useState(APPLY_MODE.REPLACE);

  const hasExistingContent = Boolean(existingContent?.trim());
  const existingContentLength = existingContent?.trimEnd().length ?? 0;

  const handleGenerate = useCallback(
    description => generateDraft({ projectId, user_description: description }),
    [generateDraft, projectId],
  );

  const handleClose = useCallback(() => {
    setApplyMode(APPLY_MODE.REPLACE);
    onClose();
  }, [onClose]);

  const handleApprove = useCallback(
    async draftData => {
      const generated = draftData.project_background || '';

      if (hasExistingContent && applyMode === APPLY_MODE.APPEND) {
        onApply(existingContent.trimEnd() + '\n\n' + generated);
      } else {
        onApply(generated);
      }

      setApplyMode(APPLY_MODE.REPLACE);
    },
    [hasExistingContent, applyMode, existingContent, onApply],
  );

  const renderReview = useCallback(
    (draft, onChange, onValidationChange) => (
      <GenerateProjectContextReviewForm
        draft={draft}
        onChange={onChange}
        onValidationChange={onValidationChange}
        hasExistingContent={hasExistingContent}
        existingContentLength={existingContentLength}
        applyMode={applyMode}
        onApplyModeChange={setApplyMode}
      />
    ),
    [hasExistingContent, existingContentLength, applyMode],
  );

  return (
    <GenerateEntityModal
      open={open}
      onClose={handleClose}
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
