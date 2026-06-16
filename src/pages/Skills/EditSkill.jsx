import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Form, Formik, useFormikContext } from 'formik';
import { useNavigate, useParams } from 'react-router-dom';

import { Box, CircularProgress, Typography } from '@mui/material';

import SkillTabBar from '@/[fsd]/entities/skill-tab-bar/ui/SkillTabBar';
import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import SkillRowAction from '@/[fsd]/features/skill/ui/SkillRowAction';
import CreateSkillForm from '@/[fsd]/features/skill/ui/skill-details/form/CreateSkillForm';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { Markdown } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { CopyToClipboardButton } from '@/[fsd]/shared/ui/button';
import { useSkillDetailsQuery } from '@/api/skills';
import { SkillsTabs, ViewMode } from '@/common/constants';
import { buildErrorMessage, isNotFoundError } from '@/common/utils.jsx';
import DirtyDetector from '@/components/Formik/DirtyDetector';
import StyledTabs from '@/components/StyledTabs';
import useNavBlocker from '@/hooks/useNavBlocker';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import {
  ContentContainer,
  LeftGridItem,
  RightGridItem,
  StyledGridContainer,
} from '@/pages/Common/Components/StyledComponents';
import Page404 from '@/pages/Page404.jsx';
import SkillValidateSchema from '@/pages/Skills/SkillValidateSchema';
import RouteDefinitions from '@/routes';

const buildInitialValues = data => ({
  id: data?.id ?? null,
  name: data?.name || '',
  description: data?.description || '',
  versions: data?.versions || [],
  version_details: {
    name: data?.version_details?.name || data?.version?.name || LATEST_VERSION_NAME,
    tags: data?.version_details?.tags || data?.tags || [],
    instructions: data?.version_details?.instructions ?? data?.instructions ?? '',
  },
});

// Right-column Information accordion: Skill ID + Version with copy buttons.
const SkillInformation = memo(({ id, versionName }) => {
  const items = useMemo(
    () => [
      {
        title: 'Information',
        content: (
          <Box sx={infoStyles.content}>
            {id !== null && id !== undefined && (
              <CopyToClipboardButton
                label="Skill ID:"
                value={String(id)}
                tooltip="Copy ID"
                copyMessage="The ID has been copied to the clipboard"
              />
            )}
            {versionName && (
              <CopyToClipboardButton
                label="Version:"
                value={String(versionName)}
                tooltip="Copy version"
                copyMessage="The version has been copied to the clipboard"
              />
            )}
          </Box>
        ),
      },
    ],
    [id, versionName],
  );

  return (
    <BasicAccordion
      accordionSX={({ palette }) => ({ background: `${palette.background.tabPanel} !important` })}
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      items={items}
    />
  );
});

SkillInformation.displayName = 'SkillInformation';

const SkillInstructionsPreview = memo(() => {
  const { values } = useFormikContext();
  const instructions = values?.version_details?.instructions || '';

  return (
    <ContentContainer
      height="100%"
      sx={editSkillStyles.previewContainer}
    >
      <Typography
        variant="labelMedium"
        color="text.secondary"
        sx={editSkillStyles.previewTitle}
      >
        Instructions preview
      </Typography>
      {instructions ? (
        <Box sx={editSkillStyles.previewBody}>
          <Markdown>{instructions}</Markdown>
        </Box>
      ) : (
        <Typography
          variant="bodyMedium"
          color="text.default"
        >
          Nothing to preview yet. Add markdown instructions on the left.
        </Typography>
      )}
    </ContentContainer>
  );
});
SkillInstructionsPreview.displayName = 'SkillInstructionsPreview';

