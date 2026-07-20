import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import DrawerPageHeader from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import SparkleIcon from '@/assets/ai-sparkle-icon.svg?react';
import ContextIcon from '@/assets/context.svg?react';

const ProjectContextEmptyState = memo(props => {
  const { canEdit, onNavigate } = props;
  const styles = getStyles();

  return (
    <Box sx={styles.root}>
      <DrawerPageHeader
        title="Project Context"
        showBorder
      />
      <Box sx={styles.body}>
        <ContextIcon sx={styles.image} />
        <Typography
          variant="headingSmall"
          sx={styles.title}
        >
          Still no Project Context
        </Typography>
        <Typography sx={styles.description}>
          {canEdit
            ? 'Let’s create project-specific background information that the AI will use to generate more accurate and relevant responses, tailored to your workflows, data, and goals.'
            : 'Project Context has not been set up yet. Contact your project admin to configure it.'}
        </Typography>
        {canEdit && (
          <Box sx={styles.actions}>
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.elitea}
              onClick={() => onNavigate('create')}
            >
              Create
            </Button.BaseBtn>
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.special}
              startIcon={<SparkleIcon />}
              onClick={() => onNavigate('create', { openAi: true })}
            >
              Build with AI
            </Button.BaseBtn>
          </Box>
        )}
      </Box>
    </Box>
  );
});

ProjectContextEmptyState.displayName = 'ProjectContextEmptyState';
export default ProjectContextEmptyState;

/** @type {MuiSx} */
const getStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    gap: '1.5rem',
    padding: '1.5rem 0 0 0',
    textAlign: 'center',
  },
  image: {
    width: '2.5rem',
    height: '2.5rem',
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '1.125rem',
    fontWeight: 600,
  }),
  description: ({ palette }) => ({
    color: palette.background.tooltip.default,
    fontSize: '0.875rem',
    lineHeight: 1.5,
    maxWidth: '30rem',
  }),
  actions: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.75rem',
    mt: '0.5rem',
  },
});
