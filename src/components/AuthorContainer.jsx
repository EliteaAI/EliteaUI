import { memo, useCallback, useRef } from 'react';

import { Box, Typography } from '@mui/material';

import CardPopover from '@/components/CardPopover';
import UserAvatar from '@/components/UserAvatar';
import { useNavigateToAuthorPublicPage } from '@/hooks/useCardNavigate';

const MAX_NUMBER_AVATARS_SHOWN = 3;
const MAX_NUMBER_NAME_SHOWN = 1;

const AuthorContainer = memo(props => {
  const { authors = [], showName = true, style = {}, disabledNavigation = false } = props;

  const cardPopoverRef = useRef(null);

  const firstThreeAvatars = authors.slice(0, MAX_NUMBER_AVATARS_SHOWN);
  const extraAvatarCounts = authors.length - MAX_NUMBER_AVATARS_SHOWN;
  const extraNameCounts = authors.length - MAX_NUMBER_NAME_SHOWN;
  const styles = authorContainerStyle(style, disabledNavigation);

  const handleAuthorNumberClick = useCallback(event => {
    cardPopoverRef.current.handleClick(event);
  }, []);

  const { navigateToAuthorPublicPage } = useNavigateToAuthorPublicPage();

  return (
    <Box style={styles.avatarsContainerStyle}>
      {firstThreeAvatars.map(({ id, name, avatar }, index) => (
        <UserAvatar
          key={id}
          name={name}
          avatar={avatar}
          shiftPixels={index * 5}
          zIndex={firstThreeAvatars.length - index}
        />
      ))}
      {!showName && extraAvatarCounts > 0 ? (
        <Box
          sx={styles.extraAvatarCountsContainer}
          onClick={handleAuthorNumberClick}
        >
          +{extraAvatarCounts}
        </Box>
      ) : null}
      {showName && (
        <Box
          style={styles.textStyle}
          onClick={!disabledNavigation ? navigateToAuthorPublicPage(authors[0]?.id, authors[0]?.name) : null}
        >
          <Typography
            variant="bodyMedium"
            component="span"
          >
            {authors[0]?.name}
          </Typography>
        </Box>
      )}
      {showName && extraNameCounts > 0 && (
        <Box
          sx={styles.extraNameCountsContainer}
          onClick={handleAuthorNumberClick}
        >
          {`+${extraNameCounts}`}
        </Box>
      )}
      <CardPopover
        ref={cardPopoverRef}
        contentList={authors}
        type="author"
      />
    </Box>
  );
});

const authorContainerStyle = (style, disabledNavigation) => ({
  avatarsContainerStyle: {
    gap: '0.25rem',
    fontFamily: 'Montserrat',
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.75rem',
    lineHeight: '1rem',
    ...style,
  },
  extraAvatarCountsContainer: ({ palette }) => ({
    caretColor: 'transparent',
    width: '1.75rem',
    height: '1.75rem',
    lineHeight: '1.75rem',
    margin: '0 auto',
    cursor: 'pointer',
    '&:hover': {
      color: palette.text.secondary,
    },
  }),
  textStyle: {
    caretColor: 'transparent',
    marginLeft: '0.3125rem',
    wordWrap: 'break-word',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: '1',
    cursor: disabledNavigation ? 'default' : 'pointer',
  },
  extraNameCountsContainer: ({ palette }) => ({
    caretColor: 'transparent',
    marginLeft: '0.5rem',
    cursor: 'pointer',
    '&:hover': {
      color: palette.text.secondary,
    },
  }),
});

AuthorContainer.displayName = 'AuthorContainer';

export default AuthorContainer;
