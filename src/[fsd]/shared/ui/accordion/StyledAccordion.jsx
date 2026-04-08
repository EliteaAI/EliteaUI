import { memo } from 'react';

import { Accordion } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';

const StyledAccordion = memo(props => {
  const { showMode, sx, ...rest } = props;

  const styles = styledAccordionStyles(showMode);

  return (
    <Accordion
      sx={[styles.accordion, ...(Array.isArray(sx) ? sx : [sx])]}
      {...rest}
    />
  );
});

StyledAccordion.displayName = 'StyledAccordion';

/** @type {MuiSx} */
const styledAccordionStyles = showMode => ({
  accordion: {
    boxShadow: 'none',
    '& .MuiButtonBase-root.MuiAccordionSummary-root': {
      minHeight: '2.5rem',
      padding: showMode === AccordionConstants.AccordionShowMode.LeftMode ? '0.5rem' : '0 0.75rem',
    },
    '::before': {
      content: 'none',
    },
  },
});

export default StyledAccordion;
