import { memo, useCallback, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography, useTheme } from '@mui/material';

import { useInstructionsMention } from '@/[fsd]/features/agent/lib/hooks/useInstructionsMention.hooks';
import { useInstructionsSkillMention } from '@/[fsd]/features/agent/lib/hooks/useInstructionsSkillMention.hooks';
import { MentionSkillList } from '@/[fsd]/features/skill';
import {
  AccordionConstants,
  MarkdownConstants,
  MentionConstants,
  TourTargetConstants,
} from '@/[fsd]/shared/lib/constants';
import { useInstructionsInputRefContext } from '@/[fsd]/shared/lib/context';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { Markdown, MarkdownEditorActions } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { MarkdownViewToggle } from '@/[fsd]/shared/ui/tab-group-button';
import { contextResolver } from '@/common/utils';

import InstructionsMarkdownEditor from './InstructionsMarkdownEditor';
import InstructionsSlashSuggestionList from './InstructionsSlashSuggestionList';

const { MARKDOWN_VIEW_MODES } = MarkdownConstants;

const PREVIEW_FIRST = [MARKDOWN_VIEW_MODES.preview, MARKDOWN_VIEW_MODES.edit];

const InstructionsInput = memo(props => {
  const { style, containerStyle, disabled, applicationId, entityProjectId, isCreateMode = false } = props;
  const theme = useTheme();
  const inputRef = useInstructionsInputRefContext();
  const styles = instructionsInputStyles();
  const {
    values: { version_details },
    setFieldValue,
  } = useFormikContext();
  const selectedProjectId = useSelectedProjectId();
  const projectId = entityProjectId || selectedProjectId;
  const instructions = version_details?.instructions || '';

  const [viewMode, setViewMode] = useState(
    isCreateMode ? MARKDOWN_VIEW_MODES.edit : MARKDOWN_VIEW_MODES.preview,
  );
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const isEditMode = viewMode === MARKDOWN_VIEW_MODES.edit;

  const onChangeInstructions = useCallback(
    value => setFieldValue('version_details.instructions', value),
    [setFieldValue],
  );

  const updateVariableList = useCallback(
    value => {
      const resolvedInputValue = contextResolver(value);
      setFieldValue(
        'version_details.variables',
        resolvedInputValue.map(key => {
          const prevValue = (version_details?.variables || []).find(v => v.name === key);
          return {
            name: key,
            value: prevValue?.value || '',
            id: prevValue?.id || undefined,
          };
        }),
      );
    },
    [setFieldValue, version_details?.variables],
  );

  // ── Mention hooks ─────────────────────────────────────────────────────────────

  const {
    phase,
    selectedItem,
    committedMentions,
    filteredItems,
    filteredTools,
    highlightedIndex,
    codeMirrorExtensions,
    onKeyDown: mentionOnKeyDown,
    onInstructionsInputChange,
    onSelectItem,
    onSelectTool,
    resetSlash,
  } = useInstructionsMention({
    fileReaderRef: inputRef,
    applicationId,
    projectId,
    versionDetails: version_details,
  });

  const {
    phase: skillPhase,
    committedMentions: skillCommittedMentions,
    filteredItems: skillFilteredItems,
    highlightedIndex: skillHighlightedIndex,
    codeMirrorExtensions: skillCodeMirrorExtensions,
    onKeyDown: skillMentionOnKeyDown,
    onInstructionsInputChange: onSkillInstructionsInputChange,
    onSelectItem: onSelectSkill,
    resetSlash: resetSkill,
  } = useInstructionsSkillMention({
    fileReaderRef: inputRef,
    projectId,
    versionDetails: version_details,
  });

  // Both "/" tool-mention and "~" skill-mention highlights render in the inline and full-screen editors.
  const mergedCodeMirrorExtensions = useMemo(
    () => [...codeMirrorExtensions, ...skillCodeMirrorExtensions],
    [codeMirrorExtensions, skillCodeMirrorExtensions],
  );

  const isSkillPhaseActive = skillPhase !== MentionConstants.MentionPhase.Idle;
  const isSlashPhaseActive = phase !== MentionConstants.MentionPhase.Idle;

  // Route keydown to the active machine; when both idle, let both see the keypress so
  // each can detect ONLY its own trigger ("/" vs "~"). They never cross-talk because
  // a machine ignores keys that are not its trigger while idle.
  const combinedOnKeyDown = useCallback(
    event => {
      if (isSkillPhaseActive) {
        skillMentionOnKeyDown(event);
        return;
      }
      if (isSlashPhaseActive) {
        mentionOnKeyDown(event);
        return;
      }
      mentionOnKeyDown(event);
      skillMentionOnKeyDown(event);
    },
    [isSkillPhaseActive, isSlashPhaseActive, mentionOnKeyDown, skillMentionOnKeyDown],
  );

  const handleRealtimeChange = useCallback(
    value => {
      onInstructionsInputChange(value);
      onSkillInstructionsInputChange(value);
    },
    [onInstructionsInputChange, onSkillInstructionsInputChange],
  );

  // ── View mode / full screen ───────────────────────────────────────────────────

  const onChangeViewMode = useCallback(
    mode => {
      if (!mode) return;
      if (mode !== MARKDOWN_VIEW_MODES.edit) {
        resetSlash();
        resetSkill();
      }
      setViewMode(mode);
    },
    [resetSkill, resetSlash],
  );

  const onOpenFullScreen = useCallback(() => setIsFullScreenOpen(true), []);

  const onCloseFullScreen = useCallback(() => setIsFullScreenOpen(false), []);

  // ── Suggestion lists ──────────────────────────────────────────────────────────

  const suggestionList = (
    <InstructionsSlashSuggestionList
      phase={phase}
      filteredItems={filteredItems}
      filteredTools={filteredTools}
      selectedItem={selectedItem}
      committedMentions={committedMentions}
      highlightedIndex={highlightedIndex}
      onSelectItem={onSelectItem}
      onSelectTool={onSelectTool}
      onClose={resetSlash}
    />
  );

  const skillSuggestionList = (
    <MentionSkillList
      phase={skillPhase}
      filteredItems={skillFilteredItems}
      committedMentions={skillCommittedMentions}
      highlightedIndex={skillHighlightedIndex}
      onSelectItem={onSelectSkill}
      onClose={resetSkill}
    />
  );

  const activeSuggestionList = isSkillPhaseActive ? skillSuggestionList : suggestionList;

  return (
    <BasicAccordion
      style={style}
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={{ background: `${theme.palette.background.default.tertiary} !important` }}
      items={[
        {
          title: 'Instructions',
          testId: 'agent-canvas-section-instructions',
          summaryAction: (
            <Box
              component="span"
              sx={styles.summaryActions}
              onClick={e => e.stopPropagation()}
            >
              {isEditMode && (
                <MarkdownEditorActions
                  value={instructions}
                  onFullScreen={onOpenFullScreen}
                  copyMessage="The instructions have been copied to the clipboard."
                  testIdPrefix="agent-instructions"
                />
              )}
              <MarkdownViewToggle
                value={viewMode}
                onChange={onChangeViewMode}
                iconOrder={PREVIEW_FIRST}
              />
            </Box>
          ),
          content: (
            <Box
              sx={styles.wrapper}
              data-tour={TourTargetConstants.AGENT_TOUR_TARGET_IDS.instructions}
            >
              <Box sx={containerStyle}>
                {isEditMode ? (
                  <InstructionsMarkdownEditor
                    ref={inputRef}
                    key={version_details?.id}
                    value={instructions}
                    disabled={disabled}
                    codeMirrorExtensions={mergedCodeMirrorExtensions}
                    onKeyDown={combinedOnKeyDown}
                    onValueChange={onChangeInstructions}
                    onRealtimeChange={handleRealtimeChange}
                    updateVariableList={updateVariableList}
                    isFullScreenOpen={isFullScreenOpen}
                    onCloseFullScreen={onCloseFullScreen}
                    afterContent={activeSuggestionList}
                  />
                ) : (
                  <Box
                    data-testid="agent-instructions-preview"
                    sx={styles.preview}
                  >
                    {instructions ? (
                      <Markdown>{instructions}</Markdown>
                    ) : (
                      <Typography
                        variant="bodyMedium"
                        sx={styles.emptyPreview}
                      >
                        No instructions yet.
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
              {isEditMode && !isFullScreenOpen && activeSuggestionList}
            </Box>
          ),
        },
      ]}
    />
  );
});

InstructionsInput.displayName = 'InstructionsInput';

/** @type {MuiSx} */
const instructionsInputStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  summaryActions: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    // TabGroupButton hardcodes zIndex: 2000; keep the toggle below modals.
    isolation: 'isolate',
  },
  preview: ({ palette }) => ({
    minHeight: '12rem',
    maxHeight: '24rem',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    border: `0.0625rem solid ${palette.border.default}`,
    backgroundColor: palette.background.surface.interactive.default,
    overflow: 'auto',
    fontSize: '0.875rem',
  }),
  emptyPreview: ({ palette }) => ({
    color: palette.text.metrics,
    fontStyle: 'italic',
  }),
});

export default InstructionsInput;
