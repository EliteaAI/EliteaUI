import { memo, useMemo } from 'react';

import { Box } from '@mui/material';

import { useSkillDetailsQuery } from '@/[fsd]/features/skill/api';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { CopyToClipboardButton } from '@/[fsd]/shared/ui/button';
import { buildForkedEntityHref } from '@/common/utils.jsx';
import { LabelLinkWithToolTip } from '@/components/Fork/LabelLinkWithToolTip.jsx';

const SkillInformation = memo(({ id, versionId, meta }) => {
  const styles = skillInformationStyles();

  const isForked = Boolean(meta?.parent_project_id && meta?.parent_entity_id);

  const { data: originalSkillDetails, error } = useSkillDetailsQuery(
    { projectId: meta?.parent_project_id, skillId: meta?.parent_entity_id },
    { skip: !isForked },
  );

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
                copyMessage="The ID has been copied."
              />
            )}
            {versionId !== null && versionId !== undefined && (
              <CopyToClipboardButton
                label="Version ID:"
                value={String(versionId)}
                tooltip="Copy version ID"
                copyMessage="The Version ID has been copied."
              />
            )}
            {isForked && (
              <LabelLinkWithToolTip
                label="Forked from:"
                value={originalSkillDetails?.name || 'Original skill'}
                tooltip={
                  error?.status !== 403
                    ? 'Go to original skill'
                    : 'You do not have permission to see the original skill'
                }
                disabled={error?.status === 403}
                href={buildForkedEntityHref('skills', meta)}
              />
            )}
          </Box>
        ),
      },
    ],
    [id, styles.content, versionId, isForked, originalSkillDetails?.name, error?.status, meta],
  );

  return (
    <BasicAccordion
      data-testid="skill-information-section"
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
