import { memo } from 'react';

import { Box, Divider, Typography } from '@mui/material';

import { hasRunAnalytics } from '@/[fsd]/entities/run-history/lib/helpers';
import { ScheduleRunStatusChip } from '@/[fsd]/features/schedule';
import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import AnalyticsIcon from '@/assets/analytics-icon.svg?react';
import ArrowLeftIcon from '@/assets/arrow-left-icon.svg?react';
import ArrowRightIcon from '@/assets/arrow-right-icon.svg?react';
import DotMenu from '@/components/DotMenu';
import CloseIcon from '@/components/Icons/CloseIcon';

import { RunHistoryDeleteModal, useRunHistoryRowMenu } from './run-history-list/RunHistoryRowActions';

// The run header's ⋯ menu: always visible, with the same items and Remove run? dialog as the row menu
const RunMenu = memo(props => {
  const menu = useRunHistoryRowMenu(props);
  const { menuItems, slotProps, openMenu, closeMenu, deleteModal } = menu;

  if (!menuItems.length) return null;

  return (
    <>
      <DotMenu
        id="run-view-menu"
        slotProps={slotProps}
        onClose={closeMenu}
        onShowMenuList={openMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {menuItems}
      </DotMenu>
      <RunHistoryDeleteModal {...deleteModal} />
    </>
  );
});

RunMenu.displayName = 'RunMenu';

// The open run in place of the run history table (ticket AC-13): the title row with ‹ › and X, the status line,
// and the conversation (the detail is the existing RunHistoryChat, passed in)
const RunHistoryRunView = memo(props => {
  const {
    runDate,
    selectedRow,
    openRunIndex,
    totalRuns,
    detail,
    source,
    onPrevious,
    onNext,
    onCloseRun,
    handleRestoreConversation,
    shareOpensHistoryTab,
    handleOpenAnalytics,
  } = props;
  const styles = runHistoryRunViewStyles();

  return (
    <Box sx={styles.root}>
      <Box
        data-testid="run-history-run-view"
        role="region"
        aria-label={`Run ${runDate}`}
        sx={styles.runView}
      >
        <Box
          data-testid="run-history-run-header"
          sx={styles.runHeader}
        >
          <Box sx={styles.runNav}>
            <Typography
              variant="headingMedium"
              color="text.secondary"
            >
              {runDate}
            </Typography>
            <BaseBtn
              data-testid="run-history-run-prev-button"
              variant={BUTTON_VARIANTS.secondary}
              aria-label="previous run"
              disabled={openRunIndex <= 0}
              onClick={onPrevious}
              startIcon={<ArrowLeftIcon sx={styles.iconClose} />}
            />
            <Typography variant="bodySmall">{`${openRunIndex + 1} of ${totalRuns}`}</Typography>
            <BaseBtn
              data-testid="run-history-run-next-button"
              variant={BUTTON_VARIANTS.secondary}
              aria-label="next run"
              disabled={openRunIndex >= totalRuns - 1}
              onClick={onNext}
              startIcon={<ArrowRightIcon sx={styles.iconClose} />}
            />
          </Box>
          <Box sx={styles.runActions}>
            {selectedRow && handleOpenAnalytics && hasRunAnalytics(selectedRow) && (
              <BaseBtn
                data-testid="run-history-run-analytics-button"
                variant={BUTTON_VARIANTS.secondary}
                startIcon={<AnalyticsIcon />}
                onClick={() => handleOpenAnalytics(selectedRow.id)}
              >
                Analytics
              </BaseBtn>
            )}
            {selectedRow && (
              <RunMenu
                item={selectedRow}
                source={source}
                onItemSelect={onCloseRun}
                handleRestoreConversation={handleRestoreConversation}
                shareOpensHistoryTab={shareOpensHistoryTab}
              />
            )}
            <Divider
              orientation="vertical"
              flexItem
            />
            <BaseBtn
              data-testid="run-history-run-close-button"
              variant={BUTTON_VARIANTS.secondary}
              aria-label="close run"
              onClick={onCloseRun}
              startIcon={<CloseIcon sx={styles.iconClose} />}
            />
          </Box>
        </Box>
        <Box
          data-testid="run-history-run-meta"
          sx={styles.runMeta}
        >
          {selectedRow?.run_status || selectedRow?.schedule_run?.status ? (
            <ScheduleRunStatusChip
              status={selectedRow.schedule_run?.status ?? selectedRow.run_status}
              variant="text"
            />
          ) : null}
          {selectedRow?.event_label ? (
            <Box sx={styles.metaItem}>
              <Typography
                variant="labelSmall"
                color="text.primary"
              >
                Event
              </Typography>
              <Typography
                variant="bodySmall"
                color="text.secondary"
              >
                {selectedRow.event_label}
              </Typography>
            </Box>
          ) : null}
          {selectedRow?.version_name ? (
            <Box sx={styles.metaItem}>
              <Typography
                variant="labelSmall"
                color="text.primary"
              >
                Version
              </Typography>
              <Typography
                variant="bodySmall"
                color="text.secondary"
              >
                {selectedRow.version_name}
              </Typography>
            </Box>
          ) : null}
          {selectedRow?.duration != null ? (
            <Box sx={styles.metaItem}>
              <Typography
                variant="labelSmall"
                color="text.primary"
              >
                Duration
              </Typography>
              <Typography
                variant="bodySmall"
                color="text.secondary"
              >{`${selectedRow.duration} s`}</Typography>
            </Box>
          ) : null}
        </Box>
      </Box>
      <Box sx={styles.runBody}>{detail}</Box>
    </Box>
  );
});

RunHistoryRunView.displayName = 'RunHistoryRunView';

/** @type {MuiSx} */
const runHistoryRunViewStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    gap: '1.5rem',
  },
  runView: {
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  runHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    flexShrink: 0,
  },
  runNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  runActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  runMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.75rem',
  },
  // Each subtitle item: the label in the secondary colour, the value in the primary colour (the design)
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  runBody: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  iconClose: {
    fontSize: '1.25rem',
    width: '1.25rem',
    height: '1.25rem',
  },
});

export default RunHistoryRunView;
