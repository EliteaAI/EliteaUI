import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import SummaryDetailsButton from './SummaryDetailsButton';

/**
 * Reusable stats display component for context budget information.
 * Displays strategy, messages, summaries, and optionally token usage.
 */
// Per-row testid for the plain (non-SummaryDetailsButton) value render path.
// "Messages" always renders through this path; "Summaries" only renders here
// when isCompact is false (the compact/expanded-panel path uses
// SummaryDetailsButton instead, which carries its own testid).
const STAT_VALUE_TESTIDS = {
  Messages: 'context-budget-messages-count',
  Summaries: 'context-budget-summaries-count',
};

const ContextBudgetStatsDisplay = memo(props => {
  const {
    stats,
    isCompact = false,
    labelStyle = {},
    valueStyle = {},
    rowStyle = {},
    showTokens = false,
    conversationId,
  } = props;

  // Map isCompact prop to appropriate Typography variant
  const typographyVariant = isCompact ? 'bodySmall2' : 'labelSmall';

  const { messageGroups, summariesGenerated, tokensDisplay, utilizationPercentage, maxTokens } = stats;

  const statItems = useMemo(() => {
    // If maxTokens is 0, only show messages (context manager disabled)
    if (maxTokens === 0) {
      return [{ label: 'Messages', value: messageGroups }];
    }

    const items = [];

    if (showTokens) {
      items.push({
        label: 'Tokens',
        value: `${tokensDisplay} (${utilizationPercentage}%)`,
      });
    }

    items.push(
      { label: 'Messages', value: messageGroups },
      { label: 'Summaries', value: summariesGenerated, isSummaries: true },
    );

    return items;
  }, [maxTokens, messageGroups, showTokens, tokensDisplay, utilizationPercentage, summariesGenerated]);

  return (
    <>
      {statItems.map(item => (
        <Box
          key={item.label}
          sx={rowStyle}
        >
          <Typography
            variant={typographyVariant}
            sx={labelStyle}
          >
            {item.label}:{' '}
          </Typography>
          {item.isSummaries && isCompact ? (
            <SummaryDetailsButton
              count={item.value}
              conversationId={conversationId}
            />
          ) : (
            <Typography
              variant={typographyVariant}
              sx={valueStyle}
              data-testid={STAT_VALUE_TESTIDS[item.label]}
            >
              {item.value}
            </Typography>
          )}
        </Box>
      ))}
    </>
  );
});

ContextBudgetStatsDisplay.displayName = 'ContextBudgetStatsDisplay';

export default ContextBudgetStatsDisplay;
