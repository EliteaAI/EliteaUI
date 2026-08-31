import { memo } from 'react';

import { Box, SvgIcon, Tooltip, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ClockIcon from '@/assets/clock_icon.svg?react';
import MonitoringIcon from '@/assets/monitoring.svg?react';

const ResultsPanel = memo(props => {
  const { onOpenHistory } = props;

  const styles = resultsPanelStyles();

  return (
    <Box sx={styles.root}>
      <Box sx={styles.header}>
        <Typography
          variant="bodyMedium"
          sx={styles.headerLabel}
        >
          Results
        </Typography>
        <Box sx={styles.historyButtonWrapper}>
          <Tooltip
            title="View run history"
            placement="top"
          >
            <Box component="span">
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.tertiary}
                size="small"
                onClick={onOpenHistory}
                sx={styles.historyButton}
                startIcon={<ClockIcon style={{ fontSize: '1rem' }} />}
              />
            </Box>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={styles.content}>
        <Box sx={styles.centered}>
          <SvgIcon
            component={MonitoringIcon}
            inheritViewBox
            sx={styles.emptyIcon}
          />
          <Typography
            variant="headingSmall"
            sx={styles.emptyTitle}
          >
            No results yet.
          </Typography>
          <Typography
            variant="bodyMedium"
            sx={styles.emptyDescription}
          >
            Results will be available after running an evaluation suite.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
});

ResultsPanel.displayName = 'ResultsPanel';

export default ResultsPanel;

/** @type {MuiSx} */
const resultsPanelStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1.5rem',
    height: '3.3125rem',
    minHeight: '3.3125rem',
    boxSizing: 'border-box',
    backgroundColor: palette.background.folder.default,
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  headerLabel: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  historyButtonWrapper: ({ palette }) => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginTop: '-0.75rem',
    marginBottom: '-0.75rem',
    paddingLeft: '1.5rem',

    ':after': {
      content: "''",
      position: 'absolute',
      left: 0,
      top: '-0.75rem',
      height: 'calc(100% + 1.5rem)',
      width: '0.0625rem',
      background: palette.border.table,
    },
  }),
  historyButton: {
    padding: '0.25rem',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '2rem',
  },
  emptyIcon: ({ palette }) => ({
    fontSize: '2rem',
    marginBottom: '0.5rem',
    '& path': {
      fill: palette.icon.fill.disabled,
    },
  }),
  emptyTitle: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  emptyDescription: ({ palette }) => ({
    color: palette.text.default,
    textAlign: 'center',
    maxWidth: '20.5rem',
  }),
});
