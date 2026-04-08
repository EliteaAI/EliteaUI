import { memo } from 'react';

import { AccordionDetails } from '@mui/material';

const StyledAccordionDetails = memo(props => {
  const { sx, ...rest } = props;

  const styles = styledAccordionDetailsStyles();

  return (
    <AccordionDetails
      sx={[styles.details, ...(Array.isArray(sx) ? sx : [sx])]}
      {...rest}
    />
  );
});

StyledAccordionDetails.displayName = 'StyledAccordionDetails';

/** @type {MuiSx} */
const styledAccordionDetailsStyles = () => ({
  details: {
    padding: '0 0 0 2.25rem',
    '& .MuiAccordionDetails-root': {
      padding: 0,
    },
  },
});

export default StyledAccordionDetails;
