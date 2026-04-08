import { memo, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { ROUTE_STATISTIC_MAP } from '@/[fsd]/entities/author/lib/constants';
import { AuthorStatistics } from '@/[fsd]/entities/author/ui/AuthorInfo';
import UserAvatar from '@/components/UserAvatar';

const AuthorInformation = memo(props => {
  const { isLoading } = props;

  const location = useLocation();
  const styles = stylesAuthorInformation();
  const {
    name,
    avatar,
    public_applications = 0,
    total_applications = 0,
    total_pipelines = 0,
    total_toolkits = 0,
  } = useSelector(state => state.trendingAuthor.authorDetails);

  const statistics = useMemo(
    () => ({
      total_applications,
      public_applications,
      total_pipelines,
      total_toolkits,
    }),
    [total_applications, public_applications, total_pipelines, total_toolkits],
  );

  const currentsStatistic = useMemo(() => {
    const pathname = location.pathname;
    const matchedRoute = Object.keys(ROUTE_STATISTIC_MAP).find(route => pathname.startsWith(route));
    const statisticConfig = ROUTE_STATISTIC_MAP[matchedRoute];

    if (!statisticConfig) return null;

    return {
      label: statisticConfig.label,
      value: statistics[statisticConfig.valueKey],
      published: statistics[statisticConfig.publishedKey],
    };
  }, [location.pathname, statistics]);

  return !isLoading ? (
    <Box sx={styles.mainContainer}>
      {!!name && (
        <Box sx={styles.contentsContainer}>
          <UserAvatar
            avatar={avatar}
            name={name}
            size={45}
          />
          <Box sx={styles.userInfoBlock}>
            <Box sx={styles.nameBlock}>
              <Typography
                variant="labelMedium"
                sx={{ color: 'text.secondary' }}
              >
                {name}
              </Typography>
            </Box>
            {currentsStatistic && <AuthorStatistics statistic={currentsStatistic} />}
          </Box>
        </Box>
      )}
    </Box>
  ) : (
    <Box sx={styles.containerSkeleton}>
      <Skeleton
        variant="rectangular"
        sx={styles.skeleton}
      />
    </Box>
  );
});

const stylesAuthorInformation = () => ({
  mainContainer: ({ palette }) => ({
    maxHeight: '50vh',
    border: `0.0625rem solid ${palette.border.table}`,
    padding: '1rem 0.75rem',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
    width: '19.5rem',
    background: palette.background.tabPanel,
  }),
  contentsContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  userInfoBlock: {
    marginLeft: '16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  nameBlock: {
    height: '24px',
    display: 'flex',
    alignItems: 'center',
  },
  containerSkeleton: {
    marginTop: '0.5rem',
    marginBottom: '4rem',
  },
  skeleton: {
    marginTop: '10px',
    width: '100%',
    height: '3.75rem',
  },
});

AuthorInformation.displayName = 'AuthorInformation';

export default AuthorInformation;
