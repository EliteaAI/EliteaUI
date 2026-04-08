import { memo, useMemo } from 'react';

import { Avatar, Box, Skeleton, Typography } from '@mui/material';

import Person from '@/components/Icons/Person';

const AVATAR_SIZE_REM = 1.75;
const LIST_OF_ITEMS_LIMIT = 5;

const PeopleList = memo(props => {
  const { title, people, isSuccess, isError, isLoading, showAll } = props;

  const styles = componentStyles();
  const peopleCount = people.length;

  const successContent = useMemo(
    () =>
      people.length > 0 ? (
        (showAll ? people : people.slice(0, LIST_OF_ITEMS_LIMIT)).map(({ id, avatar, name, email }) => {
          const displayName = name || email || 'unknown';
          return (
            <Box
              key={id}
              sx={styles.itemContainer}
            >
              <Avatar
                alt={displayName}
                sx={styles.avatar}
              >
                {avatar ? (
                  <Box
                    component="img"
                    sx={{ width: `${AVATAR_SIZE_REM}rem` }}
                    src={avatar}
                    alt={displayName}
                  />
                ) : (
                  <Person fontSize={'1rem'} />
                )}
              </Avatar>
              <Typography
                component="span"
                variant="bodyMedium"
                sx={styles.teamMateText}
              >
                {displayName}
              </Typography>
            </Box>
          );
        })
      ) : (
        <Typography variant={'body2'}>None.</Typography>
      ),
    [people, showAll, styles.avatar, styles.itemContainer, styles.teamMateText],
  );

  return (
    <Box>
      <Typography
        component="div"
        variant="subtitle"
        sx={{ mb: 2 }}
      >
        {title}
        {peopleCount > 0 && ` (${peopleCount})`}
      </Typography>

      {isLoading && (
        <Box sx={styles.skeletonContainer}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Box
              key={index}
              sx={styles.itemContainer}
            >
              <Skeleton variant="circular">
                <Avatar sx={styles.avatar} />
              </Skeleton>
              <Skeleton
                variant="waved"
                height="1rem"
                width="100%"
                sx={{ marginLeft: '1rem' }}
              />
            </Box>
          ))}
        </Box>
      )}

      {isSuccess &&
        (showAll ? <Box sx={styles.successContentContainer}>{successContent}</Box> : successContent)}

      {isError && <Typography variant={'body2'}>Failed to load.</Typography>}
    </Box>
  );
});

PeopleList.displayName = 'PeopleList';

/** @type {MuiSx} */
const componentStyles = () => ({
  avatar: {
    width: `${AVATAR_SIZE_REM}rem`,
    height: `${AVATAR_SIZE_REM}rem`,
    marginRight: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem',
    fontSize: '1rem',
  },
  teamMateText: ({ palette }) => ({ color: palette.text.secondary }),
  skeletonContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  itemContainer: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  successContentContainer: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '12.5rem',
    overflow: 'scroll',
    gap: '0.5rem',
  },
});

export default PeopleList;
