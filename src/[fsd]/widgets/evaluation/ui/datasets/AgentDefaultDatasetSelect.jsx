import { memo, useCallback, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { useToast } from '@/[fsd]/shared/lib/hooks';
import { Select } from '@/[fsd]/shared/ui';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import useCheckPermission from '@/hooks/useCheckPermission';
import RouteDefinitions from '@/routes';

import { useAgentDefaultEvalDatasetQuery, useSetAgentDefaultEvalDatasetMutation } from '../../api';
import { EVAL_PERMISSIONS } from '../../lib/constants';
import { useEvalRoutes } from '../../lib/hooks';

const NONE = '__none__';
const DEFAULT_DATASET_TOOLTIP =
  'The scheduled evaluation runs this dataset on the agent before any suite, the project default or the platform health check.';

const AgentDefaultDatasetSelect = memo(props => {
  const { projectId, applicationId, datasets = [] } = props;

  const styles = agentDefaultDatasetSelectStyles();
  const { checkPermission } = useCheckPermission();
  const { toastError, toastSuccess } = useToast();
  // The scheduled evaluation never runs pipelines, so a default would do nothing there
  const isPipeline = useEvalRoutes().evaluate === RouteDefinitions.PipelineEvaluate;
  const canRead = checkPermission(EVAL_PERMISSIONS.suiteRead);
  const skip = isPipeline || !canRead || !projectId || !applicationId;

  const {
    data: current,
    isError: isCurrentError,
    isFetching: isCurrentFetching,
  } = useAgentDefaultEvalDatasetQuery({ projectId, agentId: applicationId }, { skip });
  const [setDefault, { isLoading: isSaving }] = useSetAgentDefaultEvalDatasetMutation();

  const datasetId = current?.dataset_id ?? null;

  const options = useMemo(() => {
    const listed = datasets
      // Health-check copies are rewritten by the platform; pointing a default at one is meaningless
      .filter(dataset => !dataset.meta?.auto_eval_generated)
      .map(dataset => ({ value: String(dataset.id), label: dataset.name }));
    if (datasetId != null && !listed.some(option => option.value === String(datasetId))) {
      listed.push({ value: String(datasetId), label: `Dataset ${datasetId}` });
    }
    return [{ value: NONE, label: 'None' }, ...listed];
  }, [datasets, datasetId]);

  const onChange = useCallback(
    async event => {
      const picked = event.target.value;
      try {
        await setDefault({
          projectId,
          agentId: applicationId,
          datasetId: picked === NONE ? null : +picked,
        }).unwrap();
        toastSuccess('Saved');
      } catch (error) {
        toastError(error?.data?.error || 'Unable to update the default evaluation dataset');
      }
    },
    [projectId, applicationId, setDefault, toastError, toastSuccess],
  );

  if (skip) return null;

  const disabled =
    !checkPermission(EVAL_PERMISSIONS.suiteUpdate) ||
    // Until the stored value is read, "None" is a placeholder, not something to overwrite.
    isCurrentFetching ||
    // A failed read must not pass for a stored "None" the user could overwrite.
    isCurrentError ||
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
      <Select.SingleSelect
        data-testid="agent-default-dataset"
        options={options}
        value={datasetId != null ? String(datasetId) : NONE}
        onChange={onChange}
        disabled={disabled}
      />
      {isCurrentError && (
        <Typography
          variant="bodySmall"
          color="text.error"
          data-testid="agent-default-dataset-error"
        >
          Unable to load the default dataset.
        </Typography>
      )}
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
