import { memo } from 'react';

import ToolkitsTabBarContainer from '@/[fsd]/features/toolkits/ui/toolkits-tab-bar/ToolkitsTabBarContainer';
import ToolkitsTabBarPlaceholder from '@/[fsd]/features/toolkits/ui/toolkits-tab-bar/ToolkitsTabBarPlaceholder';

const ToolkitsTabBar = memo(props => {
  const { onDiscard, onClearEditTool, toolSchema, hasValidationErrors, showPlaceholder = false } = props;

  return showPlaceholder ? (
    <ToolkitsTabBarPlaceholder onDiscard={onDiscard} />
  ) : (
    <ToolkitsTabBarContainer
      onDiscard={onDiscard}
      onClearEditTool={onClearEditTool}
      hasNotSavedCredentials={false}
      toolSchema={toolSchema}
      hasValidationErrors={hasValidationErrors}
    />
  );
});

ToolkitsTabBar.displayName = 'ToolkitsTabBar';

export default ToolkitsTabBar;
