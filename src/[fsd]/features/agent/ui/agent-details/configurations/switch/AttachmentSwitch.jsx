import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { InternalToolsConstants } from '@/[fsd]/shared/lib/constants';
import { Switch, Text } from '@/[fsd]/shared/ui';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

const ATTACHMENTS_INTERNAL_TOOL = 'attachments';

/**
 * Switch component for enabling/disabling file attachments in agent configuration.
 * When enabled, adds 'attachments' to the agent's internal_tools list, which causes
 * the backend to auto-inject the artifact toolkit at predict time.
 */
const AttachmentSwitch = memo(({ disabled }) => {
  const { checkPermission } = useCheckPermission();
  const { values, setFieldValue } = useFormikContext();

  // Get attachments tool info from constants
  const attachmentToolInfo = useMemo(
    () =>
      InternalToolsConstants.INTERNAL_TOOLS_LIST.find(tool => tool.name === ATTACHMENTS_INTERNAL_TOOL) || {},
    [],
  );

  const disabledSwitch = useMemo(
    () => !checkPermission(PERMISSIONS.toolkits.patch) || disabled,
    [checkPermission, disabled],
  );

  const internalTools = useMemo(
    () => values?.version_details?.meta?.internal_tools || [],
    [values?.version_details?.meta?.internal_tools],
  );

  const allowAttachments = useMemo(() => internalTools.includes(ATTACHMENTS_INTERNAL_TOOL), [internalTools]);

  const onAllowAttachmentsChange = useCallback(
    (event, checkedValue) => {
      const currentInternalTools = values?.version_details?.meta?.internal_tools || [];
      let newInternalTools;

      if (checkedValue) {
        // Add attachments to internal tools
        newInternalTools = [...currentInternalTools, ATTACHMENTS_INTERNAL_TOOL];
      } else {
        // Remove attachments from internal tools
        newInternalTools = currentInternalTools.filter(tool => tool !== ATTACHMENTS_INTERNAL_TOOL);
      }

      setFieldValue('version_details.meta.internal_tools', newInternalTools);
    },
    [values?.version_details?.meta?.internal_tools, setFieldValue],
  );

  return (
    <Switch.BaseSwitch
      label={attachmentToolInfo.title || 'Allow attachments'}
      checked={allowAttachments}
      onChange={onAllowAttachmentsChange}
      width="auto"
      infoTooltip={
        attachmentToolInfo.infoTooltip && <Text.TextWithLink {...attachmentToolInfo.infoTooltip} />
      }
      slotProps={{
        formControlLabel: { labelPlacement: 'end', sx: { marginRight: '0rem' } },
      }}
      disabled={disabledSwitch}
    />
  );
});

AttachmentSwitch.displayName = 'AttachmentSwitch';

export default AttachmentSwitch;
