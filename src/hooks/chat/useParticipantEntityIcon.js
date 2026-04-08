import { createElement, useMemo } from 'react';

import { ToolkitsHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { useGetCurrentToolkitSchemas } from '@/[fsd]/features/toolkits/lib/hooks';
import { useSystemSenderName } from '@/[fsd]/shared/lib/hooks/useEnvironmentSettingByKey.hooks';
import { ChatParticipantType } from '@/common/constants';
import { EntityTypeIcon } from '@/components/EntityIcon';
import { useTheme } from '@emotion/react';

export default function useParticipantEntityIcon(participant) {
  const theme = useTheme();
  const systemSenderName = useSystemSenderName();
  const { toolkitSchemas } = useGetCurrentToolkitSchemas();
  const entityIcon = useMemo(() => {
    if (!participant?.entity_name) {
      return {
        component: createElement(EntityTypeIcon, {
          type: ChatParticipantType.Dummy,
          isActive: true,
          systemSenderName,
        }),
      };
    }
    if (
      participant?.entity_name !== ChatParticipantType.Toolkits &&
      participant?.participantType !== ChatParticipantType.Toolkits
    ) {
      return (
        participant?.entity_settings?.icon_meta ||
        participant?.icon_meta ||
        participant?.version_details?.icon_meta
      );
    } else {
      const { iconComponent } = ToolkitsHelpers.getToolkitIcon(
        {
          type: participant?.entity_settings?.toolkit_type || participant?.type || '',
        },
        theme,
        toolkitSchemas,
        participant.meta?.mcp,
      );
      return {
        ...(participant?.entity_settings?.icon_meta || {}),
        component: iconComponent,
      };
    }
  }, [participant, systemSenderName, theme, toolkitSchemas]);

  return entityIcon;
}
