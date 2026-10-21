import { forwardRef, memo, useCallback, useState } from 'react';

import { Box, MenuItem, Select, Typography } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import BannerMessage from '@/[fsd]/shared/ui/banner-message/BannerMessage';

import ScheduleRunList, { RUN_SORT_OPTIONS } from './ScheduleRunList';

// The page header (3.75 rem) and 0.75 rem, so a scroll to the card does not hide its top under the header
const SCROLL_MARGIN_TOP = '4.5rem';
// Read by screen readers only; the same rule as the MUI utils visuallyHidden, which @mui/material does not export
const VISUALLY_HIDDEN = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
};

/**
 * "Runs of this schedule" under the test panel of the Edit schedule page (CR-21): a collapsible card with
 * a Sort select, the two-line run rows, a polite live region for the shown run and the unknown-run note.
 */
const ScheduleRunsSection = memo(
  forwardRef((props, ref) => {
    const {
      runs,
      versionNames,
      selectedRunId,
      onOpen,
      expanded,
      onExpandedChange,
      announcement = '',
      runNotFound = false,
    } = props;

    const [sort, setSort] = useState(RUN_SORT_OPTIONS[0].value);
    const handleSortChange = useCallback(event => setSort(event.target.value), []);

    const styles = scheduleRunsSectionStyles();

    return (
      <Box
        ref={ref}
        id="runs"
        role="region"
        aria-label="Runs of this schedule"
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
              summaryAction: runs.length > 0 && (
                <Select
                  size="small"
                  value={sort}
                  onChange={handleSortChange}
                  SelectDisplayProps={{ 'aria-label': 'Sort runs' }}
                  renderValue={value =>
                    `Sort: ${RUN_SORT_OPTIONS.find(option => option.value === value).label}`
                  }
                  sx={styles.sort}
                >
                  {RUN_SORT_OPTIONS.map(option => (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              ),
              content: (
                <>
                  {runNotFound && (
                    <BannerMessage variant="info">
                      <Typography variant="bodySmall">That run is not in the list.</Typography>
                    </BannerMessage>
                  )}
                  <Box sx={styles.list}>
                    <ScheduleRunList
                      runs={runs}
                      versionNames={versionNames}
                      selectedRunId={selectedRunId}
                      sort={sort}
                      onOpen={onOpen}
                    />
                  </Box>
                </>
              ),
            },
          ]}
        />
        <Box
          role="status"
          aria-live="polite"
          sx={VISUALLY_HIDDEN}
        >
          {announcement}
        </Box>
      </Box>
    );
  }),
);

ScheduleRunsSection.displayName = 'ScheduleRunsSection';

/** @type {MuiSx} */
const scheduleRunsSectionStyles = () => ({
  root: ({ palette }) => ({
    flex: '0 1 auto',
    minHeight: 0,
    scrollMarginTop: SCROLL_MARGIN_TOP,
    outline: 'none',
    borderRadius: '1rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.default.tertiary,
    overflow: 'hidden',
  }),
  accordion: ({ palette }) => ({ background: `${palette.background.default.tertiary} !important` }),
  // 24 rem is six rows; from xl the block is sticky, and the list takes 40 % of its height minus the header
  list: ({ breakpoints }) => ({
    maxHeight: '24rem',
    overflowY: 'auto',
    [`${breakpoints.up('xl')} and (min-height: 46rem)`]: {
      maxHeight: 'calc((100dvh - 6rem) * 0.4 - 3.5rem)',
    },
  }),
  // The summary action sits right of the title; the Select keeps a 1.875 rem box
  sort: { minWidth: '8rem', height: '1.875rem', fontSize: '0.75rem', marginRight: '0.5rem' },
});

export default ScheduleRunsSection;
