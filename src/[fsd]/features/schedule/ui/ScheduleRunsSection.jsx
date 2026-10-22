import { forwardRef, memo, useCallback, useState } from 'react';

import { Link as RouterLink } from 'react-router-dom';

import { Box, Link, MenuItem, Select, Typography } from '@mui/material';

import { AccordionConstants, TextLinkConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import BannerMessage from '@/[fsd]/shared/ui/banner-message/BannerMessage';

import { VISUALLY_HIDDEN } from '../lib/constants';
import ScheduleRunList, { RUN_SORT_OPTIONS } from './ScheduleRunList';

// The page header (3.75 rem) and 0.75 rem, so a scroll to the card does not hide its top under the header
const SCROLL_MARGIN_TOP = '4.5rem';

/**
 * "Runs of this schedule" under the test panel of the Edit schedule page (CR-21): a collapsible card with
 * a Sort select, the two-line run rows, a polite live region for the shown run and the unknown-run note.
 */
const ScheduleRunsSection = memo(
  forwardRef((props, ref) => {
    const {
      runs,
      total,
      versionNames,
      selectedRunId,
      onOpen,
      expanded,
      onExpandedChange,
      announcement = '',
      runNotFound = false,
      fullHistoryLink,
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
              // The count sits right after the title (spec "RUNS OF THIS SCHEDULE 6"); the Sort select is at the right
              title: (
                <>
                  RUNS OF THIS SCHEDULE
                  {Number.isFinite(total) && (
                    <Box
                      component="span"
                      data-testid="schedule-runs-count"
                      sx={styles.count}
                    >
                      {total}
                    </Box>
                  )}
                </>
              ),
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
                  {fullHistoryLink && (
                    // CR-22 (US-32 R6.3): all runs of this schedule in the entity History
                    <Link
                      component={RouterLink}
                      to={fullHistoryLink}
                      variant="bodyMedium"
                      sx={[TextLinkConstants.TEXT_LINK_SX, styles.fullHistory]}
                    >
                      Open full history
                    </Link>
                  )}
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
  fullHistory: {
    alignSelf: 'flex-start',
    flexShrink: 0,
    padding: '0.5rem 1rem 0',
  },
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
  // The run total of the query, after the title: a page holds fewer rows than the schedule may have
  count: ({ palette }) => ({ marginLeft: '1rem', color: palette.text.secondary, textTransform: 'none' }),
  // The summary action sits right of the title; the Select keeps a 1.875 rem box
  sort: { minWidth: '8rem', height: '1.875rem', fontSize: '0.75rem', marginRight: '0.5rem' },
});

export default ScheduleRunsSection;
