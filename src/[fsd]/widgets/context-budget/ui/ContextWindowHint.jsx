import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { CONTEXT_WINDOW_COPY } from '@/[fsd]/widgets/context-budget/lib/constants';
import { formatWindowSize } from '@/[fsd]/widgets/context-budget/lib/utils';
import { isNullOrUndefined } from '@/common/utils';
import InfoIcon from '@/components/Icons/InfoIcon';

/**
 * Explains that Balanced and Full give the same window, shown when both modes resolve to the same token count.
 */
const ContextWindowHint = memo(props => {
  const { balancedWindowTokens, fullWindowTokens } = props;
  const styles = contextWindowHintStyles();

  const isIdentical =
    balancedWindowTokens > 0 && fullWindowTokens > 0 && balancedWindowTokens === fullWindowTokens;
  if (!isIdentical || isNullOrUndefined(fullWindowTokens) || isNullOrUndefined(balancedWindowTokens))
    return null;
  return (
    <Box
      sx={styles.container}
      data-testid="context-window-mode-identical-hint"
    >
      <InfoIcon
        width={16}
        height={16}
      />
      <Typography
        variant="labelSmall"
        color="text.info"
      >
        {CONTEXT_WINDOW_COPY.IDENTICAL_HINT(formatWindowSize(balancedWindowTokens))}
      </Typography>
    </Box>
  );
});

ContextWindowHint.displayName = 'ContextWindowHint';

/** @type {MuiSx} */
const contextWindowHintStyles = () => ({
  container: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    '& svg': {
      flexShrink: 0,
      '& path': {
        fill: palette.icon.tips,
      },
    },
  }),
  text: ({ palette }) => ({
    color: palette.text.tips,
  }),
});

export default ContextWindowHint;
