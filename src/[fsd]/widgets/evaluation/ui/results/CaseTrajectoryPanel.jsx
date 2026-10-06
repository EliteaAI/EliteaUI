import { memo, useMemo } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { Accordion } from '@/[fsd]/shared/ui';

import { useEvalCaseExecutionsQuery } from '../../api';
import {
  buildCaseUsageRows,
  formatCaseContent,
  getTrajectoryMetricItems,
  getTrajectoryStateMessage,
  getTrajectoryStepMeta,
  getTrajectoryStepSections,
  getTrajectoryStepTitle,
} from '../../lib/helpers';

const USAGE_COLUMNS = [
  { key: 'label', label: 'Role' },
  { key: 'inputTokens', label: 'Input tokens' },
  { key: 'outputTokens', label: 'Output tokens' },
  { key: 'totalTokens', label: 'Total tokens' },
  { key: 'cost', label: 'Cost' },
];

/**
 * What the agent did on one case of an offline-batch run (#6809 P1): what the agent and the judge
 * spent on it (#6716), the run counters and the ordered LLM and tool steps. Steps a sub-agent ran are indented under the call that started them.
 */
const CaseTrajectoryPanel = memo(props => {
  const { projectId, runId, datasetCaseId } = props;

  const { data, isFetching, isError } = useEvalCaseExecutionsQuery(
    { projectId, runId, datasetCaseId },
    { skip: !projectId || !runId || datasetCaseId == null },
  );

  const execution = data?.executions?.[0] ?? null;
  const steps = execution?.trajectory?.steps ?? [];
  const metricItems = useMemo(() => getTrajectoryMetricItems(execution?.metrics), [execution?.metrics]);
  const usageRows = useMemo(() => buildCaseUsageRows(data?.usage), [data?.usage]);
  const stateMessage = getTrajectoryStateMessage(execution);
  const styles = caseTrajectoryPanelStyles();

  if (isFetching && !data) {
    return (
      <Box sx={styles.centered}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  if (isError) {
    return (
      <Box sx={styles.centered}>
        <Typography variant="bodySmall">Could not load the trajectory for this case.</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={styles.container}
      data-testid="case-trajectory-panel"
    >
      {usageRows.length > 0 && (
        <Box
          sx={styles.usageTable}
          data-testid="case-usage"
        >
          {USAGE_COLUMNS.map(({ key, label }) => (
            <Typography
              key={key}
              variant="labelSmall"
              sx={styles.metricLabel}
            >
              {label}
            </Typography>
          ))}
          {usageRows.map(row => (
            <Box
              key={row.role}
              sx={styles.usageRow}
              data-testid={`case-usage-${row.role}`}
            >
              {USAGE_COLUMNS.map(({ key }) => (
                <Typography
                  key={key}
                  variant="bodySmall"
                  sx={key === 'cost' && row.isUnpriced ? styles.emptyText : undefined}
                >
                  {row[key]}
                </Typography>
              ))}
              {row.note && (
                <Typography
                  variant="bodySmall"
                  sx={[styles.usageNote, !row.isRecorded && styles.emptyText]}
                >
                  {row.note}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}

      {metricItems.length > 0 && (
        <Box sx={styles.metrics}>
          {metricItems.map(({ label, value }) => (
            <Box
              key={label}
              sx={styles.metric}
            >
              <Typography
                variant="labelSmall"
                sx={styles.metricLabel}
              >
                {label}
              </Typography>
              <Typography variant="bodySmall">{value}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {stateMessage ? (
        <Typography
          variant="bodySmall"
          sx={styles.emptyText}
        >
          {stateMessage}
        </Typography>
      ) : steps.length === 0 ? (
        <Typography
          variant="bodySmall"
          sx={styles.emptyText}
        >
          The agent answered without calling the model or any tools.
        </Typography>
      ) : (
        <Box sx={styles.steps}>
          {execution?.trajectory?.truncated && (
            <Typography
              variant="bodySmall"
              sx={styles.emptyText}
            >
              This trajectory was shortened to fit the storage limit; late payloads may be missing.
            </Typography>
          )}
          {steps.map(step => (
            <Accordion.BasicAccordion
              key={step.i}
              defaultExpanded={false}
              uppercase={false}
              style={step.parent_agent ? styles.childStep : undefined}
              data-testid={`trajectory-step-${step.i}`}
              items={[
                {
                  title: getTrajectoryStepTitle(step),
                  headerContent: (
                    <Typography
                      variant="bodySmall"
                      sx={[styles.stepMeta, step.status === 'error' && styles.stepError]}
                    >
                      {[step.parent_agent && `in ${step.parent_agent}`, getTrajectoryStepMeta(step)]
                        .filter(Boolean)
                        .join(' · ')}
                    </Typography>
                  ),
                  content: <StepSections step={step} />,
                },
              ]}
            />
          ))}
        </Box>
      )}
    </Box>
  );
});

CaseTrajectoryPanel.displayName = 'CaseTrajectoryPanel';

const StepSections = memo(({ step }) => {
  const sections = getTrajectoryStepSections(step);
  const styles = caseTrajectoryPanelStyles();
  if (!sections.length) {
    return (
      <Typography
        variant="bodySmall"
        sx={styles.emptyText}
      >
        No payload recorded for this step.
      </Typography>
    );
  }
  return sections.map(({ label, content }) => (
    <Box
      key={label}
      sx={styles.section}
    >
      <Typography
        variant="labelSmall"
        sx={styles.metricLabel}
      >
        {label}
      </Typography>
      <Typography
        variant="bodySmall"
        component="pre"
        sx={styles.pre}
      >
        {formatCaseContent(content)}
      </Typography>
    </Box>
  ));
});

StepSections.displayName = 'StepSections';

/** @type {MuiSx} */
const caseTrajectoryPanelStyles = () => ({
  container: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    padding: '0.75rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  centered: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  usageTable: {
    display: 'grid',
    gridTemplateColumns: 'minmax(4rem, 1fr) repeat(4, minmax(0, 1fr))',
    columnGap: '1rem',
    rowGap: '0.25rem',
  },
  usageRow: {
    display: 'contents',
  },
  usageNote: ({ palette }) => ({
    gridColumn: '1 / -1',
    color: palette.text.secondary,
  }),
  metrics: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem 1.5rem',
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
  },
  metricLabel: ({ palette }) => ({
    color: palette.text.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }),
  steps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  childStep: ({ palette }) => ({
    marginLeft: '1.5rem',
    borderLeft: `0.125rem solid ${palette.border.lines}`,
    paddingLeft: '0.5rem',
  }),
  stepMeta: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  stepError: ({ palette }) => ({
    color: palette.error.main,
  }),
  section: {
    marginBottom: '0.75rem',
  },
  pre: ({ palette }) => ({
    color: palette.text.secondary,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
    fontFamily: 'inherit',
    fontSize: '0.875rem',
    lineHeight: 1.5,
  }),
  emptyText: ({ palette }) => ({
    color: palette.text.primary,
    fontStyle: 'italic',
  }),
});

export default CaseTrajectoryPanel;
