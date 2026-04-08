import { memo, useMemo } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import SummaryDetailsButton from '@/[fsd]/widgets/ContextBudget/ui/SummaryDetailsButton';
import ClipboardIcon from '@/assets/clipboard-icon.svg?react';
import MessagesIcon from '@/assets/messages-icon.svg?react';
import TokensIcon from '@/assets/tokens-icon.svg?react';

const ContextStats = memo(props => {
  const { stats, conversationId } = props;

  const theme = useTheme();
  const styles = contextStatsStyles();

  const { messageGroups, summariesGenerated, tokensDisplay, utilizationPercentage } = stats;

  const statItems = useMemo(
    () => [
      {
        label: 'Tokens',
        icon: <TokensIcon fill={theme.palette.icon.fill.secondary} />,
        value: tokensDisplay,
        suffix: `${utilizationPercentage}%`,
      },
      {
        label: 'Messages',
        icon: <MessagesIcon fill={theme.palette.icon.fill.secondary} />,
        value: messageGroups,
      },
      {
        label: 'Summaries',
        icon: <ClipboardIcon fill={theme.palette.icon.fill.secondary} />,
        value: summariesGenerated || 0,
        isButton: true,
      },
    ],
    [tokensDisplay, utilizationPercentage, messageGroups, summariesGenerated, theme],
  );

  if (!stats) return null;

  return (
    <Box sx={styles.statsContainer}>
      {statItems.map((item, index) => (
        <Box
          key={index}
          sx={styles.statCard}
        >
          <Typography
            variant="bodySmall"
            sx={styles.statLabel}
          >
            {item.label}:
          </Typography>
          <Box sx={styles.statContent}>
            {item.icon}
            <Typography
              variant="bodyMedium"
              sx={styles.statValue}
            >
              {item.isButton ? (
                <SummaryDetailsButton
                  count={item.value}
                  conversationId={conversationId}
                  disabled={item.value === 0}
                  isCompact={false}
                />
              ) : (
                item.value
              )}
            </Typography>
            {item.suffix && <Typography variant="bodyMedium">{item.suffix}</Typography>}
          </Box>
        </Box>
      ))}
    </Box>
  );
});

ContextStats.displayName = 'ContextStats';

/** @type {MuiSx} */
const contextStatsStyles = () => ({
  statsContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.75rem 0rem 0rem',
    marginBottom: '0.5rem',
  },
  statCard: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '0.375rem 0.75rem',
    backgroundColor: palette.background.tabPanel,
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    minWidth: '8rem',
    '&:first-of-type': {
      flex: '1 0 0',
    },
  }),
  statLabel: ({ palette }) => ({
    color: palette.text.primary,
  }),
  statContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
  },
  statValue: ({ palette }) => ({
    color: palette.text.secondary,
    flex: '1 0 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
});

export default ContextStats;
