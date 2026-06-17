import { getToolIcon, getToolIconByType } from '@/common/toolkitUtils';
import EliteAImage from '@/components/EliteAImage';

/** @type {MuiSx} */
const iconStyles = {
  icon: {
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
  },
  iconImage: {
    width: '1rem',
    height: '1rem',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
  },
};

// Resolve the sub-agent's OWN icon (the Application/pipeline being delegated to)
// from the participant's tool list by name — mirrors how ActionView.renderIcon
// picks an icon (custom icon_meta image for app/pipeline, else type icon). The
// previous header hardcoded getToolIcon('agent'), so a pipeline-typed sub-agent
// (e.g. "Name Resolver") rendered the generic agent grid instead of the flow
// icon shown on its chip (issue #4993).
export const resolveSubAgentIcon = (name, tools, theme, agentType) => {
  const tool = tools?.find(
    t => t?.name === name || t?.toolkit_name === name || t?.meta?.name?.replace('/', '') === name,
  );
  let type = tool?.type || tool?.entity_settings?.toolkit_type || '';
  if (tool?.agent_type) {
    type = tool.agent_type === 'pipeline' ? 'pipeline' : 'application';
  }
  // Fallback for sub-agents absent from the participant `tools` list (durable
  // fan-out children): the caller derives the kind from the sub-agent's own
  // invocation chip and passes it as agentType so the header still shows the
  // correct pipeline/application icon instead of the generic agent grid (#4993).
  if (!type && agentType) {
    type = agentType === 'pipeline' ? 'pipeline' : 'application';
  }
  const iconMeta = tool?.icon_meta || tool?.meta?.icon_meta;
  if (iconMeta?.url && (type === 'application' || type === 'pipeline')) {
    return (
      <EliteAImage
        style={iconStyles.iconImage}
        image={iconMeta}
      />
    );
  }
  if (type) {
    return getToolIconByType(type, theme, {});
  }
  const FallbackIcon = getToolIcon('agent');
  return <FallbackIcon style={iconStyles.icon} />;
};
