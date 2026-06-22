import { memo, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { useGetApplicationSkillsQuery } from '@/[fsd]/features/skill/api';
import { MAX_ATTACHED_SKILLS } from '@/[fsd]/features/skill/lib/constants';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import SkillCard from './SkillCard.jsx';
import SkillMenu from './SkillMenu.jsx';

const SKILLS_TITLE = 'Skills';

/**
 * Skills accordion in the agent editor. Lists the skills attached to the current agent
 * version and lets the user attach/detach/change versions. Mirrors ApplicationTools.
 *
 * @param {Object} props
 * @param {string} [props.style]
 * @param {boolean} [props.disabled]
 * @param {string} [props.entityProjectId]
 */
const ApplicationSkills = memo(({ style, disabled, entityProjectId }) => {
  const selectedProjectId = useSelectedProjectId();
  const projectId = entityProjectId || selectedProjectId;
  const { values } = useFormikContext();

  const entityVersionId = values?.version_details?.id;
  const isEntityUnsaved = !values?.id || !entityVersionId;

  const { data: applicationSkills } = useGetApplicationSkillsQuery(
    { projectId, appVersionId: entityVersionId },
    { skip: !projectId || !entityVersionId },
  );

  const skills = useMemo(() => applicationSkills?.skills || [], [applicationSkills?.skills]);
  const maxSkills = applicationSkills?.max_skills ?? MAX_ATTACHED_SKILLS;

  const attachedSkillIds = useMemo(() => skills.map(skill => skill.skill_id), [skills]);
  const isAtLimit = skills.length >= maxSkills;

  return (
    <BasicAccordion
      style={style}
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={styles.accordionStyles}
      items={[
        {
          title: SKILLS_TITLE,
          content: (
            <Box sx={styles.containerStyles}>
              <Box sx={styles.headerRow}>
                {!disabled && (
                  <SkillMenu
                    applicationId={values?.id}
                    entityVersionId={entityVersionId}
                    attachedSkillIds={attachedSkillIds}
                    disabled={isAtLimit}
                    isEntityUnsaved={isEntityUnsaved}
                  />
                )}
                <Typography
                  variant="bodySmall"
                  sx={styles.counter}
                >
                  {skills.length}/{maxSkills} skills added.
                </Typography>
              </Box>

              {skills.map(skill => (
                <SkillCard
                  key={skill.skill_id}
                  skill={skill}
                  entityVersionId={entityVersionId}
                  disabled={disabled}
                />
              ))}
            </Box>
          ),
        },
      ]}
    />
  );
});

ApplicationSkills.displayName = 'ApplicationSkills';

/** @type {MuiSx} */
const styles = {
  accordionStyles: {
    background: theme => `${theme.palette.background.tabPanel} !important`,
  },
  containerStyles: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '1rem',
    margin: '.75rem 0',
  },
  counter: ({ palette }) => ({
    color: palette.text.secondary,
    flexShrink: 0,
  }),
};

export default ApplicationSkills;
