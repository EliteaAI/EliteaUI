import { memo } from 'react';

import { Box, useTheme } from '@mui/material';

import { BrandLogoConstants } from '@/[fsd]/shared/lib/constants';
import BrandLogo from '@/[fsd]/shared/ui/brand-logo';
import IndexIcon from '@/assets/file-code.svg?react';
import FlowIcon from '@/assets/flow-icon.svg?react';
import MCPIcon from '@/assets/mcp-icon.svg?react';
import SkillIcon from '@/assets/skill-icon.svg?react';
import { ChatParticipantType, DEFAULT_PARTICIPANT_NAME } from '@/common/constants';
import ApplicationsIcon from '@/components/Icons/ApplicationsIcon';
import EmojiIcon from '@/components/Icons/EmojiIcon';
import FolderIcon from '@/components/Icons/FolderIcon';
import ModelIcon from '@/components/Icons/ModelIcon';
import UserIcon from '@/components/Icons/UserIcon';

const getIconFill = (theme, isActive, forMessage, specifiedFill) => {
  if (specifiedFill) return specifiedFill;
  if (isActive) return theme.palette.icon.active;
  if (forMessage) return theme.palette.icon.inactive;
  return theme.palette.icon.default;
};

const getIconSizeNumeric = (specifiedFontSize, showBigIcon) => {
  if (specifiedFontSize) return specifiedFontSize;
  return showBigIcon ? 24 : 16;
};

const getIconSizeString = (specifiedFontSize, showBigIcon) => {
  if (specifiedFontSize) return specifiedFontSize;
  return showBigIcon ? '1.5rem' : '1rem';
};

const EntityTypeIcon = memo(props => {
  const {
    type,
    isActive,
    showBigIcon = false,
    forMessage = false,
    specifiedFill,
    specifiedFontSize = '1rem',
    systemSenderName = DEFAULT_PARTICIPANT_NAME,
  } = props;
  const theme = useTheme();

  const fill = getIconFill(theme, isActive, forMessage, specifiedFill);
  const sizeNumeric = getIconSizeNumeric(specifiedFontSize, showBigIcon);
  const sizeString = getIconSizeString(specifiedFontSize, showBigIcon);

  switch (type) {
    case 'agent':
    case ChatParticipantType.Applications:
      return <ApplicationsIcon sx={{ color: fill, fontSize: sizeNumeric }} />;

    case ChatParticipantType.Models:
      return (
        <ModelIcon
          width={sizeNumeric}
          height={sizeNumeric}
          fill={fill}
        />
      );

    case ChatParticipantType.Users:
      return (
        <UserIcon
          fill={fill}
          sx={{ color: fill, fontSize: sizeString }}
        />
      );

    case ChatParticipantType.Dummy:
      return (
        <BrandLogo
          variant={BrandLogoConstants.BRAND_LOGO_VARIANTS.Avatar}
          alt={systemSenderName}
        />
      );

    case 'pipeline':
      return (
        <Box
          component={FlowIcon}
          sx={{ color: fill, width: sizeNumeric, height: sizeNumeric }}
        />
      );

    case 'collection':
      return (
        <FolderIcon
          fill={fill}
          sx={{ color: fill, fontSize: sizeString }}
        />
      );

    case 'mcp':
      return (
        <MCPIcon
          fill={fill}
          sx={{ color: fill, fontSize: sizeString }}
        />
      );

    case 'skill':
      return (
        <Box
          component={SkillIcon}
          sx={{ color: fill, width: sizeNumeric, height: sizeNumeric }}
        />
      );
    case 'index':
      return (
        <Box
          component={IndexIcon}
          sx={{ color: fill, width: sizeNumeric, height: sizeNumeric }}
        />
      );
    default:
      return (
        <EmojiIcon
          width={sizeNumeric}
          height={sizeNumeric}
          fill={fill}
          sx={{ fontSize: sizeString }}
        />
      );
  }
});

EntityTypeIcon.displayName = 'EntityTypeIcon';

export default EntityTypeIcon;
