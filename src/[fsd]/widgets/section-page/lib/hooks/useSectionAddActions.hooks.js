import { useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useImport } from '@/[fsd]/entities/import-wizard/lib/hooks';
import { AiEditPipelineConstants } from '@/[fsd]/features/pipelines/ai-edit-pipeline';
import { useSkillImport } from '@/[fsd]/features/skill/lib/hooks';
import { useProjectType } from '@/[fsd]/shared/lib/hooks';
import {
  BUILD_WITH_AI_KINDS,
  IMPORT_KINDS,
  SECTION_MODES,
  SECTION_PAGE_CONFIG,
} from '@/[fsd]/widgets/section-page/lib/constants/sectionPage.constants';
import { PERMISSIONS, PUBLIC_PROJECT_ID, SearchParams, ViewMode } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

export const useSectionAddActions = sectionKey => {
  const navigate = useNavigate();
  const { checkPermission } = useCheckPermission();
  const { isPublic } = useProjectType();
  const { personal_project_id: personalProjectId } = useSelector(state => state.user);
  const { projects } = useSelector(state => state.settings);
  const { openFileDialog } = useImport();
  const skillImport = useSkillImport();
  const { openFileDialog: openSkillFileDialog } = skillImport;
  const [isBuildWithAiOpen, setIsBuildWithAiOpen] = useState(false);

  const { title, listRoute, createRoute, createPermission, entityLabel, importKind, buildWithAi } =
    SECTION_PAGE_CONFIG[sectionKey];

  // As the old create button: nothing to create into for a user without a personal project in Public
  const isCreationBlocked = isPublic && !personalProjectId;
  const hasOwnProject = useMemo(
    () => Boolean(projects?.some(({ id }) => id != PUBLIC_PROJECT_ID)),
    [projects],
  );

  const canCreate = !isCreationBlocked && (!createPermission || checkPermission(createPermission));
  const canImport = Boolean(importKind) && hasOwnProject;
  const canBuildWithAi =
    Boolean(buildWithAi) && !isCreationBlocked && checkPermission(PERMISSIONS.applications.update);

  const navigateToCreate = useCallback(
    (extraState = {}) => {
      const search = `${SearchParams.ViewMode}=${ViewMode.Owner}`;
      navigate(
        { pathname: createRoute, search },
        {
          state: {
            ...extraState,
            routeStack: [
              {
                breadCrumb: title,
                pagePath: `${listRoute}/${SECTION_MODES.project}?${search}`,
              },
              {
                breadCrumb: `New ${entityLabel}`,
                viewMode: ViewMode.Owner,
                pagePath: `${createRoute}?${search}`,
              },
            ],
          },
        },
      );
    },
    [createRoute, entityLabel, listRoute, navigate, title],
  );

  const onNew = useCallback(() => navigateToCreate(), [navigateToCreate]);

  const onImport = useCallback(() => {
    if (importKind === IMPORT_KINDS.skill) openSkillFileDialog();
    else openFileDialog();
  }, [importKind, openFileDialog, openSkillFileDialog]);

  const onBuildWithAi = useCallback(() => {
    // The pipeline window writes into the create page's form, so it opens there
    if (buildWithAi === BUILD_WITH_AI_KINDS.pipeline) {
      navigateToCreate({ [AiEditPipelineConstants.OPEN_BUILD_WITH_AI_STATE_KEY]: true });
      return;
    }
    setIsBuildWithAiOpen(true);
  }, [buildWithAi, navigateToCreate]);

  const onCloseBuildWithAi = useCallback(() => setIsBuildWithAiOpen(false), []);

  return {
    canCreate,
    canImport,
    canBuildWithAi,
    onNew,
    onImport,
    onBuildWithAi,
    isBuildWithAiOpen,
    onCloseBuildWithAi,
    skillImport,
  };
};
