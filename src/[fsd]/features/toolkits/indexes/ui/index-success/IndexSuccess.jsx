import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { SuccessPageStatus } from '@/[fsd]/features/toolkits/indexes/lib/constants';
import { indexSearchToolOptions } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexDetails.helpers';

import RunIndexSettingsPanel from './RunIndexSettingsPanel';
import SearchResult from './SearchResult';
import SuccessPanel from './SuccessPanel';

const IndexSuccess = memo(props => {
  const {
    banner,
    onSelectSearchTool,
    selectedSearchTool,
    selectedIndexTools,
    runFormFields,
    adjustedRunSchema,
    toolInputVariables,
    onChangeInputVariables,
    isRunning,
    effectiveIsIndexing,
    isRunFormValid,
    handleRunTool,
    chatHistory,
    chatConversation,
    questionItemRef,
    showResults,
    showBanner,
  } = props;

  const [activePanel, setActivePanel] = useState(SuccessPageStatus.Init);

  const searchToolOptions = useMemo(() => indexSearchToolOptions(selectedIndexTools), [selectedIndexTools]);

  useEffect(() => {
    if (showResults) setActivePanel(SuccessPageStatus.Results);
  }, [showResults]);

  const handleSelectSearchTool = useCallback(
    value => {
      setActivePanel(SuccessPageStatus.Settings);
      onSelectSearchTool(value);
    },
    [onSelectSearchTool],
  );

  const handleBackToInit = useCallback(() => {
    setActivePanel(SuccessPageStatus.Init);
    onSelectSearchTool(null);
  }, [onSelectSearchTool]);

  const onRunSearchTool = useCallback(() => {
    setActivePanel(SuccessPageStatus.Results);
    handleRunTool();
  }, [handleRunTool]);

  switch (activePanel) {
    case SuccessPageStatus.Init:
      return (
        <SuccessPanel
          banner={banner}
          showBanner={showBanner}
          onSelectSearchTool={handleSelectSearchTool}
          selectedSearchTool={selectedSearchTool}
          searchToolOptions={searchToolOptions}
        />
      );
    case SuccessPageStatus.Settings:
      return (
        <RunIndexSettingsPanel
          banner={banner}
          runToolOptions={searchToolOptions}
          selectedRunTool={selectedSearchTool}
          onSelectRunTool={onSelectSearchTool}
          runFormFields={runFormFields}
          adjustedRunSchema={adjustedRunSchema}
          toolInputVariables={toolInputVariables}
          onChangeInputVariables={onChangeInputVariables}
          disabled={isRunning || effectiveIsIndexing}
          isRunFormValid={isRunFormValid}
          onRunSearchTool={onRunSearchTool}
        />
      );
    case SuccessPageStatus.Results:
      return (
        <SearchResult
          chatHistory={chatHistory}
          chatConversation={chatConversation}
          questionItemRef={questionItemRef}
          isRunning={isRunning}
          effectiveIsIndexing={effectiveIsIndexing}
          onBack={handleBackToInit}
        />
      );
    default:
      return null;
  }
});

IndexSuccess.displayName = 'IndexSuccess';

export default IndexSuccess;
