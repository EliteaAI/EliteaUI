import { styled } from '@mui/material/styles';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

import { filterProps } from '@/common/utils.jsx';

export const eliteaTreeItemStyle = (theme, isActive) => ({
  '& > .MuiTreeItem-content:first-of-type': {
    background: isActive ? `${theme.palette.background.select.hover} !important` : 'transparent',
  },
  '& .MuiTreeItem-label': {
    ...theme.typography.bodyMedium,
    color: theme.palette.text.secondary,
  },
  '& .MuiTreeItem-content:hover': {
    background: theme.palette.background.userInputBackground,
  },
  '& .MuiTreeItem-content': {
    '&.Mui-selected': {
      backgroundColor: `${theme.palette.background.select.selected.default} !important`,
    },
  },
  '& .Mui-selected > .MuiTreeItem-label:hover': {
    background: 'transparent',
  },
  '& .Mui-selected:hover': {
    background: theme.palette.background.userInputBackground,
  },
  '& .Mui-selected': {
    backgroundColor: 'transparent !important',
    '& .MuiTreeItem-checkbox': {
      '& svg': {
        fill: theme.palette.icon.fill.secondary,
      },
    },
  },
  '& .MuiTreeItem:hover': {
    background: theme.palette.background.userInputBackground,
  },
  '& .MuiTreeItem-checkbox': {
    '& svg': {
      fill: theme.palette.icon.fill.secondary,
    },
  },
  '& .Mui-focused': {
    background: 'transparent', //`${theme.palette.background.select.hover} !important`
  },
  // '& li .MuiTreeItem-content': {
  //   paddingLeft: '48px !important',
  // }
});

export const TheStyledTreeItem = styled(
  TreeItem,
  filterProps('isActive'),
)(({ theme, isActive }) => eliteaTreeItemStyle(theme, isActive));

export default function StyledTreeItem(props) {
  return <TheStyledTreeItem {...props} />;
}
