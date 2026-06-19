import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button as MuiButton } from '@mui/material';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { useSkillCreateMutation } from '@/[fsd]/features/skill/api';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { SearchParams, SkillsTabs } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils.jsx';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import useNavBlocker from '@/hooks/useNavBlocker';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import { TabBarItems } from '@/pages/Common/Components';
import RouteDefinitions from '@/routes';

const CreateSkillTabBar = memo(() => {
  const formik = useFormikContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const [createSkill, { isLoading, error, isError }] = useSkillCreateMutation();
  const [wantToCancel, setWantToCancel] = useState(false);

  const blockOptions = useMemo(
    () => ({ blockCondition: !!formik?.dirty && !wantToCancel }),
    [formik?.dirty, wantToCancel],
  );
  useNavBlocker(blockOptions);

  const shouldDisableSave = useMemo(
    () =>
      isLoading ||
      !formik.isValid ||
      !formik.values.name?.trim() ||
      !formik.values.description?.trim() ||
      !formik.dirty,
    [formik.dirty, formik.isValid, formik.values.description, formik.values.name, isLoading],
  );

  const onSave = useCallback(async () => {
    const validationErrors = await formik.validateForm();
    if (Object.keys(validationErrors).length) {
      formik.setTouched({ name: true, description: true });
      return;
    }
    try {
      const result = await createSkill({
        projectId,
        name: formik.values.name?.trim() || '',
        description: formik.values.description?.trim() || '',
        versions: [
          {
            name: LATEST_VERSION_NAME,
            instructions: formik.values?.version_details?.instructions || '',
            tags: formik.values?.version_details?.tags || [],
          },
        ],
      }).unwrap();

      formik.resetForm({ values: formik.values });
      const skillId = result?.id;

      // Came from an agent's "+ Skill > Create new": return to the agent with the new skill id
      // so the SKILLS section auto-attaches it.
      const returnUrl = searchParams.get(SearchParams.ReturnUrl);
      const sourceApplicationId = searchParams.get(SearchParams.SourceApplicationId);
      if (returnUrl && sourceApplicationId && skillId) {
        const urlObj = new URL(decodeURIComponent(returnUrl), window.location.origin);
        urlObj.searchParams.set('newSkillId', String(skillId));
        // Defer so the resetForm above clears before navigating, otherwise the
        // unsaved-changes nav blocker intercepts the return.
        setTimeout(() => {
          navigate({ pathname: urlObj.pathname, search: urlObj.search }, { replace: true });
        }, 0);
        return;
      }

      const pathname = `${RouteDefinitions.Skills}/${SkillsTabs[0]}/${skillId}`;
      setTimeout(() => {
        navigate(pathname, { replace: true });
      }, 0);
    } catch (e) {
      toastError(buildErrorMessage(e));
    }
  }, [createSkill, formik, navigate, projectId, searchParams, toastError]);

  const onCancel = useCallback(() => {
    setWantToCancel(true);
  }, []);

  useEffect(() => {
    if (!wantToCancel) return;
    // If we came from an agent's "Create new", return to that agent; else the skills list.
    const returnUrl = searchParams.get(SearchParams.ReturnUrl);
    if (returnUrl) {
      const urlObj = new URL(decodeURIComponent(returnUrl), window.location.origin);
      navigate({ pathname: urlObj.pathname, search: urlObj.search }, { replace: true });
    } else {
      navigate(RouteDefinitions.Skills);
    }
  }, [navigate, wantToCancel, searchParams]);

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  return (
    <TabBarItems>
      <MuiButton
        variant={BUTTON_VARIANTS.elitea}
        color="primary"
        disabled={shouldDisableSave}
        onClick={onSave}
      >
        Save
        {isLoading && <StyledCircleProgress size={20} />}
      </MuiButton>
      <Button.DiscardButton
        title="Cancel"
        disabled={isLoading}
        onDiscard={onCancel}
      />
    </TabBarItems>
  );
});

CreateSkillTabBar.displayName = 'CreateSkillTabBar';

export default CreateSkillTabBar;
