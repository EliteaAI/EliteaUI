import { memo } from 'react';

import { CircularProgress, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import HeartActiveIcon from '@/components/Icons/HeartActiveIcon';
import HeartIcon from '@/components/Icons/HeartIcon';

const LikeButton = memo(props => {
  const { isLiked, likes = 0, isLoading = false, disabled = false, onClick, testId } = props;

  return (
    <Button.BaseBtn
      variant="toggle"
      startIcon={!isLoading && (isLiked ? <HeartActiveIcon width={16} /> : <HeartIcon />)}
      endIcon={
        !isLoading && (
          <Typography
            component="span"
            variant="bodySmall"
          >
            {likes || 0}
          </Typography>
        )
      }
      loading={isLoading}
      loadingPosition="center"
      loadingIndicator={
        <CircularProgress
          size={20}
          aria-label="Updating like"
        />
      }
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-label="Like"
      aria-pressed={isLiked}
      data-testid={testId}
      data-liked={testId ? (isLiked ? 'true' : 'false') : undefined}
    />
  );
});

LikeButton.displayName = 'LikeButton';

export default LikeButton;
