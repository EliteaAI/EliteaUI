import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

export const HEADING_CHIP_VARIANTS = {
  default: 'default',
  suggestion: 'suggestion',
};

/**
 * A chip-shaped label used as a visual section heading.
 * Displays text in uppercase subtitle style with a semi-transparent
 * background and a border, adapting to the current theme (light/dark).
 */
const HeadingChip = memo(props => {
  const { label, sx, variant = HEADING_CHIP_VARIANTS.default, onClick } = props;

  const isSuggestion = variant === HEADING_CHIP_VARIANTS.suggestion;

  const handleKeyDown = useCallback(
    event => {
      if (!onClick) return;

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick(event);
      }
    },
    [onClick],
  );

  const styles = headingChipStyles(variant);

  return (
    <Box
      sx={[styles.chip, sx]}
      onClick={isSuggestion ? onClick : undefined}
      onKeyDown={isSuggestion ? handleKeyDown : undefined}
      role={isSuggestion ? 'button' : undefined}
      tabIndex={isSuggestion ? 0 : undefined}
    >
      <Typography
        variant={isSuggestion ? 'bodyMedium' : 'subtitle'}
        color={isSuggestion ? undefined : 'text.secondary'}
      >
        {label}
      </Typography>
    </Box>
  );
});

HeadingChip.displayName = 'HeadingChip';

/** @type {MuiSx} */
const headingChipStyles = variant => ({
  chip: ({ palette }) => {
    const base = {
      display: 'inline-flex',
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: '0.625rem',
      boxSizing: 'border-box',
      flexShrink: 0,
    };

    if (variant === HEADING_CHIP_VARIANTS.suggestion) {
      const { suggestionChip } = palette;

      return {
        ...base,
        padding: '0.25rem 1rem',
        background: suggestionChip.background.default,
        color: suggestionChip.text.default,
        border: `0.0625rem solid ${suggestionChip.border}`,
        borderRadius: '1.8125rem',
        cursor: 'pointer',
        '&:hover': {
          background: suggestionChip.background.hover,
          color: suggestionChip.text.hover,
        },
      };
    }

    return {
      ...base,
      padding: '0.25rem 0.625rem',
      background: palette.background.userInputBackgroundActive,
      border: `0.0625rem solid ${palette.border.lines}`,
      borderRadius: '0.25rem',
    };
  },
});

export default HeadingChip;
