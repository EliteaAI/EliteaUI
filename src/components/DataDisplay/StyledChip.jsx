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
    ? theme.palette.background.tagChip.active.default
    : theme.palette.background.tagChip.default,
  color: isSelected
    ? theme.palette.text.tagChip.active
    : theme.palette.text.tagChip.default,
  boxShadow:
    theme.palette.mode === 'light' && !isSelected
      ? '0px 2px 4px rgba(0, 0, 0, 0.12)'
      : 'none',
  fontFamily: 'Montserrat',
  padding: '8px 16px',

  '& .MuiChip-label': {
    padding: '0',
  },

  '&:hover': {
    background: isSelected
      ? theme.palette.background.tagChip.active.hover
      : theme.palette.background.tagChip.hover,
  },
}));

export default StyledChip;
