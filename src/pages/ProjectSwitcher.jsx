import { useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { eliteaApi } from '@/api/eliteaApi';
import { useProjectListQuery } from '@/api/project.js';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import Page404 from '@/pages/Page404.jsx';
import { getBasename } from '@/routes.js';
import { actions as settingsActions } from '@/slices/settings.js';

const ProjectSwitcher = () => {
  const { projectId } = useParams();
  const { data: projectList = [], isLoading: isProjectListLoading } = useProjectListQuery(undefined, {
    skip: !projectId || !parseInt(projectId),
  });

  const dispatch = useDispatch();
  const location = useLocation();

  const [isProjectAvailable, setIsProjectAvailable] = useState(true);

  useEffect(() => {
    if (!isProjectListLoading) {
      if (projectId) {
        const availableProject = projectList.find(projectItem => {
          return projectItem.id === parseInt(projectId);
        });

        if (availableProject) {
          // Check if we're switching to an Artifacts page - this module needs special handling
          const currentPath = location.pathname;
          const isOnArtifactsPage =
            currentPath.includes('/artifacts') || currentPath.includes('/create-bucket');

          if (isOnArtifactsPage) {
            // Clear RTK Query cache before project switch to prevent stale data issues
            // Only needed for Artifacts due to its complex state management
            dispatch(eliteaApi.util.resetApiState());
          }

          dispatch(
            settingsActions.setProject({
              id: parseInt(projectId),
              name: availableProject.name,
            }),
          );

          const baseUrl = `${window.location.protocol}//${window.location.host}`;
          const basename = getBasename();

          // Handle basename properly - location.pathname already includes basename
          // E.g., "/elitea_ui/29/artifacts" -> remove project ID -> "/elitea_ui/artifacts"
          // Then we don't need to add basename again since it's already in the path
          const pathWithoutProjectId = location.pathname.replace(`/${projectId}`, '');

          // If basename exists and path doesn't start with it, we need to add it
          // But if path already contains basename, we shouldn't add it again
          const finalPath =
            basename && !pathWithoutProjectId.startsWith(basename)
              ? basename + pathWithoutProjectId
              : pathWithoutProjectId;

          const locationPath = `${finalPath}${location.search}${location.hash}`;
          window.location.replace(`${baseUrl}${locationPath}`);
        } else {
          setIsProjectAvailable(false);
        }
      }
    }
  }, [projectId, location, isProjectListLoading, dispatch, projectList]);

  return isProjectAvailable ? (
    <Box
      width={'100%'}
      height={'600px'}
      display={'flex'}
      justifyContent={'center'}
      alignItems={'center'}
    >
      <StyledCircleProgress />
    </Box>
  ) : (
    <Page404 />
  );
};
export default ProjectSwitcher;
