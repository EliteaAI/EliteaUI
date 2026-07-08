import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Form, Formik } from 'formik';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { Box, CircularProgress } from '@mui/material';

import SkillTabBar from '@/[fsd]/entities/skill-tab-bar/ui/SkillTabBar';
import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { SetDefaultVersionDialog } from '@/[fsd]/entities/version/ui';
import { useSetSkillDefaultVersionMutation, useSkillDetailsQuery } from '@/[fsd]/features/skill/api';
import { SkillValidateSchema } from '@/[fsd]/features/skill/lib/validation';
import SkillControls from '@/[fsd]/features/skill/ui/SkillControls';
import SkillInformation from '@/[fsd]/features/skill/ui/SkillInformation';
import CreateSkillForm from '@/[fsd]/features/skill/ui/skill-details/form/CreateSkillForm';
import SkillTestPanel from '@/[fsd]/features/skill/ui/skill-test-panel/SkillTestPanel';
import { eliteaApi } from '@/api/eliteaApi';
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
    meta: data?.version_details?.meta || {},
  },
});

const EditSkill = memo(() => {
  const styles = editSkillStyles();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { tab = SkillsTabs[0], skillId, version } = useParams();
  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();

  const [dirty, setDirty] = useState(false);
  const [isFullScreenChat, setIsFullScreenChat] = useState(false);

  const [setDefaultVersion, { isLoading: isSettingDefault, reset: resetDefaultMutation }] =
    useSetSkillDefaultVersionMutation();

  const [isDefaultDialogOpen, setIsDefaultDialogOpen] = useState(false);
  const [pendingDefaultVersionId, setPendingDefaultVersionId] = useState(null);

  const lgGridColumns = useMemo(() => (isFullScreenChat ? 12 : 6), [isFullScreenChat]);

  const { data, isFetching, isError, error } = useSkillDetailsQuery(
    { projectId, skillId, versionId: version },
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

  const currentVersionId = useMemo(() => {
    if (data?.version_details?.id != null) return data.version_details.id;
    const parsed = Number(version);
    if (Number.isFinite(parsed)) return parsed;
    return data?.versions?.[0]?.id;
  }, [data?.version_details?.id, data?.versions, version]);

  const blockOptions = useMemo(() => ({ blockCondition: dirty }), [dirty]);
  useNavBlocker(blockOptions);

  const shouldShowNotFoundPage = isError && isNotFoundError(error);

  useEffect(() => {
    if (isError && !shouldShowNotFoundPage) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, shouldShowNotFoundPage, toastError]);

  const handleChangeVersion = useCallback(
    nextVersionId => {
      const base = `${RouteDefinitions.Skills}/${tab}/${skillId}`;
      // Always carry the version id (including the default). A version-less URL
      // resolves to the skill's default version on the backend, so when a
      // non-default version is selected, omitting it makes that version unreachable.
      const pathname = nextVersionId ? `${base}/${nextVersionId}` : base;
      navigate(pathname);
    },
    [navigate, skillId, tab],
  );

  const handleSuccess = useCallback(() => {
    setDirty(false);
  }, []);

  const pendingDefaultVersionName = useMemo(() => {
    if (!pendingDefaultVersionId) return '';
    return data?.versions?.find(v => v.id === pendingDefaultVersionId)?.name || '';
  }, [pendingDefaultVersionId, data?.versions]);

  const handleOpenDefaultDialog = useCallback(versionId => {
    setPendingDefaultVersionId(versionId);
    setIsDefaultDialogOpen(true);
  }, []);

  const handleCloseDefaultDialog = useCallback(() => {
    setIsDefaultDialogOpen(false);
    setPendingDefaultVersionId(null);
  }, []);

  const handleConfirmSetDefault = useCallback(async () => {
    if (!pendingDefaultVersionId) return;
    const { error: setDefaultError } = await setDefaultVersion({
      projectId,
      skillId,
      versionId: pendingDefaultVersionId,
    });
    if (setDefaultError) {
      toastError(buildErrorMessage(setDefaultError) || 'Failed to set the default version.');
    } else {
      toastSuccess('Default version has been set successfully');
      dispatch(
        eliteaApi.util.updateQueryData(
          'skillDetails',
          { projectId, skillId, versionId: version },
          details => {
            if (!details.meta) details.meta = {};
            details.meta.default_version_id = pendingDefaultVersionId;
          },
        ),
      );
    }
    handleCloseDefaultDialog();
    setTimeout(() => resetDefaultMutation(), 0);
  }, [
    pendingDefaultVersionId,
    setDefaultVersion,
    projectId,
    skillId,
    version,
    toastError,
    toastSuccess,
    dispatch,
    handleCloseDefaultDialog,
    resetDefaultMutation,
  ]);

  if (shouldShowNotFoundPage) {
    return <Page404 />;
  }

  return (
    <>
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
          panelStyle={styles.tabPanel}
          tabsSX={styles.tabContainer}
          leftTabbarSectionSX={styles.leftTabbarSection}
          tabs={[
            {
              label: data?.name || 'Skill',
              tabBarItems: isFetching ? null : (
                <SkillTabBar
                  versions={data?.versions || []}
                  currentVersionId={currentVersionId}
                  defaultVersionId={data?.meta?.default_version_id}
                  onChangeVersion={handleChangeVersion}
                  onSuccess={handleSuccess}
                  handleSetDefaultVersion={handleOpenDefaultDialog}
                />
              ),
              // Overflow action menu mirroring the agent's ApplicationControls:
              // a VERSION section (Set as default / Export / Share / Fork / Publish / Delete)
              // and a SKILL section (Share / Pin / Delete).
              rightToolbar: isFetching ? null : (
                <SkillControls
                  skillId={skillId}
                  skillName={data?.name}
                  initialPinned={data?.is_pinned}
                  currentVersionId={currentVersionId}
                  onChangeVersion={handleChangeVersion}
                  onSetDefault={() => handleOpenDefaultDialog(currentVersionId)}
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
                          instructionsKey={`${skillId}:${currentVersionId}:${
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
      <SetDefaultVersionDialog
        open={isDefaultDialogOpen}
        onClose={handleCloseDefaultDialog}
        onConfirm={handleConfirmSetDefault}
        confirming={isSettingDefault}
        versionName={pendingDefaultVersionName}
        entityType="skill"
      />
    </>
  );
});

EditSkill.displayName = 'EditSkill';

/** @type {MuiSx} */
const editSkillStyles = () => ({
  tabContainer: {
    '& .MuiTabs-indicator': {
      display: 'none !important',
    },
    '& .MuiTab-root': {
      width: 'calc(100% - 2.215rem)',
      minWidth: 0,
    },
    '& .MuiTab-textColorPrimary': ({ palette }) => ({
      color: palette.text.secondary,
    }),
    '& .Mui-selected': ({ palette }) => ({
      pointerEvents: 'none',
      color: `${palette.text.secondary} !important`,
      minWidth: 0,
      maxWidth: '100%',
      width: '100%',
      justifyContent: 'flex-start !important',
      paddingLeft: '0rem !important',
      paddingRight: '0rem !important',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      display: 'block',
    }),
  },
  leftTabbarSection: {
    maxWidth: '33%',
    width: 'fit-content',
  },
  tabPanel: {
    padding: '0rem !important',
  },
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
    marginTop: '0.75rem',
  },
});

export default EditSkill;
