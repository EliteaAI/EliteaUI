import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { Box, Grid, Skeleton } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';

export const LeftContentContainer = styled(Box)(() => ({
  overflowY: 'scroll',
  height: 'calc(100vh - 11.7rem)',
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
  '::-webkit-scrollbar': {
    display: 'none',
  },
}));

export const ContentContainer = styled(Box)(({ theme }) => ({
  boxSizing: 'border-box',
  [theme.breakpoints.up('lg')]: {
    overflowY: 'scroll',
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',
    '::-webkit-scrollbar': {
      display: 'none',
    },
  },
}));

export const StyledGridContainer = styled(Grid)(({ theme }) => ({
  padding: '12px 0px 12px 0px',
  boxSizing: 'border-box',
  height: '100%',
  [theme.breakpoints.down('lg')]: {
    overflowY: 'scroll',
    height: 'calc(100vh - 70px)',
    '::-webkit-scrollbar': {
      display: 'none',
    },
  },
}));

export const LeftGridItem = styled(Grid)(() => ({
  position: 'relative',
  padding: '0 0 0 0',
}));

export const RightGridItem = styled(Grid)(() => ({
  padding: '0 0 0 0',
}));

export const TabBarItems = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}));

export const StyledUnfoldLessIcon = styled(UnfoldLessIcon)(({ theme }) => ({
  color: theme.palette.icon.fill.default,
  fontSize: 'inherit',
}));

export const StyledUnfoldMoreIcon = styled(UnfoldMoreIcon)(({ theme }) => ({
  color: theme.palette.icon.fill.default,
  fontSize: 'inherit',
}));

export const StyledIconButton = styled(IconButton)(() => ({
  zIndex: 100,
  marginRight: '-1.096rem',
  position: 'absolute',
  top: '0',
  right: '8px',
}));

export const TabContentDiv = styled('div')(({ theme }) => ({
  padding: `${theme.spacing(3)} ${theme.spacing(0.5)}`,
}));

export const HeaderItemDivider = styled('div')(({ theme }) => ({
  width: '0.0625rem',
  height: '1.75rem',
  border: `1px solid ${theme.palette.border.lines}`,
  borderTop: '0',
  borderRight: '0',
  borderBottom: '0',
}));

export const DetailSkeleton = ({ sx }) => (
  <Grid
    sx={sx}
    container
    spacing={2}
  >
    <Grid size={{ xs: 6 }}>
      <Skeleton
        animation="wave"
        variant="rectangular"
        width={'100%'}
        height={'calc(100vh - 120px)'}
      />
    </Grid>
    <Grid size={{ xs: 6 }}>
      <Skeleton
        animation="wave"
        variant="rectangular"
        width={'100%'}
        height={'calc(100vh - 120px)'}
      />
    </Grid>
  </Grid>
);
