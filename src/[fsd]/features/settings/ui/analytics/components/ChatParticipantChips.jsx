import { memo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { AnalyticsChatsConstants, AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { EntityTypeIcon } from '@/[fsd]/shared/ui/icon';

const { CHAT_PARTICIPANT_TYPE_LABELS } = AnalyticsCommonConstants;
const { PARTICIPANT_ICON_TYPE, PARTICIPANT_TYPE_ORDER } = AnalyticsChatsConstants;

const ChatParticipantChips = memo(props => {
  const { participants } = props;

  const items = Array.isArray(participants) ? participants : [];
  const types = PARTICIPANT_TYPE_ORDER.filter(t => items.some(p => p?.type === t));

  if (!types.length) return '-';

  const shown = types.slice(0, 3);
  const extra = types.length - shown.length;
  const extraLabel =
    extra > 0
      ? types
          .slice(3)
          .map(t => CHAT_PARTICIPANT_TYPE_LABELS[t])
          .join(', ')
      : '';

  const styles = chatParticipantChipsStyles();

  return (
    <Box sx={styles.root}>
      {shown.map(type => (
        <Tooltip
          key={type}
          title={CHAT_PARTICIPANT_TYPE_LABELS[type]}
          placement="top"
        >
          <Box sx={styles.chip}>
            <EntityTypeIcon
              type={PARTICIPANT_ICON_TYPE[type]}
              specifiedFontSize="0.75rem"
            />
            <Box
              component="span"
              sx={styles.chipLabel}
            >
              {CHAT_PARTICIPANT_TYPE_LABELS[type]}
            </Box>
          </Box>
        </Tooltip>
      ))}
      {extra > 0 && (
        <Tooltip
          title={extraLabel}
          placement="top"
        >
          <Typography
            component="span"
            variant="labelTiny"
            sx={styles.extra}
          >
            +{extra}
          </Typography>
        </Tooltip>
      )}
    </Box>
  );
});

ChatParticipantChips.displayName = 'ChatParticipantChips';

/** @type {MuiSx} */
const chatParticipantChipsStyles = () => ({
  root: { display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' },
  chip: ({ palette }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    height: '1.25rem',
    padding: '0 0.375rem',
    borderRadius: '0.625rem',
    backgroundColor: palette.background.badge,
    color: palette.text.secondary,
    flexShrink: 0,
  }),
  chipLabel: {
    fontSize: '0.625rem',
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  extra: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    cursor: 'default',
  }),
});

export default ChatParticipantChips;
