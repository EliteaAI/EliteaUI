import { memo, useCallback } from 'react';

import { Box, Tooltip, useTheme } from '@mui/material';

import { useCanRunSkill } from '@/[fsd]/features/skill';
import { useRunCatalogSkill } from '@/[fsd]/features/skill-hub/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import PlayIcon from '@/components/Icons/PlayIcon';

const CatalogSkillRunButton = memo(props => {
  const { skill } = props;
  const theme = useTheme();
  const canRunSkill = useCanRunSkill({ isCatalogSkill: true });
  const { runCatalogSkill, isStartingRun } = useRunCatalogSkill();
  const styles = catalogSkillRunButtonStyles();

  const handleRun = useCallback(
    event => {
      event.stopPropagation();
      runCatalogSkill({ skill });
    },
    [runCatalogSkill, skill],
  );

  if (!canRunSkill) return null;

  return (
    <Tooltip
      placement="top"
      title="Run"
    >
      <Box component="span">
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.tertiary}
          startIcon={
            <PlayIcon
              sx={styles.icon}
              fill={theme.palette.icon.secondary}
            />
          }
          aria-label="run skill"
          disabled={isStartingRun}
          onClick={handleRun}
          data-testid="catalog-skill-run-button"
        />
      </Box>
    </Tooltip>
  );
});

CatalogSkillRunButton.displayName = 'CatalogSkillRunButton';

/** @type {MuiSx} */
const catalogSkillRunButtonStyles = () => ({
  icon: {
    fontSize: '1rem',
  },
});

export default CatalogSkillRunButton;
