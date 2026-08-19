import { memo } from 'react';

import { Accordion } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';

const StyledAccordion = memo(props => {
  const { showMode, card, sx, ...rest } = props;

  const styles = styledAccordionStyles(showMode, card);

  return (
    <Accordion
      sx={[styles.accordion, ...(Array.isArray(sx) ? sx : [sx])]}
      {...rest}
    />
  );
});

StyledAccordion.displayName = 'StyledAccordion';

const getSummaryPadding = (showMode, card) => {
  if (card) return '0.5rem 0.75rem';
  return showMode === AccordionConstants.AccordionShowMode.LeftMode ? '0.5rem' : '0 0.75rem';
};

/** @type {MuiSx} */
const styledAccordionStyles = (showMode, card) => ({
  accordion: {
    boxShadow: 'none',
    '& .MuiButtonBase-root.MuiAccordionSummary-root': {
      minHeight: '2.5rem',
      padding: getSummaryPadding(showMode, card),
    },
    '::before': {
      content: 'none',
    },
  },
});

export default StyledAccordion;
