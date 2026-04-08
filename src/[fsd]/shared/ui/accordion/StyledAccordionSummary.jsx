import { memo } from 'react';

import { AccordionSummary } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';

const StyledAccordionSummary = memo(props => {
  const { showMode, sx, ...rest } = props;

  const styles = styledAccordionSummaryStyles(showMode);

  return (
    <AccordionSummary
      sx={[styles.summary, ...(Array.isArray(sx) ? sx : [sx])]}
      {...rest}
    />
  );
});

StyledAccordionSummary.displayName = 'StyledAccordionSummary';

/** @type {MuiSx} */
const styledAccordionSummaryStyles = showMode => ({
  summary: {
    flexDirection: showMode === AccordionConstants.AccordionShowMode.LeftMode ? 'row-reverse' : undefined,
    '& .MuiAccordionSummary-content': {
      margin: showMode === AccordionConstants.AccordionShowMode.LeftMode ? '0 0 0 0.75rem !important' : '0 0',
    },
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
      transform: 'rotate(90deg)',
    },
  },
});

export default StyledAccordionSummary;
