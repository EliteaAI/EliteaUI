import { memo, useCallback } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { useProjectContextWindowMode } from '@/[fsd]/features/settings/lib/hooks';
import { AccordionConstants, ContextStrategyConstants } from '@/[fsd]/shared/lib/constants';
import { Button } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { ContextBudgetUI } from '@/[fsd]/widgets/context-budget';

const { CONTEXT_WINDOW_MODES } = ContextStrategyConstants;

const MemoryContextManagement = memo(props => {
  const { onAutoSaveRequested } = props;
  const { values, setFieldValue } = useFormikContext();

  const styles = memoryContextManagementStyles();
  const { mode: projectWindowMode, saving: isProjectModeLoading } = useProjectContextWindowMode();

  const userWindowMode = values.context_window_mode;
  const projectModeLabel = projectWindowMode === CONTEXT_WINDOW_MODES.FULL ? 'Full' : 'Balanced';
  // An empty user mode means "follow the project default", so the radio shows the project default
  const selectedWindowMode = userWindowMode || projectWindowMode;

  const handleWindowModeChange = useCallback(
    mode => {
      setFieldValue('context_window_mode', mode);
      onAutoSaveRequested?.();
    },
    [setFieldValue, onAutoSaveRequested],
  );

  const handleUseProjectDefault = useCallback(() => {
    setFieldValue('context_window_mode', '');
    onAutoSaveRequested?.();
  }, [setFieldValue, onAutoSaveRequested]);

  return (
    <BasicAccordion
      data-testid="context-management-section"
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      defaultExpanded
      accordionSX={styles.accordion}
      items={[
        {
          title: 'Context Management',
          content: (
            <Box sx={styles.accordionContent}>
              <Box sx={styles.windowModeSection}>
                <ContextBudgetUI.ContextWindowRadioGroup
                  value={selectedWindowMode}
                  onChange={handleWindowModeChange}
                  disabled={isProjectModeLoading}
                />
                <Box sx={styles.windowModeFooter}>
                  <Typography variant="bodySmall">
                    {userWindowMode
                      ? 'Default for your new chats. Each chat can switch between Balanced and Full.'
                      : `Follows the default (${projectModeLabel}). Pick a mode to use it for your new chats.`}
                  </Typography>
                  {userWindowMode && (
                    <Button.BaseBtn
                      variant={BUTTON_VARIANTS.text}
                      onClick={handleUseProjectDefault}
                      data-testid="memory-context-window-mode-reset"
                    >
                      Reset to default
                    </Button.BaseBtn>
                  )}
                </Box>
              </Box>
              <ContextBudgetUI.SummarizationSettings onCommit={onAutoSaveRequested} />
            </Box>
          ),
        },
      ]}
    />
  );
});

MemoryContextManagement.displayName = 'MemoryContextManagement';

/** @type {MuiSx} */
const memoryContextManagementStyles = () => ({
  accordion: {
    background: 'transparent !important',
    '& .MuiAccordionDetails-root': {
      paddingTop: '0rem',
    },
  },
  accordionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingRight: '1rem',
  },
  windowModeSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  windowModeFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
});

export default MemoryContextManagement;
