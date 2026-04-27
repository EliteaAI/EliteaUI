import { memo, useCallback } from 'react';

import { Box, IconButton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import { isApplicationCard, isPipelineCard } from '@/common/checkCardType';
import { ContentType, ViewMode } from '@/common/constants';
import { filterProps } from '@/common/utils';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import { useLikeApplicationCard } from '@/hooks/useCardLike';

import HeartActiveIcon from './Icons/HeartActiveIcon';
import HeartIcon from './Icons/HeartIcon';

export const StyledItemPair = styled(
  Box,
  filterProps('disabled'),
)(({ theme, disabled }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.375rem 0.5rem',
  width: '3.25rem',
  borderRadius: '0.5rem',
  caretColor: 'transparent',
  cursor: disabled ? 'default' : 'pointer',
  '&:hover': {
    background: disabled ? 'transparent' : theme.palette.background.icon.default,
  },
}));

const Like = memo(props => {
  const { viewMode, type = ContentType.ApplicationAll, data, onLikeSuccess } = props;
  const { id, name, likes = 0, is_liked = false, cardType } = data;

  const { handleLikeApplicationClick, isLoading } = useLikeApplicationCard({
    id,
    name,
    is_liked,
    type,
    viewMode,
    onSuccess: onLikeSuccess,
  });

  const handleLikeClick = useCallback(
    event => {
      event.stopPropagation();
      event.preventDefault();

      const isApp = isApplicationCard(cardType || type) || isPipelineCard(cardType || type);

      if (isApp) {
        handleLikeApplicationClick();
      }
    },
    [cardType, handleLikeApplicationClick, type],
  );

  const styles = getStyles();
  return (
    <IconButton
      variant="alita"
      color="tertiaryCount"
      disabled={viewMode !== ViewMode.Public || isLoading}
      onClick={handleLikeClick}
    >
      {is_liked ? <HeartActiveIcon width={16} /> : <HeartIcon sx={styles.icon} />}
      <Typography variant="bodySmall">{likes || 0}</Typography>
      {isLoading && <StyledCircleProgress size={20} />}
    </IconButton>
  );
});

Like.displayName = 'Like';

const getStyles = () => ({
  icon: { fontSize: '1rem' },
});

export default Like;
