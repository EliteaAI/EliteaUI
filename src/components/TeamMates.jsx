import { useAuthorListQuery } from '@/api/social';
import PeopleList from '@/components/PeopleList';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const DEFAULT_LIMIT = 5;

const TeamMates = ({ entityType = 'application' }) => {
  const projectId = useSelectedProjectId();
  const {
    data: projectUsers = [],
    isSuccess,
    isError,
    isLoading,
  } = useAuthorListQuery({ projectId, limit: DEFAULT_LIMIT, sortBy: entityType }, { skip: !projectId });
  return (
    <PeopleList
      title={'Top Contributors'}
      people={projectUsers}
      isSuccess={isSuccess}
      isError={isError}
      isLoading={isLoading}
    />
  );
};

export default TeamMates;
