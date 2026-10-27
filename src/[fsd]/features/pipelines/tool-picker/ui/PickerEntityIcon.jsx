import { memo } from 'react';

import { isApplicationTool } from '@/[fsd]/features/pipelines/tool-picker/lib/helpers/pipelineToolUsage.helpers';
import { EntityIcon } from '@/[fsd]/shared/ui/icon';
import { useGetToolkitIconMeta } from '@/hooks/application/useLibraryToolkits';

/** Icon of a toolkit, MCP, agent or pipeline, from a list row or an attached tool */
const PickerEntityIcon = memo(props => {
  const {
    source,
    isPipeline = false,
    mcp = false,
    isApplication = isApplicationTool(source),
    large = false,
  } = props;
  const getToolkitIconMeta = useGetToolkitIconMeta();

  const pipeline = isPipeline || source?.agent_type === 'pipeline';
  const icon = isApplication ? source?.icon_meta : getToolkitIconMeta(source || {}, mcp);
  const styles = pickerEntityIconStyles(large);

  return (
    <EntityIcon
      sx={styles.icon}
      imageStyle={styles.image}
      showBackgroundColor={large}
      icon={icon}
      entityType={isApplication ? (pipeline ? 'pipeline' : 'application') : 'toolkit'}
      projectId=""
      editable={false}
    />
  );
});

PickerEntityIcon.displayName = 'PickerEntityIcon';

/** @type {MuiSx} */
const pickerEntityIconStyles = large => {
  // Large: the round tile of the tool cards
  const size = large ? '2.125rem' : '1rem';
  return {
    icon: {
      minWidth: `${size} !important`,
      width: `${size} !important`,
      height: `${size} !important`,
      ...(!large && { borderRadius: '0rem' }),
    },
    image: {
      width: size,
      height: size,
      borderRadius: '50%',
    },
  };
};

export default PickerEntityIcon;
