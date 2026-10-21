import { forwardRef, memo } from 'react';

import { Box } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';

import ScheduleRunList from './ScheduleRunList';

// The Runs table as the last section of the Edit schedule form column (owner CR 2026-10-21 test panel log)
const ScheduleRunsSection = memo(
  forwardRef((props, ref) => {
    const { runs, versionNames, selectedRunId, onOpen, expanded, onExpandedChange } = props;

    const styles = scheduleRunsSectionStyles();

    return (
      <Box
        ref={ref}
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
  root: { margin: '0 auto', maxWidth: '43.75rem', scrollMarginTop: '1rem' },
  // The same section surface as the form sections above it
  accordion: ({ palette }) => ({ background: `${palette.background.default.tertiary} !important` }),
});

export default ScheduleRunsSection;
