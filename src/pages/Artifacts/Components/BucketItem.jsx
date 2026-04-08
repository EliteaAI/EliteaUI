import { forwardRef, memo, useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, useTheme } from '@mui/material';

import { useShareLink } from '@/[fsd]/shared/lib/hooks/useShareLink.hooks';
import { Tooltip } from '@/[fsd]/shared/ui';
import CopyLinkIcon from '@/assets/copy-link-icon.svg?react';
import FileUploadIcon from '@/assets/icons/FileUploadIcon.svg?react';
import BucketIcon from '@/assets/icons/bucket-icon.svg?react';
import { PERMISSIONS } from '@/common/constants';
import DotMenu from '@/components/DotMenu';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { getBasename } from '@/routes';
import { generateBucketShareUrl } from '@/utils/shareUtils';

export const BucketItem = forwardRef((props, ref) => {
  const {
    bucket = {},
    isActive = false,
    onEdit,
    onDelete,
    onSelect,
    onUpload,
    isNextItemHighlighted = false,
    onItemHover,
    isExpanded = false,
    onToggle,
  } = props;
  const { name, owner_id } = bucket;

  const { checkPermission } = useCheckPermission();
  const projectId = useSelectedProjectId();
  const { id: userId, personal_project_id } = useSelector(state => state.user);
  const { copyShareLink } = useShareLink();

  const [isHovering, setIsHovering] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isPersonalProject = projectId === personal_project_id;

  const theme = useTheme();

  const styles = bucketItemStyles({
    isActive,
    isHovering,
    isNextItemHighlighted,
    showMenu,
    theme,
    isExpanded,
  });

  const handleDeleteBucket = useCallback(async () => {
    onDelete(bucket);
  }, [bucket, onDelete]);

  const handleEditBucket = useCallback(() => {
    onEdit(bucket);
  }, [bucket, onEdit]);

  const handleShareBucket = useCallback(() => {
    const shareUrl = generateBucketShareUrl(projectId, name, getBasename());
    copyShareLink(shareUrl, 'bucket', bucket?.id, name);
  }, [bucket?.id, copyShareLink, name, projectId]);

  const handleSelectBucket = useCallback(() => {
    if (isActive) {
      onToggle?.(bucket.name);
    }
    // Always call onSelect to ensure table navigation resets to root
    onSelect(bucket);
  }, [bucket, isActive, onSelect, onToggle]);

  const handleUploadClick = useCallback(
    event => {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }

      if (onUpload && bucket.name) onUpload(bucket.name);
    },
    [onUpload, bucket.name],
  );

  const onMouseMove = useCallback(
    state => {
      setIsHovering(state);
      onItemHover?.(bucket.name, state);
    },
    [bucket.name, onItemHover],
  );

  const onCloseMenuList = useCallback(() => {
    setShowMenu(false);
    setIsHovering(false);
  }, []);

  const handleMenuClick = useCallback(e => {
    e.stopPropagation();
  }, []);

  const onShowMenuList = useCallback(() => {
    setShowMenu(true);
    if (!isActive) {
      onSelect(bucket);
    }
  }, [bucket, isActive, onSelect]);

  const menuItems = useMemo(() => {
    const hasActionRights = action =>
      checkPermission(PERMISSIONS.artifacts.buckets[action]) ||
      checkPermission(PERMISSIONS.artifacts[action]) ||
      (owner_id && userId === owner_id);

    const canDelete = hasActionRights('delete');
    const canUpdate = hasActionRights('update');
    const canUpload = hasActionRights('create');

    return [
      {
        label: 'Upload files',
        icon: (
          <Box
            component={FileUploadIcon}
            sx={styles.menuIcon}
          />
        ),
        disabled: !canUpload,
        onClick: handleUploadClick,
      },
      {
        label: 'Edit',
        icon: (
          <EditIcon
            sx={{ fontSize: '1rem' }}
            fill={theme.palette.icon.fill.default}
          />
        ),
        disabled: !canUpdate,
        onClick: handleEditBucket,
      },
      {
        label: 'Share',
        icon: (
          <Box
            component={CopyLinkIcon}
            sx={styles.menuIcon}
          />
        ),
        onClick: handleShareBucket,
        display: isPersonalProject ? 'none' : undefined,
      },
      {
        label: 'Delete',
        icon: (
          <DeleteIcon
            sx={{ fontSize: '1rem' }}
            fill={theme.palette.icon.fill.default}
          />
        ),
        alertTitle: 'Delete bucket?',
        confirmButtonTitle: 'Delete',
        alarm: true,
        disabled: !canDelete,
        inlineExtraContent: ` It can't be restored.`,
        entityName: name,
        shouldRequestInputName: false,
        onConfirm: handleDeleteBucket,
        modalSx: { paper: { width: '30rem' } },
      },
    ].filter(item => item.display !== 'none');
  }, [
    theme.palette.icon.fill.default,
    styles.menuIcon,
    checkPermission,
    handleDeleteBucket,
    handleEditBucket,
    handleShareBucket,
    handleUploadClick,
    owner_id,
    userId,
    isPersonalProject,
    name,
  ]);

  return (
    <Box
      ref={ref}
      sx={styles.container}
      onClick={handleSelectBucket}
      onMouseEnter={() => onMouseMove(true)}
      onMouseLeave={() => onMouseMove(false)}
    >
      <Box sx={styles.contentArea}>
        <Box sx={styles.contentInner}>
          <Box
            component={BucketIcon}
            sx={styles.bucketIcon}
          />
          <Tooltip.TypographyWithConditionalTooltip
            title={name}
            placement="top"
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.bucketName}
          >
            {name}
          </Tooltip.TypographyWithConditionalTooltip>
        </Box>
      </Box>

      <Box
        id="Menu"
        sx={styles.menuContainer}
        onClick={handleMenuClick}
      >
        <DotMenu
          id="bucket-menu"
          slotProps={styles.menuSlotProps}
          onClose={onCloseMenuList}
          onShowMenuList={onShowMenuList}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {menuItems}
        </DotMenu>
      </Box>
    </Box>
  );
});

