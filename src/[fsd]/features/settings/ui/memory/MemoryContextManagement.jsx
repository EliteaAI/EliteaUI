import { memo, useCallback } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { useProjectContextWindowMode } from '@/[fsd]/features/settings/lib/hooks';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { ContextBudgetUI } from '@/[fsd]/widgets/context-budget';

const MemoryContextManagement = memo(props => {
  const { onAutoSaveRequested } = props;
  const { values, setFieldValue } = useFormikContext();

  const styles = memoryContextManagementStyles();
  const { mode: projectWindowMode, saving: isProjectModeLoading } = useProjectContextWindowMode();

  // An empty user mode means "follow the project default", so the radio shows the project default
  const selectedWindowMode = values.context_window_mode || projectWindowMode;

  const handleWindowModeChange = useCallback(
    mode => {
      setFieldValue('context_window_mode', mode);
      onAutoSaveRequested?.();
    },
    [setFieldValue, onAutoSaveRequested],
  );

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
              <ContextBudgetUI.ContextWindowRadioGroup
                value={selectedWindowMode}
                onChange={handleWindowModeChange}
                disabled={isProjectModeLoading}
              />
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
});

export default MemoryContextManagement;
