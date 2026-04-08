import { memo, useMemo } from 'react';

import { useSelector } from 'react-redux';

import Box from '@mui/material/Box';

import { AuthorInformation } from '@/[fsd]/entities/author/ui';
import Categories from '@/components/Categories';
import TeamMates from '@/components/TeamMates';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import useQueryTrendingAuthor from '../hooks/useQueryTrendingAuthor';

const RightInfoPanel = memo(props => {
  const { tagList, specifiedStatus, title = 'Tags', entityType = 'application' } = props;

  const styles = stylesRightInfoPanel();
  const projectId = useSelectedProjectId();
  const { isLoadingAuthor, authorId } = useQueryTrendingAuthor(projectId);
  const { personal_project_id: privateProjectId } = useSelector(state => state.user);
  const selectedProjectId = useSelectedProjectId();
  const hasAuthorDetails = useSelector(state => !!state.trendingAuthor.authorDetails?.name);

  const shouldShowAuthorInfo = useMemo(() => {
    if (authorId) return true;

    if (selectedProjectId != null && privateProjectId != null) {
      return selectedProjectId === privateProjectId;
    }

    return true;
  }, [authorId, selectedProjectId, privateProjectId]);

  const isAuthorInfoLoading = isLoadingAuthor || (shouldShowAuthorInfo && !hasAuthorDetails);

  return (
    <Box style={styles.mainContainer}>
      <Categories
        tagList={tagList}
        title={title}
        style={{ flex: 1 }}
        specifiedStatus={specifiedStatus}
      />
      {shouldShowAuthorInfo ? (
        <AuthorInformation isLoading={isAuthorInfoLoading} />
      ) : (
        <TeamMates entityType={entityType} />
      )}
    </Box>
  );
});

const stylesRightInfoPanel = () => ({
  mainContainer: {
    height: `calc(100vh)`,
    display: 'flex',
    flexDirection: 'column',
  },
});

RightInfoPanel.displayName = 'RightInfoPanel';

export default RightInfoPanel;
