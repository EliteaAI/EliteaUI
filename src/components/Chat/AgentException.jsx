import { useCallback, useState } from 'react';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Typography } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import {
  StyledAccordion,
  StyledAccordionDetails,
  StyledAccordionSummary,
  StyledExpandMoreIcon,
} from '@/[fsd]/shared/ui/accordion';
import { useTheme } from '@emotion/react';

export default function AgentException({ exception, defaultExpanded = false, title = 'Agent Exception' }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const theme = useTheme();
  const onExpanded = useCallback((_, value) => {
    setExpanded(value);
  }, []);

  return (
    <StyledAccordion
      showMode={AccordionConstants.AccordionShowMode.RightMode}
      defaultExpanded={defaultExpanded}
      expanded={expanded}
      onChange={onExpanded}
      sx={{
        '&.Mui-expanded': {
          margin: '0px 0;',
        },
        background: `transparent !important`,
        borderBottom: `1px solid ${theme.palette.border.lines}`,
      }}
      slotProps={{ transition: { unmountOnExit: true } }}
    >
      <StyledAccordionSummary
        expandIcon={<StyledExpandMoreIcon sx={{ width: '14px', height: '14px' }} />}
        aria-controls={'panel-content'}
        showMode={AccordionConstants.AccordionShowMode.RightMode}
        sx={{
          '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
            transform: 'rotate(180deg)',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
          <ErrorOutlineIcon sx={{ width: '16px', height: '16px', color: theme.palette.status.rejected }} />
          <Typography
            variant="bodyMedium"
            sx={{ color: theme.palette.status.rejected }}
          >
            {title}
          </Typography>
        </Box>
      </StyledAccordionSummary>
      <StyledAccordionDetails
        sx={{
          paddingBottom: '16px',
          paddingLeft: '12px',
          gap: '12px',
        }}
      >
        <Typography
          variant="bodyMedium"
          sx={{ color: theme.palette.text.secondary }}
        >
          {exception}
        </Typography>
      </StyledAccordionDetails>
    </StyledAccordion>
  );
}
