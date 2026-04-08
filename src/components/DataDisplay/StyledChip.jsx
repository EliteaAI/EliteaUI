import { Chip } from '@mui/material';

import { RIGHT_PANEL_WIDTH_OF_CARD_LIST_PAGE } from '@/common/constants';
import { filterProps } from '@/common/utils';
import styled from '@emotion/styled';

const StyledChip = styled(
  Chip,
  filterProps('isSelected'),
)(({ theme, isSelected }) => ({
  maxWidth: `calc(${RIGHT_PANEL_WIDTH_OF_CARD_LIST_PAGE}px - 16px)`,
  margin: '0 0.5rem 0.5rem 0',
  height: '32px',
  borderRadius: '10px',
  border: 'none',
  background: isSelected
    ? theme.palette.mode === 'dark'
      ? '#006DD1'
      : '#6390FE'
    : theme.palette.mode === 'dark'
      ? '#181F2A'
      : '#FAFAFA',
  color: isSelected ? '#FFFFFF' : theme.palette.mode === 'dark' ? '#FFFFFF' : '#0E131D',
  boxShadow: theme.palette.mode === 'light' && !isSelected ? '0px 2px 4px rgba(0, 0, 0, 0.06)' : 'none',
  transition: 'all 0.2s ease-in-out',
  fontFamily: 'Montserrat',
  padding: '8px 16px',

  '& .MuiChip-label': {
    padding: '0',
  },

  '&:hover': {
    background: isSelected
      ? theme.palette.mode === 'dark'
        ? 'rgba(41, 184, 245, 0.4)'
        : '#6EB1FF'
      : theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.2)'
        : 'rgba(61, 68, 86, 0.2)',
    transform: 'none',
  },
}));

export default StyledChip;
