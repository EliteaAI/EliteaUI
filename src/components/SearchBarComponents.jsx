import { useCallback, useMemo, useState } from 'react';

import { Box, CircularProgress, InputBase, List, ListItem, ListSubheader } from '@mui/material';

import { typographyVariants } from '@/MainTheme';
import { SUGGESTION_PAGE_SIZE } from '@/common/constants';
import { useTheme } from '@emotion/react';

import CancelIcon from './Icons/CancelIcon';
import RemoveIcon from './Icons/RemoveIcon';
import SearchIcon from './Icons/SearchIcon';
import SendIcon from './Icons/SendIcon';

export const SearchPanel = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: '6px',
  flexWrap: 'nowrap',
  borderRadius: 27,
  backgroundColor: theme.palette.background.button.default,
  '&:hover': {
    backgroundColor: theme.palette.background.button.hover,
  },
  boxSizing: 'border-box',
  padding: '8px 12px',
  width: '312px',
  height: '36px',
  position: 'relative',
}));

export const StyledIconWrapper = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
}));

export const StyledRemoveIcon = props => (
  <StyledIconWrapper {...props}>
    <RemoveIcon />
  </StyledIconWrapper>
);

export const StyledSearchIcon = props => {
  const { disabled } = props;
  const theme = useTheme();
  return (
    <StyledIconWrapper
      sx={{
        pointerEvents: 'none',
      }}
      {...props}
    >
      <SearchIcon fill={disabled ? theme.palette.icon.fill.disabled : theme.palette.icon.fill.default} />
    </StyledIconWrapper>
  );
};

const MySendIcon = styled(SendIcon)(({ theme }) => ({
  fontSize: '16px',
  marginRight: '0px',
  fill: theme.palette.icon.fill.default,
  '&:hover': {
    fill: theme.palette.primary.main,
  },
}));

export const StyledCancelIcon = props => (
  <StyledIconWrapper
    sx={{
      marginLeft: '4px',
      marginRight: '12px',
    }}
    {...props}
  >
    <CancelIcon
      width="16px"
      height="16px"
    />
  </StyledIconWrapper>
);

export const StyledSendIcon = props => (
  <StyledIconWrapper {...props}>
    <MySendIcon />
  </StyledIconWrapper>
);

export const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: 'calc(100% - 6px) !important',
  '& .MuiInputBase-input': {
    fontSize: '14px',
    lineHeight: '24px',
    fontWeight: 400,
    padding: theme.spacing(1, 1, 1, 0),
    transition: theme.transitions.create('width'),
    width: '100%',
    height: '20px',
    color: theme.palette.text.secondary,
  },
  '& ::placeholder': {
    fontSize: '14px',
    lineHeight: '24px',
    fontWeight: 400,
    color: theme.palette.text.default,
  },
}));

const LIST_TOP_PADDING = '8px';
export const StyledList = styled(List)(({ theme }) => ({
  marginTop: '4px',
  maxHeight: '530px',
  overflow: 'auto',
  backgroundColor: theme.palette.background.secondary,
  borderRadius: '4px',
  border: `1px solid ${theme.palette.border.lines}`,
  padding: `0 16px ${LIST_TOP_PADDING} 16px`,
}));

export const StyledListSubheader = styled(ListSubheader)(({ theme }) => ({
  ...typographyVariants.bodyMedium,
  backgroundColor: theme.palette.background.secondary,
  padding: '14px 0 6px 0',
  display: 'flex',
  alignItems: 'center',
}));

export const StyledListItem = styled(ListItem)(({ theme }) => ({
  ...typographyVariants.bodyMedium,
  padding: '6px 16px',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.background.select?.hover || theme.palette.background.button.hover,
  },
  '&.Mui-disabled': {
    color: theme.palette.text.button.disabled,
    opacity: '1',
  },
}));

export const ListSection = ({ sectionTitle, isFetching, data, total, renderItem, fetchMoreData }) => {
  const [visibleCount, setVisibleCount] = useState(SUGGESTION_PAGE_SIZE);
  const handleShowMore = useCallback(() => {
    const newVisibleCount = visibleCount + SUGGESTION_PAGE_SIZE;
    setVisibleCount(newVisibleCount);
    if (data.length < newVisibleCount && data.length < total) {
      fetchMoreData();
    }
  }, [data.length, fetchMoreData, total, visibleCount]);

  const remainedCount = useMemo(() => total - visibleCount, [total, visibleCount]);
  const nextCount = useMemo(() => Math.min(SUGGESTION_PAGE_SIZE, remainedCount), [remainedCount]);

  return (
    <>
      <StyledListSubheader key={'sub-header-' + sectionTitle}>
        {sectionTitle}
        {isFetching ? (
          <CircularProgress
            size={16}
            sx={{ marginLeft: 1 }}
          />
        ) : null}
      </StyledListSubheader>
      {data?.length > 0 ? (
        <>
          {data.slice(0, visibleCount).map(renderItem)}
          {total > visibleCount && fetchMoreData && (
            <StyledListItem onClick={handleShowMore}>
              {`...Show ${nextCount} More (${remainedCount})`}
            </StyledListItem>
          )}
        </>
      ) : (
        <StyledListItem disabled>{`No ${sectionTitle} Match`}</StyledListItem>
      )}
    </>
  );
};
