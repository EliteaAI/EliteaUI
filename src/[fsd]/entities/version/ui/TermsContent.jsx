import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const TermsContent = memo(props => {
  const { sections } = props;
  return (
    <Box sx={styles.termsContent}>
      {sections.map((section, idx) => (
        <Box
          key={idx}
          sx={styles.section}
        >
          <Typography
            variant="bodySmall"
            color="text.secondary"
            sx={{ fontWeight: 700 }}
          >
            {section.heading}
          </Typography>
          {section.lines.map((line, lineIdx) => (
            <Typography
              key={lineIdx}
              variant="bodySmall"
              color="text.secondary"
              sx={line === '' ? { height: '0.5rem' } : undefined}
            >
              {line}
            </Typography>
          ))}
        </Box>
      ))}
    </Box>
  );
});

TermsContent.displayName = 'TermsContent';

/** @type {MuiSx} */
const styles = {
  termsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
};

export default TermsContent;
