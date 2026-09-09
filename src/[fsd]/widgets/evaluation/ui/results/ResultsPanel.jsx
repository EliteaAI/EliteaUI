import { memo, useMemo } from 'react';

import { Box, CircularProgress, SvgIcon, Tooltip, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ClockIcon from '@/assets/clock_icon.svg?react';
import DownloadIcon from '@/assets/download.svg?react';
import DeleteIcon from '@/components/Icons/DeleteIcon';

import { isRunTerminal } from '../../lib/helpers';
import EvaluationProgress from '../suite/EvaluationProgress';
import RunResultsView from './RunResultsView';

const ResultsPanel = memo(props => {
  const { runActions = {}, hasSuite = false } = props;

  const {
    applicationId,
    activeRun,
    displayRun,
    runActive,
    cancelRequested,
    versions: applicationVersions = [],
    handleCancelRun: onCancelRun,
    handleOpenHistory: onOpenHistory,
    handleClearResults: onClearResults,
    handleExportResults: onExportResults,
    isExporting = false,
  } = runActions;

  // Progress from active run (for in-progress state)
  const done = activeRun?.progress?.done ?? 0;
  const total = activeRun?.progress?.total ?? 0;
  const percent = total ? Math.min(100, Math.round((done / total) * 100)) : 0;

  // Results from displayRun (active run if in progress, otherwise last run from history)
  const hasResults = isRunTerminal(displayRun?.status);

  const evaluatedVersionName = useMemo(() => {
    const versionId = displayRun?.application_version_id;
    if (versionId == null) return null;
    return applicationVersions.find(version => version.id === versionId)?.name ?? null;
  }, [displayRun?.application_version_id, applicationVersions]);

  const styles = resultsPanelStyles();

  return (
    <Box sx={styles.root}>
      <Box sx={styles.header}>
        <Box sx={styles.headerTitleGroup}>
          <Typography
            variant="bodyMedium"
            sx={styles.headerLabel}
          >
            Results
          </Typography>
          {hasResults && evaluatedVersionName && (
            <Typography
              variant="bodySmall"
              sx={styles.headerVersion}
            >
              Version: {evaluatedVersionName}
            </Typography>
          )}
        </Box>
        <Box sx={styles.headerActions}>
          {hasResults && (
            <>
              <Tooltip
                title="Export to Excel"
                placement="top"
              >
                <Box component="span">
                  <Button.BaseBtn
                    variant={BUTTON_VARIANTS.tertiary}
                    size="small"
                    onClick={onExportResults}
                    disabled={isExporting}
                    sx={styles.actionButton}
                    data-testid="export-results-button"
                    startIcon={
                      isExporting ? (
                        <CircularProgress
                          size={16}
                          sx={styles.actionIcon}
                        />
                      ) : (
                        <SvgIcon
                          component={DownloadIcon}
                          inheritViewBox
                          sx={styles.actionIcon}
                        />
                      )
                    }
                  />
                </Box>
              </Tooltip>
              <Tooltip
                title="Clear the results"
                placement="top"
              >
                <Box component="span">
                  <Button.BaseBtn
                    variant={BUTTON_VARIANTS.tertiary}
                    size="small"
                    onClick={onClearResults}
                    sx={styles.actionButton}
                    startIcon={<DeleteIcon sx={styles.actionIcon} />}
                  />
                </Box>
              </Tooltip>
            </>
          )}
          <Box sx={styles.historyButtonWrapper}>
            <Tooltip
              title="Results History"
              placement="top"
            >
              <Box component="span">
                <Button.BaseBtn
                  variant={BUTTON_VARIANTS.tertiary}
                  size="small"
                  onClick={onOpenHistory}
                  sx={styles.historyButton}
                  startIcon={<ClockIcon sx={styles.actionIcon} />}
                  data-testid="open-results-history-button"
                />
              </Box>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <Box sx={styles.content}>
        {runActive ? (
          <EvaluationProgress
            done={done}
            total={total}
            percent={percent}
            cancelRequested={cancelRequested}
            onCancel={onCancelRun}
          />
        ) : (
          <RunResultsView
            run={hasResults ? displayRun : null}
            applicationId={applicationId}
            hasSuite={hasSuite}
          />
        )}
      </Box>
    </Box>
  );
});

ResultsPanel.displayName = 'ResultsPanel';

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
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
  },
  headerLabel: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  headerVersion: ({ palette }) => ({
    color: palette.text.default,
  }),
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  actionButton: ({ palette }) => ({
    padding: '0.25rem',
    '&:hover svg path': {
      fill: palette.icon.fill.secondary,
    },
  }),
  actionIcon: {
    fontSize: '1rem',
  },
  historyButtonWrapper: ({ palette }) => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginTop: '-0.75rem',
    marginBottom: '-0.75rem',
    paddingLeft: '1rem',
    marginLeft: '0.5rem',

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
    gap: '1rem',
  },
});

export default ResultsPanel;
