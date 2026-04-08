import { Box } from '@mui/material';

import styled from '@emotion/styled';

export const ActionsContainer = styled(Box)(({ theme }) => ({
  marginTop: '2px',
  padding: '16px 0px 16px 0px',
  borderRadius: ' 0 0 8px 8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  backgroundColor: theme.palette.background.participant.default,
}));

export const ActionRow = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'row',
  padding: '0 36px 0 28px',
  boxSizing: 'border-box',
}));
