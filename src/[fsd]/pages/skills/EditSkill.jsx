import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Form, Formik } from 'formik';
import { useNavigate, useParams } from 'react-router-dom';

import { Box, CircularProgress } from '@mui/material';

import SkillTabBar from '@/[fsd]/entities/skill-tab-bar/ui/SkillTabBar';
import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { useSkillDetailsQuery } from '@/[fsd]/features/skill/api';
import { SkillValidateSchema } from '@/[fsd]/features/skill/lib/validation';
import SkillControls from '@/[fsd]/features/skill/ui/SkillControls';
import SkillInformation from '@/[fsd]/features/skill/ui/SkillInformation';
import CreateSkillForm from '@/[fsd]/features/skill/ui/skill-details/form/CreateSkillForm';
import SkillTestPanel from '@/[fsd]/features/skill/ui/skill-test-panel/SkillTestPanel';
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
import RouteDefinitions from '@/routes';

const buildInitialValues = data => ({
  id: data?.id ?? null,
  name: data?.name || '',
  description: data?.description || '',
  versions: data?.versions || [],
  meta: data?.meta || {},
  version_details: {
    id: data?.version_details?.id ?? null,
    name: data?.version_details?.name || data?.version?.name || LATEST_VERSION_NAME,
    tags: data?.version_details?.tags || data?.tags || [],
    instructions: data?.version_details?.instructions ?? data?.instructions ?? '',
  },
});

const EditSkill = memo(() => {
  const styles = editSkillStyles();
  const navigate = useNavigate();
  const { tab = SkillsTabs[0], skillId, version } = useParams();
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();

  const [dirty, setDirty] = useState(false);
  const [isFullScreenChat, setIsFullScreenChat] = useState(false);
  const lgGridColumns = useMemo(() => (isFullScreenChat ? 12 : 6), [isFullScreenChat]);

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
      // Always carry the version name (including `base`). A version-less URL
      // resolves to the skill's default version on the backend, so when a
      // non-base version is the default, omitting it makes `base` unreachable.
      const pathname = nextVersionName ? `${base}/${encodeURIComponent(nextVersionName)}` : base;
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
                defaultVersionId={data?.meta?.default_version_id}
                onChangeVersion={handleChangeVersion}
                onSuccess={handleSuccess}
              />
            ),
            // Overflow action menu mirroring the agent's ApplicationControls:
            // a VERSION section (Set as default / Export / Share / Fork / Publish / Delete)
            // and a SKILL section (Share / Pin / Delete).
            rightToolbar: isFetching ? null : (
              <SkillControls
                skillId={skillId}
                skillName={data?.name}
                currentVersionName={currentVersionName}
                onChangeVersion={handleChangeVersion}
              />
            ),
            content: isFetching ? (
              <Box sx={styles.loadingContainer}>
                <CircularProgress />
              </Box>
            ) : (
              <Form style={{ height: '100%' }}>
                <DirtyDetector setDirty={setDirty} />
                <StyledGridContainer
                  sx={styles.gridContainer}
                  columnSpacing="32px"
                  container
                >
                  <LeftGridItem
                    size={{ xs: 12, lg: lgGridColumns }}
                    hidden={isFullScreenChat}
                    sx={styles.leftGridItem}
                  >
                    <ContentContainer height="100%">
                      <CreateSkillForm
                        viewMode={ViewMode.Owner}
                        instructionsKey={`${skillId}:${currentVersionName}:${
                          (data?.version_details?.instructions ?? data?.instructions ?? '').length
                        }`}
                      />
                      <Box sx={styles.informationWrapper}>
                        <SkillInformation
                          id={data?.id}
                          versionId={data?.version_details?.id}
                        />
                      </Box>
                    </ContentContainer>
                  </LeftGridItem>
                  <RightGridItem
                    size={{ xs: 12, lg: lgGridColumns }}
                    sx={styles.rightGridItem}
                  >
                    <SkillTestPanel
                      isFullScreenChat={isFullScreenChat}
                      setIsFullScreenChat={setIsFullScreenChat}
                    />
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
const editSkillStyles = () => ({
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
});

export default EditSkill;
