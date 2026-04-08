import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';

const ProfileLongTermMemory = memo(() => {
  const styles = profileLongTermMemoryStyles();

  return (
    <BasicAccordion
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={styles.accordion}
      items={[
        {
          title: 'Long-term Memory',
          content: (
            <Box sx={styles.accordionContent}>
              <Typography
                variant="bodyMedium"
                color="text.primary"
              >
                Coming soon - Manage what the AI remembers about you across conversations
              </Typography>
            </Box>
          ),
        },
      ]}
    />
  );
});

ProfileLongTermMemory.displayName = 'ProfileLongTermMemory';

/** @type {MuiSx} */
const profileLongTermMemoryStyles = () => ({
  accordion: {
    background: 'transparent !important',
    opacity: 0.5,
  },
  accordionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingRight: '1rem',
  },
});

export default ProfileLongTermMemory;
