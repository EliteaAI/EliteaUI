import { forwardRef, memo } from 'react';

import { Box } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';

import ScheduleRunList from './ScheduleRunList';

// The Runs table under the test panel of the Edit schedule page (owner CR 2026-10-21, CR-21)
const ScheduleRunsSection = memo(
  forwardRef((props, ref) => {
    const { runs, versionNames, selectedRunId, onOpen, expanded, onExpandedChange } = props;

    const styles = scheduleRunsSectionStyles();

    return (
      <Box
        ref={ref}
        id="runs"
        tabIndex={-1}
        sx={styles.root}
      >
        <BasicAccordion
          showMode={AccordionConstants.AccordionShowMode.LeftMode}
          accordionSX={styles.accordion}
          expanded={expanded}
          onChange={(_, isExpanded) => onExpandedChange(isExpanded)}
          items={[
            {
              title: 'RUNS OF THIS SCHEDULE',
              testId: 'schedule-section-runs',
              content: (
                <ScheduleRunList
                  runs={runs}
                  versionNames={versionNames}
                  selectedRunId={selectedRunId}
                  onOpen={onOpen}
                />
              ),
            },
          ]}
        />
      </Box>
    );
  }),
);

ScheduleRunsSection.displayName = 'ScheduleRunsSection';

/** @type {MuiSx} */
const scheduleRunsSectionStyles = () => ({
  root: { margin: '1.5rem auto 0', maxWidth: '43.75rem', scrollMarginTop: '1rem', outline: 'none' },
  // The same section surface as the form sections above it
  accordion: ({ palette }) => ({ background: `${palette.background.default.tertiary} !important` }),
});

export default ScheduleRunsSection;
