import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { analyticsTableStyles } from '@/[fsd]/features/settings/ui/analytics/components/analyticsTable.styles';

const { CHAT_PARTICIPANT_TYPE_LABELS } = AnalyticsCommonConstants;

const HEADERS = ['Type', 'Responses', 'Tokens', 'Cost'];

const ChatParticipantTable = memo(props => {
  const { rows } = props;

  const styles = chatParticipantTableStyles();

  return (
    <Box
      sx={styles.card}
      data-testid="analytics-chats-participant-table"
    >
      <Typography
        variant="labelMedium"
        sx={styles.title}
      >
        Cost by Participant
      </Typography>
      <Box sx={styles.tableWrapper}>
        <Box sx={styles.tableHeader}>
          {HEADERS.map(label => (
            <Box
              key={label}
              sx={[styles.tableCell, { flex: 1 }]}
            >
              {label}
            </Box>
          ))}
        </Box>
        <Box>
          {rows.length > 0 ? (
            rows.map((row, i) => (
              <Box
                key={i}
                sx={styles.tableRow}
              >
                <Box sx={[styles.tableCellValue, { flex: 1 }]}>
                  {CHAT_PARTICIPANT_TYPE_LABELS[row.type] || row.type || '-'}
                </Box>
                <Box sx={[styles.tableCellValue, { flex: 1 }]}>
                  {AnalyticCommonHelpers.fmtNum(row.responses)}
                </Box>
                <Box sx={[styles.tableCellValue, { flex: 1 }]}>
                  {AnalyticCommonHelpers.fmtNum(row.total_tokens)}
                </Box>
                <Box sx={[styles.tableCellValue, { flex: 1 }]}>
                  {AnalyticCommonHelpers.fmtCost(row.llm_cost)}
                </Box>
              </Box>
            ))
          ) : (
            <Typography
              variant="bodySmall"
              sx={styles.emptyText}
            >
              No participant data
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
});

ChatParticipantTable.displayName = 'ChatParticipantTable';

/** @type {MuiSx} */
const chatParticipantTableStyles = () => ({
  card: ({ palette }) => ({
    flex: 1,
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  }),
  title: ({ palette }) => ({ color: palette.text.secondary, marginBottom: '0.25rem', display: 'block' }),
  tableWrapper: { width: '100%', overflowX: 'auto' },
  tableHeader: ({ palette }) => ({
    display: 'flex',
    padding: '0.5rem 0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    gap: '0.5rem',
  }),
  tableCell: ({ palette }) => ({
    ...analyticsTableStyles.tableCell({ palette }),
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  tableRow: ({ palette }) => ({
    display: 'flex',
    padding: '0.5rem 0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.default}`,
    gap: '0.5rem',
    '&:hover': { backgroundColor: palette.background.interactiveItem.rowHover },
  }),
  tableCellValue: ({ palette }) => ({
    ...analyticsTableStyles.tableCellValue({ palette }),
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  emptyText: ({ palette }) => ({ color: palette.text.metrics || palette.text.disabled }),
});

export default ChatParticipantTable;
