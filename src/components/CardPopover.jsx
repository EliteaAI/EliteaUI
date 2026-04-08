import { forwardRef, isValidElement, useCallback, useImperativeHandle, useState } from 'react';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';

import { useNavigateToAuthorPublicPage } from '@/hooks/useCardNavigate';
import useTags from '@/hooks/useTags';
import styled from '@emotion/styled';

import UserAvatar from './UserAvatar';

const StyledPopoverContainer = styled(Popover)(({ theme }) => ({
  borderRadius: '0.5rem',
  '& > div': {
    border: `1px solid ${theme.palette.border.lines}`,
  },
  '& ul': {
    padding: '8px 0px',
    background: theme.palette.background.secondary,
  },
}));

const StyledPopoverItem = styled(ListItem)(({ theme }) => ({
  padding: '.5rem 1rem',
  '&:hover': {
    background: theme.palette.background.button.default,
  },
}));

const StyledAuthorPopoverItem = styled('div')(({ theme }) => ({
  cursor: 'pointer',
  caretColor: 'transparent',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'flex-start',
  padding: '0',
  '&:hover': {
    color: theme.palette.text.secondary,
  },
}));

const StyledCategoryPopoverItem = styled('div')(({ theme }) => ({
  cursor: 'pointer',
  caretColor: 'transparent',
  display: 'flex',
  padding: '0',
  '&:hover': {
    color: theme.palette.text.secondary,
  },
}));

const StyledCategoryList = styled(List)(() => ({
  overflowY: 'scroll',
  minWidth: '6.3125rem',
  // maxHeight: '8.3rem',
  '& .MuiTypography-body2': {
    display: 'flex',
    justifyContent: 'center',
  },
  '::-webkit-scrollbar': {
    display: 'none',
  },
}));

const CardPopover = forwardRef((props, ref) => {
  const { contentList, type, showName = true } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const { handleClickTag } = useTags();
  const { navigateToAuthorPublicPage } = useNavigateToAuthorPublicPage();

  useImperativeHandle(ref, () => ({
    handleClick,
  }));

  const handleTagClick = useCallback(
    tag => e => {
      handleClickTag(e, tag);
    },
    [handleClickTag],
  );

  const handleClick = useCallback(event => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const open = Boolean(anchorEl);
  const id = open ? 'card-popover' : undefined;

  return (
    <StyledPopoverContainer
      id={id}
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    >
      <StyledCategoryList>
        {contentList?.map((content, index) => {
          const contentMap = {
            author: (
              <StyledAuthorPopoverItem onClick={navigateToAuthorPublicPage(content.id, content.name)}>
                <UserAvatar
                  name={content.name}
                  avatar={content.avatar}
                />
                {showName && <div style={{ marginLeft: '0.5rem' }}>{content.name}</div>}
              </StyledAuthorPopoverItem>
            ),
            category: (
              <StyledCategoryPopoverItem onClick={handleTagClick(content)}>
                {content.name}
              </StyledCategoryPopoverItem>
            ),
          };
          return (
            <StyledPopoverItem key={`${content.id || content.name || content}-${index}`}>
              <ListItemText
                component={'div'}
                primary={
                  <Typography
                    component="div"
                    variant="bodySmall"
                  >
                    {isValidElement(content) ? content : contentMap[type]}
                  </Typography>
                }
              />
            </StyledPopoverItem>
          );
        })}
      </StyledCategoryList>
    </StyledPopoverContainer>
  );
});

CardPopover.displayName = 'CardPopover';

export default CardPopover;
