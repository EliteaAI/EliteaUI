import { memo, useCallback, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { useCanManageProjectSettings } from '@/[fsd]/features/settings/lib/hooks';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import {
  useEvalDatasetsQuery,
  useProjectDefaultEvalDatasetQuery,
  useSetProjectDefaultEvalDatasetMutation,
} from '@/[fsd]/widgets/evaluation/api';
import { EVAL_PERMISSIONS } from '@/[fsd]/widgets/evaluation/lib/constants';
import { DefaultDatasetSelect } from '@/[fsd]/widgets/evaluation/ui/datasets';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

const DEFAULT_DATASET_TOOLTIP =
  'The scheduled evaluation runs this dataset on agents that have no dataset of their own. Without it, those agents get the platform health check. Only **shared** datasets can be picked, because an agent can only read its own datasets and shared ones.';

const EvaluationSettings = memo(() => {
  const styles = evaluationSettingsStyles();
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const { canManageSettings, isLoading: isLoadingAdmin } = useCanManageProjectSettings();

  const { data: datasets } = useEvalDatasetsQuery({ projectId }, { skip: !projectId });
  const {
    data: current,
    isError: isCurrentError,
    isFetching: isCurrentFetching,
  } = useProjectDefaultEvalDatasetQuery({ projectId }, { skip: !projectId });
  const [setDefault, { isLoading: isSaving }] = useSetProjectDefaultEvalDatasetMutation();

  const shared = useMemo(() => (datasets || []).filter(dataset => dataset.is_shared), [datasets]);

  const onSave = useCallback(
    datasetId => setDefault({ projectId, datasetId }).unwrap(),
    [projectId, setDefault],
  );

  const disabled =
    !checkPermission(PERMISSIONS.projectContext.edit) ||
    !checkPermission(EVAL_PERMISSIONS.datasetRead) ||
    !canManageSettings ||
    // Until the stored value is read, "None" is a placeholder, not something to overwrite.
    isCurrentFetching ||
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
        <DefaultDatasetSelect
          testId="evaluation-default-dataset"
          datasets={shared}
          datasetId={current?.dataset_id ?? null}
          currentName={current?.name}
          noneLabel="None (platform health check)"
          isError={isCurrentError}
          disabled={disabled}
          onSave={onSave}
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
