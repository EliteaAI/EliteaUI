import { memo, useCallback, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { useCanManageProjectSettings } from '@/[fsd]/features/settings/lib/hooks';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { Select } from '@/[fsd]/shared/ui';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import {
  useEvalDatasetsQuery,
  useProjectDefaultEvalDatasetQuery,
  useSetProjectDefaultEvalDatasetMutation,
} from '@/[fsd]/widgets/evaluation/api';
import { EVAL_PERMISSIONS } from '@/[fsd]/widgets/evaluation/lib/constants';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

const NONE = '__none__';
const DEFAULT_DATASET_TOOLTIP =
  'The scheduled evaluation runs this dataset on agents that have no dataset of their own. Without it, those agents get the platform health check. Only **shared** datasets can be picked, because an agent can only read its own datasets and shared ones.';

const EvaluationSettings = memo(() => {
  const styles = evaluationSettingsStyles();
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const { toastError, toastSuccess } = useToast();
  const { canManageSettings, isLoading: isLoadingAdmin } = useCanManageProjectSettings();

  const { data: datasets } = useEvalDatasetsQuery({ projectId }, { skip: !projectId });
  const { data: current, isError: isCurrentError } = useProjectDefaultEvalDatasetQuery(
    { projectId },
    { skip: !projectId },
  );
  const [setDefault, { isLoading: isSaving }] = useSetProjectDefaultEvalDatasetMutation();

  const datasetId = current?.dataset_id ?? null;

  const options = useMemo(() => {
    const shared = (datasets || [])
      .filter(dataset => dataset.is_shared)
      .map(dataset => ({ value: String(dataset.id), label: dataset.name }));
    if (datasetId != null && !shared.some(option => option.value === String(datasetId))) {
      shared.push({ value: String(datasetId), label: current?.name || `Dataset ${datasetId}` });
    }
    return [{ value: NONE, label: 'None (platform health check)' }, ...shared];
  }, [datasets, datasetId, current?.name]);

  const onChange = useCallback(
    async event => {
      const picked = event.target.value;
      try {
        await setDefault({ projectId, datasetId: picked === NONE ? null : +picked }).unwrap();
        toastSuccess('Saved');
      } catch (error) {
        toastError(error?.data?.error || 'Unable to update the default evaluation dataset');
      }
    },
    [projectId, setDefault, toastError, toastSuccess],
  );

  const disabled =
    !checkPermission(PERMISSIONS.projectContext.edit) ||
    !checkPermission(EVAL_PERMISSIONS.datasetRead) ||
    !canManageSettings ||
    // A failed read must not pass for a stored "None" the user could overwrite.
    isCurrentError ||
    isSaving;

  return (
    <Box
      sx={styles.card}
      data-testid="evaluation-default-dataset-card"
    >
      <Box sx={styles.text}>
        <Box sx={styles.titleGroup}>
          <Typography
            variant="headingSmall"
            color="text.secondary"
          >
            Default dataset
          </Typography>
          <InfoTooltip infoTooltip={DEFAULT_DATASET_TOOLTIP} />
        </Box>
        <Typography
          variant="bodySmall"
          sx={styles.description}
        >
          Used by the scheduled evaluation for agents without a dataset of their own.
        </Typography>
        {isCurrentError && (
          <Typography
            variant="bodySmall"
            color="text.error"
            data-testid="evaluation-default-dataset-error"
          >
            Unable to load the default dataset.
          </Typography>
        )}
        {!isLoadingAdmin && !canManageSettings && (
          <Typography
            variant="bodySmall"
            color="text.secondary"
            data-testid="evaluation-default-dataset-admin-hint"
          >
            Only project admins can change it.
          </Typography>
        )}
      </Box>
      <Box sx={styles.select}>
        <Select.SingleSelect
          data-testid="evaluation-default-dataset"
          options={options}
          value={datasetId != null ? String(datasetId) : NONE}
          onChange={onChange}
          disabled={disabled}
        />
      </Box>
    </Box>
  );
});

EvaluationSettings.displayName = 'EvaluationSettings';

/** @type {MuiSx} */
const evaluationSettingsStyles = () => ({
  card: ({ palette }) => ({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    borderRadius: '0.75rem',
    backgroundColor: palette.background.surface.interactive.default,
    gap: '1rem',
  }),
  text: {
    flex: '999 1 20rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  description: ({ palette }) => ({
    color: palette.text.primary,
  }),
  select: {
    flex: '1 1 15rem',
  },
});

export default EvaluationSettings;
