import { memo, useCallback, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { useInstructionsInputRefContext } from '@/[fsd]/app/providers';
import { useInstructionsMention } from '@/[fsd]/features/agent/lib/hooks/useInstructionsMention.hooks';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { FileReaderEnhancer } from '@/[fsd]/shared/ui/input';
import { contextResolver } from '@/common/utils';
import { useToolsValidationInfo } from '@/hooks/application/useValidateApplicationVersion';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { useTheme } from '@emotion/react';

import InstructionsSlashSuggestionList from './InstructionsSlashSuggestionList';

/**
 * Returns true when a tool entry is a toolkit or MCP (has selectable sub-tools).
 * Agents and pipelines have type 'application'.
 */
const isToolkitItem = tool => tool.type !== 'application';

const getItemDescription = tool => {
  if (tool.type === 'application') {
    return tool.agent_type === 'pipeline' ? 'Pipeline' : 'Agent';
  }
  return 'Toolkit';
};

const InstructionsInput = memo(props => {
  const { style, containerStyle, disabled, applicationId, entityProjectId } = props;
  const theme = useTheme();
  const inputRef = useInstructionsInputRefContext();
  const styles = instructionsInputStyles();
  const {
    values: { version_details },
    setFieldValue,
  } = useFormikContext();
  const selectedProjectId = useSelectedProjectId();
  const projectId = entityProjectId || selectedProjectId;

  const handleChange = useCallback(field => value => setFieldValue(field, value), [setFieldValue]);

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

  // ── Validation info for filtering out misconfigured toolkits ─────────────────

  const { toolsValidationInfo } = useToolsValidationInfo({
    applicationId,
    projectId,
    versionId: version_details?.id,
    tools: version_details?.tools,
  });

  // ── Mentionable items from the agent's tool list ──────────────────────────────

  const mentionableItems = useMemo(
    () =>
      (version_details?.tools || [])
        .filter(tool => !toolsValidationInfo[tool.id])
        .map(tool => ({
          name: tool.name,
          type: tool.type,
          agent_type: tool.agent_type,
          settings: tool.settings,
          isToolkit: isToolkitItem(tool),
          description: getItemDescription(tool),
        })),
    [version_details?.tools, toolsValidationInfo],
  );

  // ── Mention hook ──────────────────────────────────────────────────────────────

  const {
    phase,
    itemQuery,
    toolQuery,
    selectedItem,
    filteredTools,
    onKeyDown: mentionOnKeyDown,
    onInstructionsInputChange,
    onSelectItem,
    onSelectTool,
    resetSlash,
    resetMentionState,
  } = useInstructionsMention({ fileReaderRef: inputRef, mentionableItems });

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Intercept onChange so the mention hook tracks the current textarea content.
  const handleInstructionsChange = useCallback(
    value => {
      handleChange('version_details.instructions')(value);
      onInstructionsInputChange(value);
    },
    [handleChange, onInstructionsInputChange],
  );

  const suggestionList = (
    <InstructionsSlashSuggestionList
      phase={phase}
      itemQuery={itemQuery}
      toolQuery={toolQuery}
      items={mentionableItems}
      filteredTools={filteredTools}
      selectedItem={selectedItem}
      onSelectItem={onSelectItem}
      onSelectTool={onSelectTool}
      onClose={resetSlash}
    />
  );

  return (
    <BasicAccordion
      style={style}
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={{ background: `${theme.palette.background.tabPanel} !important` }}
      items={[
        {
          title: 'Instructions',
          content: (
            <Box sx={styles.wrapper}>
              <Box sx={containerStyle}>
                <FileReaderEnhancer
                  ref={inputRef}
                  showexpandicon="true"
                  id="application-instructions"
                  placeholder="Guidelines for the AI agent"
                  defaultValue={version_details?.instructions}
                  onChange={handleInstructionsChange}
                  updateVariableList={updateVariableList}
                  key={version_details?.id}
                  multiline
                  disabled={disabled}
                  fieldName={'Instructions'}
                  onKeyDown={mentionOnKeyDown}
                  onResetMentionState={resetMentionState}
                  onRealtimeChange={onInstructionsInputChange}
                  onFullScreenChange={setIsModalOpen}
                  afterContent={suggestionList}
                />
              </Box>
              {!isModalOpen && suggestionList}
            </Box>
          ),
        },
      ]}
    />
  );
});

InstructionsInput.displayName = 'InstructionsInput';

export default InstructionsInput;

/** @type {MuiSx} */
const instructionsInputStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
});
