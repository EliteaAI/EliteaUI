import React, { memo, useEffect, useState } from 'react';

import { formatDistanceToNow } from 'date-fns';

import { Typography } from '@mui/material';

const CreatedTimeInfo = props => {
  const { created_at } = props;
  const [time, setTime] = useState(formatDistanceToNow(new Date(created_at)) + ' ago');

  useEffect(() => {
    setTime(formatDistanceToNow(new Date(created_at)) + ' ago');

    const intervalId = setInterval(() => {
      setTime(formatDistanceToNow(new Date(created_at)) + ' ago');
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [created_at]);

  return (
    <Typography
      variant="bodySmall"
      sx={{ marginLeft: '.15rem' }}
    >
      {time}
    </Typography>
  );
};

CreatedTimeInfo.displayName = 'CreatedTimeInfo';

export default memo(CreatedTimeInfo);
