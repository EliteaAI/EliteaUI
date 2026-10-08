import { memo } from 'react';

import { useTheme } from '@mui/material';

import { isMcpToolkitType } from '@/[fsd]/shared/lib/helpers';
import { ChatParticipantType } from '@/common/constants';
import { getToolIconByType } from '@/common/toolkitUtils';
import EntityIcon, { EntityTypeIcon } from '@/components/EntityIcon';
import UserAvatar from '@/components/UserAvatar';

// Type icon for a template participant: compact for value chips, circled for dropdown options
const ChatParticipantIcon = memo(props => {
  const { participant, withBackground = false } = props;
  const { entity_name, toolkit_type, avatar, name } = participant;

  const theme = useTheme();
  const styles = chatParticipantIconStyles();

  if (entity_name === ChatParticipantType.Users && avatar) {
    return (
      <UserAvatar
        avatar={avatar}
        name={name}
        size={withBackground ? 24 : 14}
      />
    );
  }

  const toolkitIcon =
    entity_name === ChatParticipantType.Toolkits
      ? getToolIconByType(toolkit_type ?? '', theme, { isMCP: isMcpToolkitType(toolkit_type) })
      : null;

  if (withBackground) {
    return (
      <EntityIcon
        icon={toolkitIcon ? { component: toolkitIcon } : undefined}
        entityType={entity_name}
        specifiedFontSize="0.75rem"
        sx={styles.circle}
      />
    );
  }

  return (
    toolkitIcon ?? (
      <EntityTypeIcon
        type={entity_name}
        specifiedFontSize="0.875rem"
      />
    )
  );
});

ChatParticipantIcon.displayName = 'ChatParticipantIcon';

/** @type {MuiSx} */
const chatParticipantIconStyles = () => ({
  circle: {
    minWidth: '1.5rem',
    width: '1.5rem',
    height: '1.5rem',
    flexShrink: 0,
    // Custom icon wrapper (toolkits) is fixed at 2.25rem inside EntityIcon; fit it to the circle.
    // Only `div` — pipeline/skill icons are Box-rendered <svg>s and must not be stretched.
    '& > div': {
      width: '100%',
      height: '100%',
    },
    // Every type icon gets the same glyph size regardless of how EntityTypeIcon sizes it
    '&& svg': {
      width: '0.75rem',
      height: '0.75rem',
      fontSize: '0.75rem',
    },
  },
});

export default ChatParticipantIcon;
