import React, { Suspense, memo, useCallback, useRef } from 'react';

import { Box } from '@mui/material';

import { getEntityIcon, getIconStyleProps } from '@/[fsd]/features/chat/lib/helpers';
import { ChunkHelpers } from '@/[fsd]/shared/lib/helpers';
import BaseTab from '@/[fsd]/shared/ui/tabs/BaseTab';
import BaseTabs, { TABS_VARIANTS } from '@/[fsd]/shared/ui/tabs/BaseTabs';

import EditorLoading from './EditorLoading';

const AgentEditor = ChunkHelpers.lazyWithRetry(() => import('./AgentEditor'));
const PipelineEditor = ChunkHelpers.lazyWithRetry(() => import('./PipelineEditor'));
const SkillEditor = ChunkHelpers.lazyWithRetry(() => import('./SkillEditor'));
const ToolkitEditor = ChunkHelpers.lazyWithRetry(() => import('./ToolkitEditor'));
const ProjectContextEditor = ChunkHelpers.lazyWithRetry(() => import('./ProjectContextEditor'));

const GeneratedEntityEditorPanel = memo(props => {
  const {
    tabs,
    activeIndex,
    onTabChange,
    onCloseTab,
    onAttachmentToolChange,
    onConversationStartersChange,
    handleEditorDirtyStateChange,
  } = props;

  // Track dirty state per tab entity_id — persists across tab switches
  const dirtyTabsRef = useRef(new Map());

  const handleTabDirtyStateChange = useCallback(
    (entityId, isDirty) => {
      if (isDirty) {
        dirtyTabsRef.current.set(entityId, true);
      } else {
        dirtyTabsRef.current.delete(entityId);
      }
      handleEditorDirtyStateChange?.(dirtyTabsRef.current.size > 0);
    },
    [handleEditorDirtyStateChange],
  );

  const handleTabChange = useCallback(
    (_event, newIndex) => {
      onTabChange?.(newIndex);
    },
    [onTabChange],
  );

  const styles = generatedEntityEditorPanelStyles();

  return (
    <Box sx={styles.root}>
      <Box sx={styles.tabBar}>
        <BaseTabs
          value={activeIndex}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={styles.tabs}
        >
          {tabs.map((tab, idx) => {
            const Icon = getEntityIcon(tab);
            return (
              <BaseTab
                key={tab.entity_id ?? idx}
                label={tab.entity_name}
                icon={Icon ? <Icon {...getIconStyleProps(Icon, styles.tabIcon)} /> : undefined}
                iconPosition="start"
                variant={TABS_VARIANTS.elitea}
              />
            );
          })}
        </BaseTabs>
      </Box>

      <Box sx={styles.editorsContainer}>
        {tabs.map((tab, idx) => {
          const isActive = activeIndex === idx;
          const handleClose = () => {
            handleTabDirtyStateChange(tab.entity_id, false);
            onCloseTab?.(tab.entity_id);
          };
          const onDirtyChange = isDirty => handleTabDirtyStateChange(tab.entity_id, isDirty);
          return (
            <Box
              key={tab.entity_id ?? idx}
              sx={styles.editorPane(isActive)}
            >
              {tab.entity_type === 'agent' && (
                <Suspense fallback={<EditorLoading />}>
                  <AgentEditor
                    agent={tab.participant}
                    isVisible={isActive}
                    isCreateMode={false}
                    onCloseAgentEditor={handleClose}
                    onAttachmentToolChange={onAttachmentToolChange}
                    onAgentDirtyStateChange={onDirtyChange}
                    onConversationStartersChange={onConversationStartersChange}
                    disableNavBlocking
                  />
                </Suspense>
              )}
              {tab.entity_type === 'pipeline' && (
                <Suspense fallback={<EditorLoading />}>
                  <PipelineEditor
                    pipeline={tab.participant}
                    isVisible={isActive}
                    isCreateMode={false}
                    onClosePipelineEditor={handleClose}
                    onPipelineDirtyStateChange={onDirtyChange}
                    onConversationStartersChange={onConversationStartersChange}
                    onAttachmentToolChange={onAttachmentToolChange}
                    disableNavBlocking
                  />
                </Suspense>
              )}
              {tab.entity_type === 'skill' && (
                <Suspense fallback={<EditorLoading />}>
                  <SkillEditor
                    skill={tab.participant}
                    isVisible={isActive}
                    onCloseSkillEditor={handleClose}
                    onDirtyStateChange={onDirtyChange}
                    disableNavBlocking
                  />
                </Suspense>
              )}
              {tab.entity_type === 'toolkit' && (
                <Suspense fallback={<EditorLoading />}>
                  <ToolkitEditor
                    toolkit={tab.participant}
                    isVisible={isActive}
                    onCloseToolkitEditor={handleClose}
                    onDirtyStateChange={onDirtyChange}
                    disableNavBlocking
                  />
                </Suspense>
              )}
              {tab.entity_type === 'project_context' && (
                <Suspense fallback={<EditorLoading />}>
                  <ProjectContextEditor
                    isVisible={isActive}
                    onCloseProjectContextEditor={handleClose}
                    onDirtyStateChange={onDirtyChange}
                    disableNavBlocking
                  />
                </Suspense>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});

GeneratedEntityEditorPanel.displayName = 'GeneratedEntityEditorPanel';

/** @type {MuiSx} */
const generatedEntityEditorPanelStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  tabBar: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  tabIcon: {
    width: '1rem',
    height: '1rem',
  },
  tabs: {
    flex: 1,
    minWidth: 0,
    minHeight: '2rem !important',
    '& .MuiTabs-indicator': ({ palette }) => ({
      backgroundColor: palette.background.tabs.default,
      borderRadius: '2rem 2rem 0 0',
    }),
  },
  editorsContainer: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  editorPane: isActive => ({
    display: isActive ? 'flex' : 'none',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    marginTop: '0.5rem',
  }),
});

export default GeneratedEntityEditorPanel;
