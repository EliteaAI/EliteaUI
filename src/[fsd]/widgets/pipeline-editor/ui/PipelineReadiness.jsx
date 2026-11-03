import { memo } from 'react';

import { useFormikContext } from 'formik';

import GovernanceReadinessCard from '@/[fsd]/features/project-governance/ui/GovernanceReadinessCard';

// (#7269) the Save card of a pipeline: what its version still needs to run governed, above the editor
const PipelineReadiness = memo(() => {
  const { values } = useFormikContext();
  const styles = pipelineReadinessStyles();

  return (
    <GovernanceReadinessCard
      entityKind="version"
      entityId={values?.version_details?.id}
      testId="pipeline-governance-readiness"
      sx={styles.card}
    />
  );
});

PipelineReadiness.displayName = 'PipelineReadiness';

/** @type {MuiSx} */
const pipelineReadinessStyles = () => ({
  card: {
    margin: '0.5rem 1rem',
  },
});

export default PipelineReadiness;
