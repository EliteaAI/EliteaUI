import { memo, useCallback, useMemo, useRef, useState } from 'react';

import {
  AIEditSkillButton,
  CreateSkillForm,
  SkillInformation,
  SkillRunPane,
  SkillRunSettings,
  SkillSplitEditor,
  useSkillVersionFilesQuery,
} from '@/[fsd]/features/skill';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { EditorLayout } from '@/[fsd]/shared/ui';
import { EntityTestPanelUI } from '@/[fsd]/widgets/entity-test-panel';
import { ViewMode } from '@/common/constants';

const TEST_ID_PREFIX = 'skill';
const NO_FILES = [];

/**
 * Skill editor (Figma "Skills (new) with files"): Settings | Files, the instructions, and Test on demand.
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

  const projectId = useSelectedProjectId();
  const { data: files = NO_FILES } = useSkillVersionFilesQuery(
    { projectId, versionId },
    { skip: !projectId || !versionId },
  );

  const runPaneRef = useRef();
  const [isClearDisabled, setIsClearDisabled] = useState(true);
  const [contextConversation, setContextConversation] = useState(null);

  const handleClearChat = useCallback(() => {
    runPaneRef.current?.clear();
  }, []);

  // Edit with AI: on dev in the General header, here in the header of the Settings | Files switch (her decision, 17.11)
  const settingsActions = useMemo(() => <AIEditSkillButton />, []);

  const settings = useMemo(
    () => (
      <EditorLayout.ConfigColumn>
        <CreateSkillForm
          viewMode={ViewMode.Owner}
          disabled={disabled}
          instructionsKey={instructionsKey}
          showRunSettings={false}
          showInstructions={false}
        />
        <SkillRunSettings
          disabled={disabled}
          defaultExpanded={false}
        />
        <SkillInformation
          id={skillId}
          versionId={versionId}
          meta={meta}
          defaultExpanded={false}
        />
      </EditorLayout.ConfigColumn>
    ),
    [disabled, instructionsKey, meta, skillId, versionId],
  );

  // The page's own Test panel controls (history, context budget, close) in the header of the Test column
  const renderTestPanelControls = useCallback(
    ({ onClose }) => (
      <EntityTestPanelUI.EntityTestPanelControls
        activeConversation={contextConversation?.activeConversation}
        setActiveConversation={contextConversation?.setActiveConversation}
        isFullScreen={isFullScreen}
        setIsFullScreen={setIsFullScreen}
        isClearDisabled={isClearDisabled}
        onClear={handleClearChat}
        onShowHistory={onShowHistory}
        onClose={onClose}
        testIdPrefix={TEST_ID_PREFIX}
      />
    ),
    [contextConversation, handleClearChat, isClearDisabled, isFullScreen, onShowHistory, setIsFullScreen],
  );

  return (
    <SkillSplitEditor
      files={files}
      disabled={disabled}
      settings={settings}
      settingsActions={settingsActions}
      isFullScreen={isFullScreen}
      isTestPanelOpen={isTestPanelOpen}
      onOpenTestPanel={onOpenTestPanel}
      onCloseTestPanel={onCloseTestPanel}
      renderTestPanelControls={renderTestPanelControls}
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
