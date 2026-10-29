import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { CONTEXT_MESSAGES, CONTEXT_WINDOW_COPY } from '@/[fsd]/widgets/context-budget/lib/constants';

/**
 * Warning shown when context is near the compaction threshold. Matches the Figma alert style:
 * orange border/fill box with body text and an inline "Summarize now" link below.
 */
const ContextHighUsageBanner = memo(props => {
  const { isSummarizationEnabled = true, canEdit = true, isSummarizing = false, onSummarize } = props;
  const styles = contextHighUsageBannerStyles();

  const message = isSummarizationEnabled
    ? CONTEXT_MESSAGES.HIGH_USAGE_BANNER_WITH_SUMMARIZATION
    : CONTEXT_MESSAGES.HIGH_USAGE_BANNER_WITHOUT_SUMMARIZATION;

  const action = (
    <Button.BaseBtn
      variant={BUTTON_VARIANTS.auxiliary}
      onClick={onSummarize}
      disabled={!canEdit || isSummarizing}
      sx={styles.action}
      data-testid="context-budget-summarize-button"
    >
      {CONTEXT_MESSAGES.SUMMARIZE_NOW}
    </Button.BaseBtn>
  );

  return (
    <Box
      sx={styles.container}
      data-testid="context-budget-high-usage-banner"
    >
      <Typography
        variant="labelSmall"
        sx={styles.text}
      >
        {message}
      </Typography>
      {canEdit ? (
        action
      ) : (
        <Tooltip
          title={CONTEXT_WINDOW_COPY.NO_PERMISSION}
          placement="top-start"
        >
          <Box component="span">{action}</Box>
        </Tooltip>
      )}
    </Box>
  );
});

ContextHighUsageBanner.displayName = 'ContextHighUsageBanner';

/** @type {MuiSx} */
const contextHighUsageBannerStyles = () => ({
  container: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    margin: '0 1rem',
    padding: '0.5rem 1rem',
    backgroundColor: palette.background.attention,
    border: `0.0625rem solid ${palette.border.attention}`,
    borderRadius: '0.5rem',
  }),
  text: ({ palette }) => ({
    color: palette.text.attention,
  }),
  action: ({ palette }) => ({
    padding: '0.375rem 0',
    color: palette.text.showMore,
    minWidth: 0,
  }),
});

export default ContextHighUsageBanner;
