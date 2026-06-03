import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import SummaryDetailsButton from './SummaryDetailsButton';

/**
 * Reusable stats display component for context budget information.
 * Displays strategy, messages, summaries, and optionally token usage.
 */
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

  const { strategyName, messageGroups, summariesGenerated, tokensDisplay, utilizationPercentage, maxTokens } =
    stats;

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
      { label: 'Strategy', value: strategyName },
      { label: 'Messages', value: messageGroups },
      { label: 'Summaries', value: summariesGenerated, isSummaries: true },
    );

    return items;
  }, [
    maxTokens,
    messageGroups,
    showTokens,
    tokensDisplay,
    utilizationPercentage,
    strategyName,
    summariesGenerated,
  ]);

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
