import { memo, useCallback, useMemo, useRef, useState } from 'react';

import {
  AIEditSkillButton,
  CreateSkillForm,
  SkillInformation,
  SkillRunPane,
  SkillRunSettings,
} from '@/[fsd]/features/skill';
import { EditorLayout } from '@/[fsd]/shared/ui';
import { EntityTestPanelUI } from '@/[fsd]/widgets/entity-test-panel';
import { ViewMode } from '@/common/constants';

const TEST_ID_PREFIX = 'skill';

/**
 * Skill editor: two configuration panels and an on-demand Test panel.
 */
const SkillEditorWorkspace = memo(props => {
  const {
    skillId,
    versionId,
    meta,
    disabled,
    instructionsKey,
    isTestPanelOpen,
    onOpenTestPanel,
    onCloseTestPanel,
    isFullScreen,
    setIsFullScreen,
    onShowHistory,
    runConversationId,
    onRunConversationChange,
    onOpenRunVersion,
    focusRequest,
    onFocusHandled,
  } = props;

  const runPaneRef = useRef();
  const [isClearDisabled, setIsClearDisabled] = useState(true);
  const [contextConversation, setContextConversation] = useState(null);

  const handleClearChat = useCallback(() => {
    runPaneRef.current?.clear();
  }, []);

  const toolbarActions = useMemo(() => <AIEditSkillButton />, []);
  const testButton = useMemo(
    () => (
      <EntityTestPanelUI.TestEntityButton
        label="Test Skill"
        onClick={onOpenTestPanel}
        testId="skill-test-button"
      />
    ),
    [onOpenTestPanel],
  );

  const renderConfig = useCallback(
    ({ isConfigStacked, toolbar }) => (
      <EditorLayout.ConfigPanels
        isStacked={isConfigStacked}
        testId="skill-config-panels"
        left={
          <EditorLayout.ConfigColumn>
            <CreateSkillForm
              viewMode={ViewMode.Owner}
              disabled={disabled}
              instructionsKey={instructionsKey}
              showRunSettings={false}
              summaryEditAction={toolbar}
            />
          </EditorLayout.ConfigColumn>
        }
        right={
          <EditorLayout.ConfigColumn>
            <SkillRunSettings disabled={disabled} />
            <SkillInformation
              id={skillId}
              versionId={versionId}
              meta={meta}
            />
          </EditorLayout.ConfigColumn>
        }
      />
    ),
    [disabled, instructionsKey, meta, skillId, versionId],
  );

  return (
    <EntityTestPanelUI.EntityEditorWorkspace
      renderConfig={renderConfig}
      isTestPanelOpen={isTestPanelOpen}
      isFullScreen={isFullScreen}
      testIdPrefix={TEST_ID_PREFIX}
      toolbarActions={toolbarActions}
      testButton={testButton}
      testPanelControls={
        <EntityTestPanelUI.EntityTestPanelControls
          activeConversation={contextConversation?.activeConversation}
          setActiveConversation={contextConversation?.setActiveConversation}
          isFullScreen={isFullScreen}
          setIsFullScreen={setIsFullScreen}
          isClearDisabled={isClearDisabled}
          onClear={handleClearChat}
          onShowHistory={onShowHistory}
          onClose={onCloseTestPanel}
          testIdPrefix={TEST_ID_PREFIX}
        />
      }
      testPanelContent={
        <SkillRunPane
          ref={runPaneRef}
          runConversationId={runConversationId}
          onRunConversationChange={onRunConversationChange}
          onOpenRunVersion={onOpenRunVersion}
          onClearStateChange={setIsClearDisabled}
          onContextConversationChange={setContextConversation}
          focusRequest={focusRequest}
          onFocusHandled={onFocusHandled}
        />
      }
    />
  );
});

SkillEditorWorkspace.displayName = 'SkillEditorWorkspace';

export default SkillEditorWorkspace;
