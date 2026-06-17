import { memo, useMemo } from 'react';

import { Box } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { CopyToClipboardButton } from '@/[fsd]/shared/ui/button';

const SkillInformation = memo(({ id, versionId }) => {
  const styles = skillInformationStyles();

  const items = useMemo(
    () => [
      {
        title: 'Information',
        content: (
          <Box sx={styles.content}>
            {id !== null && id !== undefined && (
              <CopyToClipboardButton
                label="Skill ID:"
                value={String(id)}
                tooltip="Copy ID"
                copyMessage="The ID has been copied to the clipboard"
              />
            )}
            {versionId !== null && versionId !== undefined && (
              <CopyToClipboardButton
                label="Version ID:"
                value={String(versionId)}
                tooltip="Copy version ID"
                copyMessage="The version ID has been copied to the clipboard"
              />
            )}
          </Box>
        ),
      },
    ],
    [id, styles.content, versionId],
  );

  return (
    <BasicAccordion
      accordionSX={({ palette }) => ({ background: `${palette.background.tabPanel} !important` })}
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      items={items}
    />
  );
});

SkillInformation.displayName = 'SkillInformation';

/** @type {MuiSx} */
const skillInformationStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.5rem',
    paddingBottom: '1.5rem',
  },
});

export default SkillInformation;
