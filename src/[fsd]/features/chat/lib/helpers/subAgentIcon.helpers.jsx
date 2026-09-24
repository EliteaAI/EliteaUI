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
  // The explicit agentType prop is derived from the sub-agent's OWN invocation
  // (the action's toolMeta.agent_type — the same authoritative source the
  // invocation chip uses), so it wins the pipeline/application distinction. The
  // participant `tools` entry for a pipeline often carries the generic entity
  // type ('application') without agent_type, which otherwise mis-resolved a
  // pipeline sub-agent to the grid icon instead of the flow icon (issue #4993).
  let type = '';
  if (agentType) {
    type = agentType === 'pipeline' ? 'pipeline' : 'application';
  } else if (tool?.agent_type) {
    type = tool.agent_type === 'pipeline' ? 'pipeline' : 'application';
  } else {
    type = tool?.type || tool?.entity_settings?.toolkit_type || '';
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
