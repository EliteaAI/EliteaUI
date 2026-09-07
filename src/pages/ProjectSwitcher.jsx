import { memo, useEffect, useMemo, useRef } from 'react';

import { useDispatch } from 'react-redux';
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom';

import { Box, Link, Typography } from '@mui/material';

import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { eliteaApi } from '@/api/eliteaApi';
import { useProjectListQuery } from '@/api/project.js';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import Page404 from '@/pages/Page404.jsx';
import { actions as settingsActions } from '@/slices/settings.js';

// Artifacts keeps derived state keyed by the project, and it survives the reload below.
const CACHE_SENSITIVE_PATHS = ['/artifacts', '/create-bucket'];

const ProjectSwitcher = memo(() => {
  const { projectId } = useParams();
  // `/:projectId/*` is matched last, so a mistyped first segment lands here too. Only a numeric
  // one names a project; anything else is an ordinary bad URL and stays a 404.
  const numericProjectId = parseInt(projectId);
  const {
    data: projectList = [],
    isError: isProjectListError,
    isSuccess: isProjectListLoaded,
    refetch: refetchProjectList,
  } = useProjectListQuery(undefined, {
    skip: !numericProjectId,
  });

  const dispatch = useDispatch();
  const location = useLocation();

  const targetProject = useMemo(
    () => projectList.find(projectItem => projectItem.id === numericProjectId),
    [projectList, numericProjectId],
  );

  // Only a list that actually loaded can prove a project is out of reach. A pending or failed
  // request looks exactly like an empty one, so deciding on `projectList` alone strands the user
  // on a dead page that never recovers when the request finally succeeds.
  const failure = useMemo(() => {
    if (isProjectListError) return { message: 'Could not load your projects.', onRetry: refetchProjectList };
    if (isProjectListLoaded && !targetProject) {
      return { message: `Project ${projectId} is not available to your account.` };
    }
    return null;
  }, [isProjectListError, isProjectListLoaded, targetProject, projectId, refetchProjectList]);

  const hasSwitched = useRef(false);

  // `window.location.replace` does not stop this component from rendering, and `targetProject` gets a
  // new identity every time the project list is refetched — a PROJECT invalidation while the redirect
  // is still in flight would otherwise re-enter here. On an artifacts path that is self-feeding:
  // `resetApiState` invalidates the very query whose result this effect depends on.
  useEffect(() => {
    if (!targetProject || hasSwitched.current) return;
    hasSwitched.current = true;

    if (CACHE_SENSITIVE_PATHS.some(path => location.pathname.includes(path))) {
      dispatch(eliteaApi.util.resetApiState());
    }

    dispatch(settingsActions.setProject({ id: numericProjectId, name: targetProject.name }));

    const destination = NavigationHelpers.stripProjectSegment(location.pathname, projectId);
    window.location.replace(`${window.location.origin}${destination}${location.search}${location.hash}`);
  }, [targetProject, numericProjectId, projectId, location, dispatch]);

  if (!numericProjectId) return <Page404 />;

  if (!failure) {
    return (
      <Box sx={projectSwitcherStyles.root}>
        <StyledCircleProgress />
      </Box>
    );
  }

  return (
    <Box sx={projectSwitcherStyles.root}>
      <Typography
        variant="bodyMedium"
        color="text.secondary"
      >
        {failure.message}
      </Typography>
      {failure.onRetry ? (
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          onClick={failure.onRetry}
        >
          Retry
        </Button.BaseBtn>
      ) : (
        <Link
          component={RouterLink}
          to="/"
          color="primary"
        >
          Go to Home page
        </Link>
      )}
    </Box>
  );
});

ProjectSwitcher.displayName = 'ProjectSwitcher';

// A constant rather than the usual factory: nothing here varies with props or state, so there is
// no reason to allocate a new sx object on every render.
/** @type {MuiSx} */
const projectSwitcherStyles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    width: '100%',
    height: '37.5rem',
  },
};

export default ProjectSwitcher;
