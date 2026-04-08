import { memo, useMemo } from 'react';

import { EditViewTabsEnum } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { IndexConfig, IndexHistory } from '@/[fsd]/features/toolkits/indexes/ui';

const IndexViews = memo(props => {
  const {
    activeView,
    schema,
    toolsConfig,
    configInitialized,
    initializeDefaultConfigValues,
    toolInputVariables,
    onChangeInputVariables,
    isValidForm,
    changesDisabled,
    index,
    isRunningTool,
  } = props;

  const commonConfigProps = useMemo(
    () => ({
      schema,
      configInitialized,
      initializeDefaultConfigValues,
      toolInputVariables,
      onChangeInputVariables,
      changesDisabled,
      withNavigation: true,
    }),
    [
      configInitialized,
      initializeDefaultConfigValues,
      onChangeInputVariables,
      schema,
      toolInputVariables,
      changesDisabled,
    ],
  );

  return (
    <>
      {(() => {
        switch (activeView) {
          case EditViewTabsEnum.configuration:
            return (
              <IndexConfig
                sx={{ '.index-config-field:first-of-type': { marginTop: 0 } }}
                {...commonConfigProps}
                changesDisabled
              />
            );
          case EditViewTabsEnum.history:
            return <IndexHistory history={index?.metadata?.history || []} />;
          default:
            return (
              <IndexConfig
                toolsConfig={toolsConfig}
                isValidForm={isValidForm}
                isRunningTool={isRunningTool}
                {...commonConfigProps}
              />
            );
        }
      })()}
    </>
  );
});

IndexViews.displayName = 'IndexViews';

export default IndexViews;
