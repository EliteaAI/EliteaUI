import { memo } from 'react';

import EntityIcon from '@/components/EntityIcon';
import UserAvatar from '@/components/UserAvatar';

const ParticipantAvatar = memo(props => {
  const { participantType, participantAgentType, participantIcon, authorName } = props;

  const styles = participantAvatarStyles();

  if (participantType === 'user') {
    return (
      <UserAvatar
        name={authorName}
        size={24}
      />
    );
  }

  const entityType = participantAgentType === 'pipeline' ? 'pipeline' : participantType;

  return (
    <EntityIcon
      icon={participantIcon}
      entityType={entityType}
      showBackgroundColor
      specifiedFontSize={15}
      imageStyle={styles.iconImg}
      sx={styles.iconWrapper}
    />
  );
});

ParticipantAvatar.displayName = 'ParticipantAvatar';

/** @type {MuiSx} */
const participantAvatarStyles = () => ({
  iconWrapper: ({ palette }) => ({
    width: '1.5rem',
    height: '1.5rem',
    minWidth: '1.5rem',
    background: palette.background.aiParticipantIcon,
  }),
  iconImg: {
    minWidth: '1.5rem',
    width: '1.5rem',
    height: '1.5rem',
  },
});

export default ParticipantAvatar;
