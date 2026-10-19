import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';

import { Box, Typography } from '@mui/material';

import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { Switch } from '@/[fsd]/shared/ui';
import { PUBLIC_PROJECT_ID } from '@/common/constants';

// Held only by public-project admins; the backend re-checks the admin role on save
const PUBLIC_ADMIN_PERMISSION = 'projects.projects.project.edit';
const SHARED_TOOLTIP = 'Other projects can use this toolkit through the Web Search module';

const ToolkitSharedSwitch = memo(props => {
  const { disabled = false } = props;
  const { values, setFieldValue } = useFormikContext();
  const projectId = useSelectedProjectId();
  const { publicPermissions = [] } = useSelector(state => state.user);
  const styles = toolkitSharedSwitchStyles();

  const isPublicAdmin = useMemo(
    () => +projectId === PUBLIC_PROJECT_ID && publicPermissions.includes(PUBLIC_ADMIN_PERMISSION),
    [projectId, publicPermissions],
  );

  const onChange = useCallback(
    (_, checked) => setFieldValue('meta', { ...(values?.meta || {}), shared: checked }),
    [setFieldValue, values?.meta],
  );

  if (!isPublicAdmin) return null;

  return (
    <Box
      sx={styles.root}
      data-testid="toolkit-shared-switch"
    >
      <Switch.BaseSwitch
        label="Shared with all projects"
        checked={Boolean(values?.meta?.shared)}
        onChange={onChange}
        disabled={disabled}
        infoTooltip={SHARED_TOOLTIP}
      />
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        Can be selected as the Web Search toolkit for all projects.
      </Typography>
    </Box>
  );
});

ToolkitSharedSwitch.displayName = 'ToolkitSharedSwitch';

/** @type {MuiSx} */
const toolkitSharedSwitchStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    marginBottom: '1rem',
  },
});

export default ToolkitSharedSwitch;
