import { useSelector } from 'react-redux';

import { useApplicationTrendingAuthorsListQuery, useTrendingAuthorsListQuery } from '@/api/trendingAuthor';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import PeopleList from '@/components/PeopleList';
import { useIsFrom } from '@/hooks/useIsFromSpecificPageHooks';
import RouteDefinitions from '@/routes';

const TrendingAuthors = () => {
  const { trendingAuthorsList = [] } = useSelector(state => state.trendingAuthor);
  const isFromApplication = useIsFrom(RouteDefinitions.Applications);
  const { isSuccess, isError, isLoading } = useTrendingAuthorsListQuery(PUBLIC_PROJECT_ID, {
    skip: isFromApplication,
  });
  const {
    data: applicationsAuthors = [],
    isSuccess: isApplicationTASuccess,
    isError: isApplicationTAError,
    isLoading: isLoadingApplicationTA,
  } = useApplicationTrendingAuthorsListQuery(PUBLIC_PROJECT_ID, {
    skip: !isFromApplication,
  });
  return (
    <PeopleList
      title={'Trending Authors'}
      people={isFromApplication ? applicationsAuthors : trendingAuthorsList}
      isSuccess={isFromApplication ? isApplicationTASuccess : isSuccess}
      isError={isFromApplication ? isApplicationTAError : isError}
      isLoading={isFromApplication ? isLoadingApplicationTA : isLoading}
    />
  );
};

export default TrendingAuthors;
