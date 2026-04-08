import { memo } from 'react';

import { Typography } from '@mui/material';

import useAuthorName from '@/hooks/useAuthorName';

const AuthorEmptyListPlaceHolder = memo(props => {
  const { query, name } = props;
  const authorName = useAuthorName(name);
  if (!query) {
    return <Typography>{`${authorName} has not created any tools yet.`}</Typography>;
  } else {
    return <Typography>Nothing found.</Typography>;
  }
});
AuthorEmptyListPlaceHolder.displayName = 'AuthorEmptyListPlaceHolder';

export default AuthorEmptyListPlaceHolder;
