import { memo } from 'react';

import { Box, Chip, Typography, useTheme } from '@mui/material';

import { isMcpToolkitType } from '@/[fsd]/shared/lib/helpers';
import { EntityIcon } from '@/[fsd]/shared/ui/icon';
import { getToolIconByType } from '@/common/toolkitUtils';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';
import PlayIcon from '@/components/Icons/PlayIcon';
import SendIcon from '@/components/Icons/SendIcon';
import UserIcon from '@/components/Icons/UserIcon';

// The server sends the badge key, the UI the word, icon and tone; colour never carries the meaning alone
const BADGES = {
  sends_messages: { label: 'Sends messages', Icon: SendIcon, tone: 'attention' },
  deletes_data: { label: 'Deletes data', Icon: DeleteIcon, tone: 'error' },
  changes_data: { label: 'Changes data', Icon: EditIcon, tone: 'attention' },
  runs_code: { label: 'Runs code', Icon: PlayIcon, tone: 'attention' },
  needs_approval: { label: 'Needs approval', Icon: AttentionIcon, tone: 'attention' },
  personal_credential: { label: 'Personal credential', Icon: UserIcon, tone: 'attention' },
};

// One sensitive tool in the risk review dialog: toolkit icon, "Toolkit · tool" (a personal
// credential has no tool), effect and risk badge
const RiskToolCard = memo(props => {
  const { tool } = props;
  const { toolkit, toolkit_type: toolkitType, tool: toolName, effect, badge } = tool;
  const theme = useTheme();
  const badgeKey = BADGES[badge] ? badge : 'needs_approval';
  const { label, Icon, tone } = BADGES[badgeKey];
  const styles = riskToolCardStyles(tone);

  return (
    <Box
      data-testid="risk-tool-card"
      sx={styles.card}
    >
      <EntityIcon
        icon={{
          component: getToolIconByType(toolkitType ?? '', theme, { isMCP: isMcpToolkitType(toolkitType) }),
        }}
        sx={styles.icon}
      />
      <Box sx={styles.text}>
        <Typography variant="labelMedium">{`${toolkit} · ${toolName ?? 'personal credential'}`}</Typography>
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          {effect}
        </Typography>
      </Box>
      <Chip
        size="small"
        variant="outlined"
        label={label}
        icon={
          <Box
            component={Icon}
            data-testid={`risk-badge-icon-${badgeKey}`}
            fill={theme.palette.icon[tone]}
            sx={styles.badgeIcon}
          />
        }
        sx={styles.badge}
      />
    </Box>
  );
});

RiskToolCard.displayName = 'RiskToolCard';

/** @type {MuiSx} */
const riskToolCardStyles = tone => ({
  card: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minHeight: '4rem',
    padding: '0.75rem 1rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
  }),
  icon: { minWidth: '2rem', width: '2rem', height: '2rem' },
  text: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 },
  // The tone sits in the border, tint and icon; the word stays text.primary for 4.5:1 (spec: tokens)
  badge: ({ palette }) => ({
    flexShrink: 0,
    color: palette.text.primary,
    borderColor: palette.border[tone],
    backgroundColor: palette.background[tone],
  }),
  badgeIcon: { width: '0.75rem', height: '0.75rem', fontSize: '0.75rem' },
});

export default RiskToolCard;
