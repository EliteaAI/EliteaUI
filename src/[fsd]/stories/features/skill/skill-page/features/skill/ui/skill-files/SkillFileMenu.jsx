import { memo, useMemo } from 'react';

import { useTheme } from '@mui/material';

import { SKILL_FILE_ACTIONS } from '@/[fsd]/features/skill/lib/constants';
import CopyLinkIcon from '@/assets/copy-link-icon.svg?react';
import DotMenu from '@/components/DotMenu';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import DownloadIcon from '@/components/Icons/DownloadIcon';
import EditIcon from '@/components/Icons/EditIcon';
import ExportIcon from '@/components/Icons/ExportIcon';
import RegenerateIcon from '@/components/Icons/RegenerateIcon';

/**
 * The "⋮" menu of a skill file or folder, the same in the tree and above the open file.
 * Grey icons, white labels; Delete is the last item, with no separator. Discard brings the file back, so there is
 * no confirmation.
 */
const SkillFileMenu = memo(props => {
  const { path, isFolder = false, onAction, id } = props;
  const theme = useTheme();

  const iconSx = useMemo(() => ({ fontSize: '1rem' }), []);
  const iconFill = theme.palette.icon.default;

  const menuItems = useMemo(() => {
    const item = (key, label, icon, extra = {}) => ({
      key,
      label,
      icon,
      onClick: () => onAction?.(key, path),
      slotProps: { ListItemText: { sx: itemTextSx } },
      ...extra,
    });
    if (isFolder)
      return [
        item(
          SKILL_FILE_ACTIONS.renameFolder,
          'Rename folder',
          <EditIcon
            sx={iconSx}
            fill={iconFill}
          />,
        ),
        item(
          SKILL_FILE_ACTIONS.uploadHere,
          'Upload here',
          <ExportIcon
            sx={iconSx}
            fill={iconFill}
          />,
        ),
        item(
          SKILL_FILE_ACTIONS.deleteFolder,
          'Delete folder',
          <DeleteIcon
            sx={iconSx}
            fill={iconFill}
          />,
        ),
      ];
    return [
      item(
        SKILL_FILE_ACTIONS.rename,
        'Rename',
        <EditIcon
          sx={iconSx}
          fill={iconFill}
        />,
      ),
      item(
        SKILL_FILE_ACTIONS.replace,
        'Replace with upload…',
        <RegenerateIcon
          sx={iconSx}
          fill={iconFill}
        />,
      ),
      item(
        SKILL_FILE_ACTIONS.download,
        'Download',
        <DownloadIcon
          sx={iconSx}
          fill={iconFill}
        />,
      ),
      item(
        SKILL_FILE_ACTIONS.copyPath,
        'Copy path',
        <CopyLinkIcon
          width={16}
          height={16}
          fill={iconFill}
        />,
      ),
      item(
        SKILL_FILE_ACTIONS.delete,
        'Delete',
        <DeleteIcon
          sx={iconSx}
          fill={iconFill}
        />,
      ),
    ];
  }, [iconFill, iconSx, isFolder, onAction, path]);

  return (
    <DotMenu
      id={id}
      menuIconSX={menuButtonSx}
      anchorOrigin={MENU_ANCHOR}
      transformOrigin={MENU_TRANSFORM}
      anchorButtonProps={{ 'data-testid': `${id}-button`, 'aria-label': 'More' }}
    >
      {menuItems}
    </DotMenu>
  );
});

SkillFileMenu.displayName = 'SkillFileMenu';

const MENU_ANCHOR = { vertical: 'bottom', horizontal: 'right' };
const MENU_TRANSFORM = { vertical: 'top', horizontal: 'right' };

// Tertiary, as BUTTON_VARIANTS.tertiary: no fill and a grey icon; on hover a fill and a white icon
const menuButtonSx = ({ palette }) => ({
  width: '1.75rem',
  height: '1.75rem',
  backgroundColor: 'transparent',
  svg: { fill: palette.icon.default },
  '&:hover': { backgroundColor: palette.components.button.background.tertiary.hover },
  '&:hover svg': { fill: palette.icon.secondary },
  '&:active': { backgroundColor: palette.components.button.background.tertiary.pressed },
});

const itemTextSx = ({ palette }) => ({ color: palette.text.secondary });

export default SkillFileMenu;
