import { memo } from 'react';

import { AccordionDetails } from '@mui/material';

const StyledAccordionDetails = memo(props => {
  const { card, sx, ...rest } = props;

  const styles = styledAccordionDetailsStyles(card);

  return (
    <AccordionDetails
      sx={[styles.details, ...(Array.isArray(sx) ? sx : [sx])]}
      {...rest}
    />
  );
});

StyledAccordionDetails.displayName = 'StyledAccordionDetails';

/** @type {MuiSx} */
const styledAccordionDetailsStyles = card => ({
  details: {
    padding: card ? '1rem 0.75rem 0.75rem 2.25rem' : '0 0 0 2.25rem',
    '& .MuiAccordionDetails-root': {
      padding: 0,
    },
  },
});

export default StyledAccordionDetails;
