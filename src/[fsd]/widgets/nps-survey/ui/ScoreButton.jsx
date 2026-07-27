import { memo, useCallback } from 'react';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

const ScoreButton = memo(props => {
  const { score, isSelected, onClick } = props;

  const handleClick = useCallback(() => onClick(score), [onClick, score]);

  return (
    <Button.BaseBtn
      variant={BUTTON_VARIANTS.secondary}
      onClick={handleClick}
      sx={isSelected ? styles.selected : styles.default}
    >
      {score}
    </Button.BaseBtn>
  );
});

ScoreButton.displayName = 'ScoreButton';

/** @type {MuiSx} */
const styles = {
  default: {
    flex: 1,
    minWidth: 0,
    height: 'auto',
    padding: '0.25rem 0.625rem',
    borderRadius: '0.5rem',
    background: 'rgba(255, 255, 255, 0.6)',
    border: '1px solid transparent',
    color: '#0E131D',
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: '1.5rem',

    '&:hover': {
      background: '#fff',
      border: '1px solid rgba(99, 144, 254, 1)',
    },
  },
  selected: {
    flex: 1,
    minWidth: 0,
    height: 'auto',
    padding: '0.25rem 0.625rem',
    borderRadius: '0.5rem',
    border: '1px solid rgba(99, 144, 254, 1)',
    background: 'rgba(99, 144, 254, 1)',
    color: '#FFFFFF',
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: '1.5rem',

    '&:hover': {
      background: 'rgba(99, 144, 254, 1)',
      border: '1px solid rgba(99, 144, 254, 1)',
    },
  },
};

export default ScoreButton;
