import { memo, useCallback, useMemo, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router-dom';

import { Box, useTheme } from '@mui/material';

import { ProjectSelectShowMode } from '@/[fsd]/features/project/lib/constants';
import { usePublicProjectAccessCheck, useRestoreLastListRoute } from '@/[fsd]/features/project/lib/hooks';
import { Select } from '@/[fsd]/shared/ui';
import { useProjectListQuery } from '@/api/project';
import {
  PRIVATE_PROJECT_NAME,
  PUBLIC_PROJECT_ID,
  PUBLIC_PROJECT_NAME,
  URL_PARAMS_KEY_TAGS,
} from '@/common/constants';
import AlertDialog from '@/components/AlertDialog';
import { actions as searchActions } from '@/slices/search';
import { actions as settingsActions } from '@/slices/settings';

const ProjectSelect = memo(props => {
  const {
    customSelectedColor,
    showMode = ProjectSelectShowMode.CompactMode,
    label,
    sx,
    selectSX,
    labelSX,
    inputSX,
    disabled = false,
    required,
    forLocalUsage = false,
    value = {},
    onChange,
    filterIds = [],
    containerSX,
    usePrivateProjectAsDefaultSelected = true,
    hasNoPreselectedProject = false,
    showValidation = false,
    displayEmpty = false,
    selectPlaceholder = null,
    ...last
  } = props;
  const theme = useTheme();
  const [openAlert, setOpenAlert] = useState(false);
  const [targetProjectInfo, setTargetProjectInfo] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();
  const { onMonitorProjectChange } = useRestoreLastListRoute();
  const hasPublicProjectAccess = usePublicProjectAccessCheck();
  const dispatch = useDispatch();
  const {
    isBlockNav,
    isStreaming,
    isEditingCanvas,
    isEditingAgent,
    isEditingToolkit,
    isEditingPipeline,
    isEditingArtifact,
    warningMessage,
  } = useSelector(state => state.settings.navBlocker);

  const clearBlockingState = useCallback(() => {
    dispatch(searchActions.resetQuery());

    dispatch(settingsActions.setBlockNav(false));
    dispatch(settingsActions.setStreamingBlockNav({ isStreaming: false, streamingType: 'prompt' }));
  }, [dispatch]);

  const { personal_project_id: privateProjectId } = useSelector(state => state.user);
  const { project, projects } = useSelector(state => state.settings);

  const isAnyEditorOpen = useMemo(
    () => isEditingCanvas || isEditingAgent || isEditingToolkit || isEditingPipeline || isEditingArtifact,
    [isEditingCanvas, isEditingAgent, isEditingToolkit, isEditingPipeline, isEditingArtifact],
  );

  const selectedProject = useMemo(() => {
    if (forLocalUsage) {
      return value.id
        ? { id: value.id, name: value.name }
        : usePrivateProjectAsDefaultSelected
          ? {
              id: privateProjectId,
              name: 'Private',
            }
          : { id: '', name: '' };
    } else {
      return project?.id ? project : { id: privateProjectId, name: 'Private' };
    }
  }, [forLocalUsage, privateProjectId, project, usePrivateProjectAsDefaultSelected, value.id, value.name]);

  useProjectListQuery(undefined, { skip: !hasNoPreselectedProject && !selectedProject?.id });

  const getProjectName = useCallback(
    item => {
      if (!item) return '';
      if (item.id == privateProjectId) return PRIVATE_PROJECT_NAME;
      if (item.id == PUBLIC_PROJECT_ID) return PUBLIC_PROJECT_NAME;
      return item.name;
    },
    [privateProjectId],
  );

  const projectOptions = useMemo(() => {
    const handledProjects = projects
      .filter(
        i =>
          !filterIds.map(id => +id).includes(i.id) && (hasPublicProjectAccess || i.id != PUBLIC_PROJECT_ID),
      )
      .map(item => ({
        label: getProjectName(item),
        value: item.id,
      }));
    const publicProject = handledProjects.find(item => item.value == PUBLIC_PROJECT_ID);
    const privateProject = handledProjects.find(item => item.value == privateProjectId);
    const leftProjects = handledProjects
      .filter(item => item.value != PUBLIC_PROJECT_ID && item.value != privateProjectId)
      .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
    return [publicProject, privateProject, ...leftProjects].filter(item => item);
  }, [projects, filterIds, hasPublicProjectAccess, getProjectName, privateProjectId]);

  const location = useLocation();

  const changeProject = useCallback(
    (id, name) => {
      const newSearchParams = new URLSearchParams(searchParams);
      if (newSearchParams.has(URL_PARAMS_KEY_TAGS)) {
        newSearchParams.delete(URL_PARAMS_KEY_TAGS);
        setSearchParams(newSearchParams, {
          replace: true,
          state: location.state,
        });
      }

      // Navigate FIRST to prevent details page from fetching data with new project but old entity ID
      onMonitorProjectChange();

      setTimeout(() => {
        dispatch(
          settingsActions.setProject({
            id,
            name,
          }),
        );
      }, 10);
    },
    [dispatch, location.state, onMonitorProjectChange, searchParams, setSearchParams],
  );

  const onChangeProject = useCallback(
    id => {
      const name = projectOptions.find(item => item.value === id)?.label;
      if (forLocalUsage) {
        onChange({ id, name });
      } else {
        if (isBlockNav || isStreaming || isAnyEditorOpen) {
          setTargetProjectInfo({ id, name });
          setOpenAlert(true);
        } else {
          changeProject(id, name);
        }
      }
    },
    [projectOptions, forLocalUsage, onChange, isBlockNav, isStreaming, isAnyEditorOpen, changeProject],
  );

  const onCancelChange = useCallback(() => {
    setOpenAlert(false);
    setTargetProjectInfo({});
  }, []);

  const onConfirmChange = useCallback(() => {
    setOpenAlert(false);
    setTargetProjectInfo({});
    clearBlockingState();
    setTimeout(() => {
      changeProject(targetProjectInfo.id, targetProjectInfo.name);
    }, 0);
  }, [changeProject, clearBlockingState, targetProjectInfo.id, targetProjectInfo.name]);

  if (projectOptions.length <= 0 && showMode === ProjectSelectShowMode.CompactMode) return selectPlaceholder;

  const isCompact = showMode === ProjectSelectShowMode.CompactMode;

  const projectSingleSelect = (
    <Select.SingleSelect
      label={isCompact ? undefined : label}
      onValueChange={onChangeProject}
      value={selectedProject.id}
      displayEmpty={displayEmpty}
      options={projectOptions}
      customSelectedColor={`${customSelectedColor || theme.palette.text.primary} !important`}
      customSelectedFontSize={'0.875rem'}
      sx={selectSX}
      labelSX={labelSX}
      inputSX={inputSX}
      disabled={disabled}
      required={required}
      error={showValidation && !selectedProject.id}
      helperText={'Field is required'}
      emptyPlaceholder={selectPlaceholder}
      {...last}
    />
  );

  return (
    <>
      <Box sx={sx}>
        {isCompact ? (
          <Box sx={[styles.container, containerSX]}>{projectSingleSelect}</Box>
        ) : (
          projectSingleSelect
        )}
      </Box>
      <AlertDialog
        title="Warning"
        alertContent={warningMessage}
        open={openAlert}
        alarm
        onClose={onCancelChange}
        onCancel={onCancelChange}
        onConfirm={onConfirmChange}
      />
    </>
  );
});

const styles = {
  container: {
    display: 'flex',
    marginLeft: '0.5rem',
    zIndex: 1001,
    alignItems: 'center',
  },
};

ProjectSelect.displayName = 'ProjectSelect';

export default ProjectSelect;
