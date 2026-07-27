import { memo } from 'react';

import { Box } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { Label } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import ThemeModeToggle from '@/components/ThemeModeToggle';

const PreferenceGeneral = memo(() => {
  const styles = preferenceGeneralStyles();

  // Persona options for select

  return (
    <BasicAccordion
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      defaultExpanded
      accordionSX={styles.accordion}
      items={[
        {
          title: 'General',
          content: (
            <Box sx={styles.accordionContent}>
              <Box sx={styles.section}>
                <Label.InfoLabelWithTooltip
                  label="Theme"
                  sx={styles.label}
                />
                <Box sx={styles.themeToggleContainer}>
                  <ThemeModeToggle />
                </Box>
              </Box>
            </Box>
          ),
        },
      ]}
    />
  );
});

PreferenceGeneral.displayName = 'PreferenceGeneral';

/** @type {MuiSx} */
const preferenceGeneralStyles = () => ({
  accordion: {
    background: 'transparent !important',
  },
  accordionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    paddingRight: '1rem',
    marginTop: '0.6rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
  },
  themeToggleContainer: {
    marginTop: '0.5rem',
    paddingLeft: '0.75rem',
  },
  label: {
    paddingLeft: '0.75rem',
  },
  inputSelect: {
    marginTop: '0.25rem',
  },
  inputContainer: {
    padding: '0rem',
    margin: '0rem',
  },
  toggleSection: {
    paddingLeft: '0.75rem',
  },
  toggleLabel: {
    margin: 0,
  },
  optionContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
});

export default PreferenceGeneral;
