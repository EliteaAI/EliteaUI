import { memo, useCallback } from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';

import { GenerateEntityModal } from '@/[fsd]/entities/generate-entity-with-ai';
import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { useGenerateSkillDraftMutation, useSkillCreateMutation } from '@/[fsd]/features/skill/api';
import { SearchParams, SkillsTabs } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions from '@/routes';

import GenerateSkillReviewForm from './GenerateSkillReviewForm';

const GenerateSkillModal = memo(props => {
  const { open, onClose, onSkillCreated } = props;

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = useSelectedProjectId();

  const [createSkill] = useSkillCreateMutation();
  const [generateDraft, { error: generateError, reset: resetGenerate }] = useGenerateSkillDraftMutation();

  const handleGenerate = useCallback(
    description => generateDraft({ projectId, user_description: description }),
    [generateDraft, projectId],
  );

  const redirectToSkill = useCallback(
    (skillId, name) => {
      const pathname = `${RouteDefinitions.Skills}/${SkillsTabs[0]}/${skillId}`;
      setTimeout(() => {
        navigate(pathname, {
          replace: true,
          state: {
            routeStack: [
              {
                breadCrumb: name,
                pagePath: pathname,
              },
            ],
          },
        });
      }, 0);
    },
    [navigate],
  );

  const handleApprove = useCallback(
    async draftData => {
      const result = await createSkill({
        projectId,
        name: (draftData.name || '').trim(),
        description: (draftData.description || '').trim(),
        versions: [
          {
            name: LATEST_VERSION_NAME,
            instructions: draftData.instructions || '',
          },
        ],
      }).unwrap();

      if (onSkillCreated) {
        onSkillCreated(result);
        return;
      }

      const returnUrl = searchParams.get(SearchParams.ReturnUrl);
      const sourceApplicationId = searchParams.get(SearchParams.SourceApplicationId);

      if (returnUrl && sourceApplicationId && result?.id) {
        const urlObj = new URL(decodeURIComponent(returnUrl), window.location.origin);

        urlObj.searchParams.set('newSkillId', String(result.id));

        setTimeout(() => {
          navigate({ pathname: urlObj.pathname, search: urlObj.search }, { replace: true });
        }, 0);

        return;
      }

      redirectToSkill(result.id, result.name);
    },
    [createSkill, redirectToSkill, onSkillCreated, projectId, searchParams, navigate],
  );

  const renderReview = useCallback(
    (draft, onChange, onValidationChange) => (
      <GenerateSkillReviewForm
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
      entityLabel="skill"
      placeholder="Describe what your skill should do, its inputs, and expected output format."
      onGenerate={handleGenerate}
      generateError={generateError}
      resetGenerate={resetGenerate}
      renderReview={renderReview}
      onApprove={handleApprove}
      modalTestId="generate-skill-modal"
      closeButtonTestId="generate-skill-close-button"
      promptInputTestId="generate-skill-prompt-input"
      errorAlertTestId="generate-skill-error-alert"
      loadingIndicatorTestId="generate-skill-loading-indicator"
      generateButtonTestId="generate-skill-submit-button"
      cancelButtonTestId="generate-skill-cancel-button"
      backButtonTestId="generate-skill-back-button"
      approveButtonTestId="generate-skill-approve-button"
    />
  );
});

GenerateSkillModal.displayName = 'GenerateSkillModal';

export default GenerateSkillModal;
