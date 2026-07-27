import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import ChipSkillIcon from '@/assets/skill-icon.svg?react';
import EliteAImage from '@/components/EliteAImage';

const AppliedSkills = memo(({ skills = [] }) => {
  const named = skills.filter(skill => typeof skill?.name === 'string' && skill.name.trim());

  if (!named.length) return null;

  return (
    <Box sx={appliedSkillsStyles.container}>
      {named.map(skill => (
        <Box
          key={skill.name.trim().toLowerCase()}
          sx={appliedSkillsStyles.chip}
        >
          {skill.icon_meta?.url ? (
            <EliteAImage
              style={appliedSkillsStyles.customIcon}
              image={skill.icon_meta}
              alt={skill.name}
            />
          ) : (
            <ChipSkillIcon
              width="14"
              height="14"
            />
          )}
          <Typography
            variant="bodySmall"
            sx={appliedSkillsStyles.label}
          >
            {`Skill: ${skill.name}`}
          </Typography>
        </Box>
      ))}
    </Box>
  );
});

AppliedSkills.displayName = 'AppliedSkills';

/** @type {MuiSx} */
const appliedSkillsStyles = {
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  chip: ({ palette }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    maxWidth: '100%',
    padding: '0.125rem 0.5rem',
    borderRadius: '0.75rem',
    border: `1px solid ${palette.border.lines}`,
    color: palette.text.secondary,
  }),
  customIcon: {
    width: '0.875rem',
    height: '0.875rem',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  label: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flexShrink: 1,
    minWidth: 0,
    color: 'inherit',
  },
};

export default AppliedSkills;
