import { memo, useCallback, useMemo, useRef } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { AgentInput, ApplicationTools } from '@/[fsd]/features/agent/ui/agent-details/configurations';
import ApplicationAdvanceSettings from '@/[fsd]/features/agent/ui/agent-details/configurations/ApplicationAdvanceSettings';
import ApplicationEditorNotes from '@/[fsd]/features/agent/ui/agent-details/configurations/ApplicationEditorNotes';
import { AIEditAgentButton } from '@/[fsd]/features/agent/ui/ai-edit-agent-modal';
import { AGENT_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import { GovernanceReadinessCard } from '@/[fsd]/features/project-governance';
import { ApplicationSkills } from '@/[fsd]/features/skill/ui';
import { useRunHistoryNavigation } from '@/[fsd]/shared/lib/hooks';
import { EditorLayout } from '@/[fsd]/shared/ui';
import { EntitySchedulesSection } from '@/[fsd]/widgets/entity-schedules-section';
import { EntityTestPanelUI } from '@/[fsd]/widgets/entity-test-panel';
import { PERMISSIONS, ViewMode } from '@/common/constants';
import ApplicationVariables from '@/components/ApplicationVariables.jsx';
import ConversationStarters from '@/components/ConversationStarters';
import useAgentMCPToolsStatusMonitor from '@/hooks/application/useAgentMCPToolsStatusMonitor';
import useCheckPermission from '@/hooks/useCheckPermission';
import ApplicationEditForm from '@/pages/Applications/Components/Applications/ApplicationEditForm';
import ApplicationInformation from '@/pages/Applications/Components/Applications/ApplicationInformation';
import RouteDefinitions from '@/routes';

import { useAgentTestChat } from '../lib/hooks';
import AgentTestChat from './AgentTestChat';

const TEST_ID_PREFIX = 'agent';

/**
 * Agent editor: two configuration panels and an on-demand Test panel.
 */
const AgentEditorWorkspace = memo(props => {
  const {
    applicationId,
    viewMode,
    unsavedLLMSettings,
    setUnsavedLLMSettings,
    isTestPanelOpen,
    onOpenTestPanel,
    onCloseTestPanel,
    isFullScreen,
    setIsFullScreen,
  } = props;

  const { initialValues, values } = useFormikContext();
  const { checkPermission } = useCheckPermission();
  const isDisabled = useMemo(
    () => viewMode !== ViewMode.Owner || !checkPermission(PERMISSIONS.applications.update),
    [viewMode, checkPermission],
  );

  useAgentMCPToolsStatusMonitor();

  const chatBoxRef = useRef();
  const styles = useMemo(() => agentEditorWorkspaceStyles(), []);
  const { goToRunHistory } = useRunHistoryNavigation({
    entityId: applicationId,
    historyRoute: RouteDefinitions.ApplicationsRunHistory,
  });
  const { settings, activeConversation, setActiveConversation, isClearDisabled } = useAgentTestChat({
    applicationId,
    unsavedLLMSettings,
    setUnsavedLLMSettings,
  });

  const handleClearChat = useCallback(() => {
    chatBoxRef.current?.onClear();
  }, []);

  const toolbarActions = useMemo(() => <AIEditAgentButton />, []);
  const testButton = useMemo(
    () => (
      <Box
        component="span"
        data-tour={AGENT_TOUR_TARGET_IDS.testChat}
      >
        <EntityTestPanelUI.TestEntityButton
          label="Test Agent"
          onClick={onOpenTestPanel}
          testId="agent-test-button"
        />
      </Box>
    ),
    [onOpenTestPanel],
  );

  const renderConfig = useCallback(
    ({ isConfigStacked, toolbar }) => (
      <EditorLayout.ConfigPanels
        isStacked={isConfigStacked}
        testId="agent-config-panels"
        left={
          <EditorLayout.ConfigColumn>
            {/* (#7269) what this version still needs to run governed for you; read again after a Save */}
            <GovernanceReadinessCard
              entityKind="version"
              entityId={values?.version_details?.id}
              testId="agent-governance-readiness"
            />
            <ApplicationEditForm
              showAIEditButton={false}
              summaryAction={toolbar}
            />
            <AgentInput.InstructionsInput
              disabled={isDisabled}
              applicationId={applicationId}
            />
            <ApplicationVariables
              sectionTestId="agent-variables-section"
              rowTestId="agent-variable-row-{}"
              inputTestId="agent-variable-input-{}"
            />
            <AgentInput.WelcomeMessageInput
              disabled={isDisabled}
              style={styles.section}
            />
            <ConversationStarters disabled={isDisabled} />
            <ApplicationAdvanceSettings
              disabled={isDisabled}
              defaultExpanded={false}
              showIgnoreProjectContext
            />
            <ApplicationEditorNotes
              disabled={isDisabled}
              defaultExpanded={false}
            />
            <ApplicationInformation defaultExpanded={false} />
          </EditorLayout.ConfigColumn>
        }
        right={
          <EditorLayout.ConfigColumn>
            <ApplicationTools
              applicationId={applicationId}
              disabled={isDisabled}
            />
            <ApplicationSkills disabled={isDisabled} />
            <EntitySchedulesSection
              entityType="agent"
              entityId={applicationId}
              entityName={initialValues?.name}
              versionId={values?.version_details?.id}
              versionName={values?.version_details?.name}
            />
          </EditorLayout.ConfigColumn>
        }
      />
    ),
    [
      applicationId,
      initialValues?.name,
      isDisabled,
      styles.section,
      values?.version_details?.id,
      values?.version_details?.name,
    ],
  );

  return (
    <Box
      sx={styles.root}
      data-tour={AGENT_TOUR_TARGET_IDS.workspace}
    >
      <EntityTestPanelUI.EntityEditorWorkspace
        renderConfig={renderConfig}
        isTestPanelOpen={isTestPanelOpen}
        isFullScreen={isFullScreen}
        testIdPrefix={TEST_ID_PREFIX}
        toolbarActions={toolbarActions}
        testButton={testButton}
        testPanelControls={
          <EntityTestPanelUI.EntityTestPanelControls
            activeConversation={activeConversation}
            setActiveConversation={setActiveConversation}
            isFullScreen={isFullScreen}
            setIsFullScreen={setIsFullScreen}
            isClearDisabled={isClearDisabled}
            onClear={handleClearChat}
            onShowHistory={applicationId ? goToRunHistory : undefined}
            onClose={onCloseTestPanel}
            testIdPrefix={TEST_ID_PREFIX}
          />
        }
        testPanelContent={
          <AgentTestChat
            ref={chatBoxRef}
            settings={settings}
          />
        }
      />
    </Box>
  );
});

AgentEditorWorkspace.displayName = 'AgentEditorWorkspace';

/** @type {MuiSx} */
const agentEditorWorkspaceStyles = () => ({
  root: {
    height: '100%',
  },
  // Overrides the section's own default top margin; the column gap spaces the sections
  section: {
    marginTop: 0,
  },
});

export default AgentEditorWorkspace;
