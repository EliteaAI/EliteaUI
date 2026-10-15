import { memo, useCallback, useState } from 'react';

import { Box, useTheme } from '@mui/material';

import { useSystemSenderName } from '@/[fsd]/shared/lib/hooks';
import EliteAImage from '@/components/EliteAImage';
import EditIcon from '@/components/Icons/EditIcon';

import EntityTypeIcon from './EntityTypeIcon';

const EntityIcon = memo(props => {
  const {
    icon,
    entityType,
    editable,
    onEditClick,
    sx = {},
    imageStyle = {},
    forMessage = false,
    showBackgroundColor = true,
    isActive = false,
    specifiedFontSize = '1rem',
    'data-testid': dataTestId,
    imgTestId,
  } = props;
  const theme = useTheme();
  const systemSenderName = useSystemSenderName();
  const [isHovering, setIsHovering] = useState(false);

  const onMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  const onClickEdit = useCallback(() => {
    setIsHovering(false);
    onEditClick?.();
  }, [onEditClick]);

  // Without a handler the edit icon would be a dead control, so editing needs both.
  const isEditable = Boolean(editable && onEditClick);
  const hasIconUrl = !!icon?.url;
  const styles = entityIconStyles(showBackgroundColor, isEditable, sx, isHovering, imageStyle, hasIconUrl);
  return (
    <Box
      data-testid={dataTestId}
      sx={styles.container}
      onMouseEnter={isEditable ? onMouseEnter : undefined}
      onMouseLeave={isEditable ? onMouseLeave : undefined}
    >
      {icon?.component && <Box sx={styles.iconComponentBox}>{icon.component}</Box>}
      {icon?.url && !icon?.component && (
        <EliteAImage
          style={styles.imageStyle}
          image={icon}
          alt="Preview"
          data-testid={imgTestId}
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
          fill={theme.palette.icon.active}
        />
      )}
    </Box>
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
    alignSelf: 'center',
    position: 'relative',
    background:
      showBackgroundColor && !hasIconUrl
        ? palette.components.entityIcon.background.entityGradient
        : 'transparent',
    ...(editable && isHovering && { background: palette.components.entityIcon.background.hover }),
    cursor: editable ? 'pointer' : undefined,

    // Use mask compositing to reveal only the gradient ring and keep the inner circle transparent.
    '&::before':
      showBackgroundColor && !hasIconUrl && !(editable && isHovering)
        ? {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            padding: '0.0625rem',
            background: palette.components.entityIcon.background.entityBorderGradient,
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
