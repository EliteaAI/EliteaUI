import { memo, useCallback } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { useFormikAutoSaveOnBlur, useIsMidturnInjectionAvailable } from '@/[fsd]/shared/lib/hooks';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

import EnableToggleCard from '../project-context/EnableToggleCard';

// Tier 2 of the feature gate. Tier 1 (platform admin) decides which projects see this
// card at all; the stored preference is per-user, so it follows the user across every
// project the platform has enabled — same shape as Agent & Pipeline Builder.
const MidturnInjection = memo(() => {
  const { checkPermission } = useCheckPermission();
  const canViewProjectContext = checkPermission(PERMISSIONS.projectContext.view);
  const canEditProjectContext = checkPermission(PERMISSIONS.projectContext.edit);

  const isAvailableOnPlatform = useIsMidturnInjectionAvailable();

  const { values, setFieldValue } = useFormikContext();
  const { onBlur, requestSubmit } = useFormikAutoSaveOnBlur();

  const handleToggle = useCallback(
    (event, checkedValue) => {
      if (!canEditProjectContext) return;
      setFieldValue('midturn_injection_enabled', checkedValue);
      requestSubmit();
    },
    [canEditProjectContext, setFieldValue, requestSubmit],
  );

  const styles = componentStyles();

  // Hidden rather than disabled when the platform hasn't enabled this project: a dead
  // toggle invites support questions about a feature that isn't on offer here.
  if (!canViewProjectContext || !isAvailableOnPlatform) {
    return null;
  }

  return (
    <Box
      sx={styles.body}
      onBlur={onBlur}
    >
      <EnableToggleCard
        enabled={values.midturn_injection_enabled}
        onToggle={handleToggle}
        disabled={!canEditProjectContext}
        title="Mid-turn Input (Beta)"
        description="Send a message to an agent while it is still working, to steer the rest of the run."
      />
    </Box>
  );
});

MidturnInjection.displayName = 'MidturnInjection';
export default MidturnInjection;

/** @type {MuiSx} */
const componentStyles = () => ({
  body: {
    flex: 1,
    overflow: 'auto',
    minHeight: 0,
    padding: '0rem 0rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
  },
});
