import { memo, useCallback, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import useCheckPermission from '@/hooks/useCheckPermission';

import { useAgentDefaultEvalDatasetQuery, useSetAgentDefaultEvalDatasetMutation } from '../../api';
import { EVAL_PERMISSIONS } from '../../lib/constants';
import { useEvalRoutes } from '../../lib/hooks';
import DefaultDatasetSelect from './DefaultDatasetSelect';

const DEFAULT_DATASET_TOOLTIP =
  'The scheduled evaluation runs this dataset on the agent before any suite, the project default or the platform health check.';

const AgentDefaultDatasetSelect = memo(props => {
  const { projectId, applicationId, datasets = [] } = props;

  const styles = agentDefaultDatasetSelectStyles();
  const { checkPermission } = useCheckPermission();
  // The scheduled evaluation never runs pipelines, so a default would do nothing there
  const { isPipeline } = useEvalRoutes();
  const canRead = checkPermission(EVAL_PERMISSIONS.suiteRead);
  const skip = isPipeline || !canRead || !projectId || !applicationId;

  const {
    data: current,
    isError: isCurrentError,
    isFetching: isCurrentFetching,
  } = useAgentDefaultEvalDatasetQuery({ projectId, agentId: applicationId }, { skip });
  const [setDefault, { isLoading: isSaving }] = useSetAgentDefaultEvalDatasetMutation();

  // Health-check copies are rewritten by the platform; pointing a default at one is meaningless
  const offered = useMemo(() => datasets.filter(dataset => !dataset.meta?.auto_eval_generated), [datasets]);

  const onSave = useCallback(
    datasetId => setDefault({ projectId, agentId: applicationId, datasetId }).unwrap(),
    [projectId, applicationId, setDefault],
  );

  if (skip) return null;

  const disabled =
    !checkPermission(EVAL_PERMISSIONS.suiteUpdate) ||
    // Until the stored value is read, "None" is a placeholder, not something to overwrite.
    isCurrentFetching ||
    isSaving;

  return (
    <Box
      sx={styles.root}
      data-testid="agent-default-dataset-card"
    >
      <Box sx={styles.titleGroup}>
        <Typography
          variant="labelMedium"
          sx={styles.title}
        >
          Scheduled evaluation dataset
        </Typography>
        <InfoTooltip infoTooltip={DEFAULT_DATASET_TOOLTIP} />
      </Box>
      <DefaultDatasetSelect
        testId="agent-default-dataset"
        datasets={offered}
        datasetId={current?.dataset_id ?? null}
        isError={isCurrentError}
        disabled={disabled}
        onSave={onSave}
      />
    </Box>
  );
});

AgentDefaultDatasetSelect.displayName = 'AgentDefaultDatasetSelect';

/** @type {MuiSx} */
const agentDefaultDatasetSelectStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.75rem 1rem 1rem 1.5625rem',
    borderTop: `0.0625rem solid ${palette.border.default}`,
  }),
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
  }),
});

export default AgentDefaultDatasetSelect;
