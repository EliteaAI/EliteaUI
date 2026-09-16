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
  default: ({ palette }) => ({
    flex: 1,
    minWidth: 0,
    height: 'auto',
    padding: '0.25rem 0.625rem',
    borderRadius: '0.5rem',
    background: palette.components.npsSurvey.optionBackground,
    border: '0.0625rem solid transparent',
    color: palette.text.alwaysDark,
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: '1.5rem',

    '&:hover': {
      background: palette.components.npsSurvey.optionBackgroundHover,
      border: `0.0625rem solid ${palette.components.npsSurvey.accent}`,
    },
  }),
  selected: ({ palette }) => ({
    flex: 1,
    minWidth: 0,
    height: 'auto',
    padding: '0.25rem 0.625rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.components.npsSurvey.accent}`,
    background: palette.components.npsSurvey.accent,
    color: palette.text.alwaysWhite,
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: '1.5rem',

    '&:hover': {
      background: palette.components.npsSurvey.accent,
      border: `0.0625rem solid ${palette.components.npsSurvey.accent}`,
    },
  }),
};

export default ScoreButton;
