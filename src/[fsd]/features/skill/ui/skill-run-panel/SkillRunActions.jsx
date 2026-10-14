import { memo } from 'react';

import { Box, Tooltip, useTheme } from '@mui/material';

import { ChatButton } from '@/[fsd]/features/chat/ui';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import PlusIcon from '@/components/Icons/PlusIcon';

const SkillRunActions = memo(props => {
  const { canStartNewRun, canClearChat, onStartNewRun } = props;
  const theme = useTheme();
  const styles = skillRunActionsStyles();

  return (
    <>
      <Tooltip
        placement="top"
        title="New run"
      >
        <Box component="span">
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            startIcon={
              <PlusIcon
                sx={styles.icon}
                fill={theme.palette.icon.secondary}
              />
            }
            aria-label="new run"
            disabled={!canStartNewRun}
            onClick={onStartNewRun}
            data-testid="skill-run-new-run-button"
          />
        </Box>
      </Tooltip>
      <ChatButton.ClearChatButton
        disabled={!canClearChat}
        onClear={onStartNewRun}
      />
    </>
  );
});

SkillRunActions.displayName = 'SkillRunActions';

/** @type {MuiSx} */
const skillRunActionsStyles = () => ({
  icon: {
    width: '1rem',
    height: '1rem',
    fontSize: '1rem',
  },
});

export default SkillRunActions;
