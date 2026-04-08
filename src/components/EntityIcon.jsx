import React, { memo, useCallback, useState } from 'react';

import { Box } from '@mui/material';

import { useSystemSenderName } from '@/[fsd]/shared/lib/hooks/useEnvironmentSettingByKey.hooks';
import WelcomeImage from '@/assets/chat-welcome.png';
import FlowIcon from '@/assets/flow-icon.svg?react';
import MCPIcon from '@/assets/mcp-icon.svg?react';
import { ChatParticipantType, DEFAULT_PARTICIPANT_NAME } from '@/common/constants';
import ApplicationsIcon from '@/components/Icons/ApplicationsIcon';
import DatabaseIcon from '@/components/Icons/DatabaseIcon';
import EmojiIcon from '@/components/Icons/EmojiIcon';
import FolderIcon from '@/components/Icons/FolderIcon';
import ModelIcon from '@/components/Icons/ModelIcon';
import UserIcon from '@/components/Icons/UserIcon';
import { useTheme } from '@emotion/react';

import EliteAImage from './EliteAImage';
import EditIcon from './Icons/EditIcon';
import SelectIconDialog from './SelectIconDialog';

const getIconFill = (theme, isActive, forMessage, specifiedFill) => {
  if (specifiedFill) return specifiedFill;
  if (isActive) return theme.palette.icon.fill.active;
  if (forMessage) return theme.palette.icon.fill.inactive;
  return theme.palette.icon.fill.default;
};

const getIconSizeNumeric = (specifiedFontSize, showBigIcon) => {
  if (specifiedFontSize) return specifiedFontSize;
  return showBigIcon ? 24 : 16;
};

const getIconSizeString = (specifiedFontSize, showBigIcon) => {
  if (specifiedFontSize) return specifiedFontSize;
  return showBigIcon ? '1.5rem' : '1rem';
};

export const EntityTypeIcon = memo(props => {
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
    case ChatParticipantType.Datasources:
      return <DatabaseIcon sx={{ color: fill, fontSize: sizeString }} />;

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
      // return <EliteAIcon sx={{ fontSize: sizeNumeric }} />;
      return (
        <Box
          component="img"
          height={36}
          width={36}
          src={WelcomeImage}
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

const EntityIcon = memo(props => {
  const {
    icon,
    entityType,
    editable,
    onChangeIcon,
    projectId,
    entityId,
    versionId,
    sx = {},
    imageStyle = {},
    forMessage = false,
    showBackgroundColor = true,
    isActive = false,
    specifiedFontSize = '1rem',
  } = props;
  const theme = useTheme();
  const systemSenderName = useSystemSenderName();
  const [isHovering, setIsHovering] = useState(false);
  const [openSelectIconDialog, setOpenSelectIconDialog] = useState(false);

  const onMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  const onClickEdit = useCallback(() => {
    setOpenSelectIconDialog(true);
    setIsHovering(false);
  }, []);

  const onCloseDialog = useCallback(() => {
    setOpenSelectIconDialog(false);
  }, []);

  const onSelectIcon = useCallback(
    newIcon => {
      onChangeIcon && onChangeIcon(newIcon);
    },
    [onChangeIcon],
  );

  const hasIconUrl = !!icon?.url;
  const styles = entityIconStyles(showBackgroundColor, editable, sx, isHovering, imageStyle, hasIconUrl);
  return (
    <>
      <Box
        sx={styles.container}
        onMouseEnter={editable ? onMouseEnter : undefined}
        onMouseLeave={editable ? onMouseLeave : undefined}
      >
        {icon?.component && <Box sx={styles.iconComponentBox}>{icon.component}</Box>}
        {icon?.url && !icon?.component && (
          <EliteAImage
            style={styles.imageStyle}
            image={icon}
            alt="Preview"
          />
        )}
        {!icon?.url && !icon?.component && !isHovering && (
          <EntityTypeIcon
            type={entityType}
            isActive={isActive}
            forMessage={forMessage}
            specifiedFontSize={specifiedFontSize}
            systemSenderName={systemSenderName}
          />
        )}
        {isHovering && (
          <EditIcon
            onClick={onClickEdit}
            sx={styles.editIcon}
            fill={theme.palette.primary.main}
          />
        )}
      </Box>
      <SelectIconDialog
        open={openSelectIconDialog}
        onClose={onCloseDialog}
        selectedIcon={icon}
        entityType={entityType}
        onSelectIcon={onSelectIcon}
        projectId={projectId}
        versionId={versionId}
        entityId={entityId}
      />
    </>
  );
});

EntityIcon.displayName = 'EntityIcon';

/** @type {MuiSx} */
const entityIconStyles = (
  showBackgroundColor,
  editable,
  customSx,
  isHovering,
  customImageStyle,
  hasIconUrl,
) => ({
  container: ({ palette }) => ({
    minWidth: '2.25rem',
    width: '2.25rem',
    height: '2.25rem',
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    background: showBackgroundColor && !hasIconUrl ? palette.background.icon.entityGradient : 'transparent',
    cursor: editable ? 'pointer' : undefined,

    // Use mask compositing to reveal only the gradient ring and keep the inner circle transparent.
    '&::before':
      showBackgroundColor && !hasIconUrl
        ? {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            padding: '0.0625rem',
            background: palette.background.icon.entityBorderGradient,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
          }
        : {},
    ...(typeof customSx === 'function' ? customSx({ palette }) : customSx),
  }),

  iconComponentBox: {
    width: '2.25rem',
    height: '2.25rem',
    display: isHovering ? 'none' : 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  imageStyle: {
    width: '2.25rem',
    height: '2.25rem',
    display: isHovering ? 'none' : undefined,
    ...customImageStyle,
  },

  editIcon: {
    fontSize: '1rem',
  },
});

export default EntityIcon;