BucketItem.displayName = 'BucketItem';

const bucketItemStyles = ({ isActive, isHovering, isNextItemHighlighted, showMenu, theme, isExpanded }) => {
  const getBackgroundColor = () => {
    if (isActive) return theme.palette.background.conversation.selected;
    if (isHovering && !isActive) return theme.palette.background.conversation.hover;

    return theme.palette.background.conversation.normal;
  };

  const isHighlighted = isActive || isHovering;

  return {
    container: {
      borderBottom:
        isHighlighted || isNextItemHighlighted || isExpanded
          ? 'none'
          : `0.0625rem solid ${theme.palette.border.conversationItemDivider}`,
      padding: '0.5rem 0.5rem',
      gap: '0.5rem',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      height: '2.5rem',
      boxSizing: 'border-box',
      background: getBackgroundColor(),
      borderTopRightRadius: isHighlighted ? '0.375rem' : 0,
      borderTopLeftRadius: isHighlighted ? '0.375rem' : 0,
      borderBottomRightRadius: isHighlighted ? '0.375rem' : 0,
      borderBottomLeftRadius: isHighlighted ? '0.375rem' : 0,
      position: 'relative',
      zIndex: isHighlighted ? 1 : 0,
      cursor: 'pointer',

      '&:hover #Menu': {
        visibility: 'visible',
      },
    },

    contentArea: {
      width: 'calc(100% - 2rem)',
    },

    contentInner: {
      width: '100%',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      gap: '0.625rem',
    },

    bucketIcon: {
      width: '1rem',
      height: '1rem',
      minWidth: '1rem',
      color: theme.palette.icon.fill.secondary,
    },

    bucketName: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpaceCollapse: 'preserve',
      fontSize: '0.75rem',
    },

    menuContainer: {
      height: '100%',
      visibility: showMenu ? 'visible' : 'hidden',
      display: isHovering || showMenu ? 'flex' : 'none',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
    },

    menuSlotProps: {
      ListItemText: {
        sx: { color: theme.palette.text.secondary },
        primaryTypographyProps: { variant: 'bodyMedium' },
      },
      ListItemIcon: {
        sx: {
          minWidth: '1rem !important',
          marginRight: '0.75rem',
        },
      },
    },
    menuIcon: { fontSize: '1rem', color: theme.palette.icon.fill.default },
  };
};

export default memo(BucketItem);
