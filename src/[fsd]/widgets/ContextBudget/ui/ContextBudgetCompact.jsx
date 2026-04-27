import { memo, useMemo } from 'react';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import { TOOLTIP_CONFIG } from '@/[fsd]/widgets/ContextBudget/lib/constants';
import { ContextBudgetTooltipContent, SummaryDetailsButton } from '@/[fsd]/widgets/ContextBudget/ui';
import ClipboardIcon from '@/assets/clipboard-icon.svg?react';
import MessagesIcon from '@/assets/messages-icon.svg?react';
import TokensIcon from '@/assets/tokens-icon.svg?react';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import EditIcon from '@/components/Icons/EditIcon';
import { useTheme } from '@emotion/react';

/**
 * Compact horizontal view of context budget for agents page.
 * Displays tokens, messages, and summaries in a row format.
 */
const ContextBudgetCompact = memo(props => {
  const { stats, isHighUtilization, onEdit, conversationId } = props;
  const theme = useTheme();
  const styles = contextBudgetCompactStyles();

  const { messageGroups, summariesGenerated, utilizationPercentage, maxTokens } = stats;

  const tokensValue = useMemo(
    () => (maxTokens === 0 ? '-' : `${utilizationPercentage}%`),
    [maxTokens, utilizationPercentage],
  );

  if (!stats) return null;

  return (
    <Box sx={styles.container}>
      <Tooltip
        title={
          <ContextBudgetTooltipContent
            stats={stats}
            isHighUtilization={isHighUtilization}
          />
        }
        placement={TOOLTIP_CONFIG.COMPACT.placement}
        slotProps={{
          tooltip: { sx: styles.tooltipWrapper },
          popper: {
            modifiers: [
              {
                name: 'offset',
                options: { offset: TOOLTIP_CONFIG.COMPACT.offset },
              },
            ],
          },
        }}
      >
        <Box sx={styles.statsWrapper}>
          <Box sx={styles.statItem}>
            <TokensIcon style={styles.icon} />
            <Box sx={styles.textContent}>
              <Typography
                variant="bodySmall2"
                sx={styles.value}
              >
                {tokensValue}
              </Typography>
              {isHighUtilization && (
                <Box sx={styles.attentionIconWrapper}>
                  <AttentionIcon
                    width={16}
                    height={16}
                    fill={theme.palette.warning.yellow}
                  />
                </Box>
              )}
            </Box>
          </Box>

          <Box sx={styles.statItem}>
            <MessagesIcon style={styles.icon} />
            <Box sx={styles.textContent}>
              <Typography
                variant="bodySmall2"
                sx={styles.value}
              >
                {messageGroups}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Tooltip>

      <Box sx={styles.statItem}>
        <ClipboardIcon style={styles.icon} />
        <SummaryDetailsButton
          conversationId={conversationId}
          count={summariesGenerated || 0}
          disabled={!summariesGenerated}
          isCompact={false}
        />
      </Box>
      {onEdit && (
        <Tooltip
          title="Edit context settings"
          placement={TOOLTIP_CONFIG.INFO.placement}
        >
          <IconButton
            variant="alita"
            color="tertiary"
            onClick={onEdit}
            sx={styles.editButton}
          >
            <EditIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
});

ContextBudgetCompact.displayName = 'ContextBudgetCompact';

/** @type {MuiSx} */
const contextBudgetCompactStyles = () => ({
  tooltipWrapper: ({ palette }) => ({
    backgroundColor: palette.background.tooltip.default,
    color: palette.text.tooltip,
    padding: '0.3rem 0.4rem',
    borderRadius: '0.25rem',
    maxWidth: TOOLTIP_CONFIG.COMPACT.maxWidth,
  }),
  container: {
    display: 'flex',
    alignItems: 'center',
    height: '2.25rem',
    gap: '1rem',
    padding: '0.5rem 0.25rem 0.5rem 1rem',
    borderRadius: '1.5rem',
    border: ({ palette }) => `0.0625rem solid ${palette.border.lines}`,
  },
  statsWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  statItem: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: palette.icon.fill.disabled,
  }),
  icon: {
    width: '1rem',
    height: '1rem',
  },
  attentionIconWrapper: {
    display: 'flex',
    alignSelf: 'flex-end',
    marginBottom: '0.0625rem',
  },
  textContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  value: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  editButton: ({ palette }) => ({
    marginLeft: '0.5rem',
    backgroundColor: palette.background.button.secondary.default,
    '&:hover': {
      backgroundColor: palette.background.button.secondary.hover,
    },
  }),
});

export default ContextBudgetCompact;