const EditSkill = memo(() => {
  const navigate = useNavigate();
  const { tab = SkillsTabs[0], skillId, version } = useParams();
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();

  const [dirty, setDirty] = useState(false);

  const { data, isFetching, isError, error } = useSkillDetailsQuery(
    { projectId, skillId, versionName: version },
    { skip: !projectId || !skillId },
  );

  const initialValues = useMemo(() => buildInitialValues(data), [data]);

  const formKey = useMemo(
    () =>
      `${skillId}:${data?.version_details?.id ?? data?.id ?? 'loading'}:${
        (data?.version_details?.instructions ?? data?.instructions ?? '').length
      }`,
    [skillId, data?.id, data?.version_details?.id, data?.version_details?.instructions, data?.instructions],
  );

  const currentVersionName = useMemo(
    () => version || data?.version_details?.name || data?.versions?.[0]?.name || LATEST_VERSION_NAME,
    [data?.version_details?.name, data?.versions, version],
  );

  const blockOptions = useMemo(() => ({ blockCondition: dirty }), [dirty]);
  useNavBlocker(blockOptions);

  const shouldShowNotFoundPage = isError && isNotFoundError(error);

  useEffect(() => {
    if (isError && !shouldShowNotFoundPage) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, shouldShowNotFoundPage, toastError]);

  const handleChangeVersion = useCallback(
    nextVersionName => {
      const base = `${RouteDefinitions.Skills}/${tab}/${skillId}`;
      const pathname =
        nextVersionName && nextVersionName !== LATEST_VERSION_NAME
          ? `${base}/${encodeURIComponent(nextVersionName)}`
          : base;
      navigate(pathname);
    },
    [navigate, skillId, tab],
  );

  const handleSuccess = useCallback(() => {
    setDirty(false);
  }, []);

  if (shouldShowNotFoundPage) {
    return <Page404 />;
  }

  return (
    <Formik
      key={formKey}
      enableReinitialize
      initialValues={initialValues}
      validationSchema={SkillValidateSchema}
      onSubmit={() => {}}
    >
      <StyledTabs
        fullWidth
        forceShowLabel
        tabSX={{ paddingX: '24px' }}
        tabs={[
          {
            label: data?.name || 'Skill',
            tabBarItems: isFetching ? null : (
              <SkillTabBar
                versions={data?.versions || []}
                currentVersionName={currentVersionName}
                onChangeVersion={handleChangeVersion}
                onSuccess={handleSuccess}
              />
            ),
            // Overflow action menu: Export (selected version) / Delete + the
            // visible-but-disabled "Publish" item (work item [10]).
            rightToolbar: isFetching ? null : (
              <SkillRowAction
                skillId={skillId}
                skillName={data?.name}
                versionName={currentVersionName}
                navigateToListAfterDelete
              />
            ),
            content: isFetching ? (
              <Box sx={editSkillStyles.loadingContainer}>
                <CircularProgress />
              </Box>
            ) : (
              <Form style={{ height: '100%' }}>
                <DirtyDetector setDirty={setDirty} />
                <StyledGridContainer
                  sx={editSkillStyles.gridContainer}
                  columnSpacing="32px"
                  container
                >
                  <LeftGridItem
                    size={{ xs: 12, lg: 6 }}
                    sx={editSkillStyles.leftGridItem}
                  >
                    <ContentContainer height="100%">
                      <CreateSkillForm
                        viewMode={ViewMode.Owner}
                        instructionsKey={`${skillId}:${currentVersionName}:${
                          (data?.version_details?.instructions ?? data?.instructions ?? '').length
                        }`}
                      />
                      <Box sx={editSkillStyles.informationWrapper}>
                        <SkillInformation
                          id={data?.id}
                          versionName={currentVersionName}
                        />
                      </Box>
                    </ContentContainer>
                  </LeftGridItem>
                  <RightGridItem
                    size={{ xs: 12, lg: 6 }}
                    sx={editSkillStyles.rightGridItem}
                  >
                    <SkillInstructionsPreview />
                  </RightGridItem>
                </StyledGridContainer>
              </Form>
            ),
          },
        ]}
      />
    </Formik>
  );
});

EditSkill.displayName = 'EditSkill';

/** @type {MuiSx} */
const infoStyles = {
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.5rem',
    paddingBottom: '1.5rem',
  },
};

/** @type {MuiSx} */
const editSkillStyles = {
  loadingContainer: {
    height: '100%',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    paddingBottom: '1.5rem',
    paddingTop: '0.75rem',
    paddingRight: '1.5rem',
    paddingLeft: '1.5rem',
    height: '100%',
  },
  leftGridItem: {
    height: '100%',
    overflowY: 'scroll',
  },
  rightGridItem: {
    height: '100%',
  },
  informationWrapper: {
    margin: '0.75rem auto 0',
    maxWidth: '40.1875rem',
  },
  previewContainer: {
    height: '100%',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  previewTitle: {
    flexShrink: 0,
  },
  previewBody: {
    flex: 1,
    overflowY: 'auto',
  },
};

export default EditSkill;
