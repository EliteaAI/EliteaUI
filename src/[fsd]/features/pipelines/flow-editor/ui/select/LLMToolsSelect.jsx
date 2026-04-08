import { memo, useCallback, useContext, useMemo } from 'react';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion.jsx';
import { Select } from '@/[fsd]/shared/ui';

export const LLMToolsSelect = memo(props => {
  const { toolkitName, id, tools = [], disabled } = props;
  const styles = getStyles();

  const { setYamlJsonObject, yamlJsonObject } = useContext(FlowEditorContext);

  // Get the LLM node from YAML
  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [id, yamlJsonObject.nodes],
  );

  // Get selected tools for this toolkit from the YAML node
  const selectedTools = useMemo(() => {
    const toolNames = yamlNode?.tool_names || {};
    const currentSelection = toolNames[toolkitName] || [];
    return currentSelection.filter(tool => tools.includes(tool)).sort((a, b) => a.localeCompare(b));
  }, [yamlNode?.tool_names, toolkitName, tools]);

  const toolOptions = useMemo(
    () =>
      tools
        .map(tool => ({ label: tool, value: tool }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [tools],
  );

  // Handle tool selection changes
  const handleToolsChange = useCallback(
    newSelectedTools => {
      const currentToolNames = yamlNode?.tool_names || {};
      const updatedToolNames = {
        ...currentToolNames,
        [toolkitName]: newSelectedTools,
      };

      FlowEditorHelpers.updateYamlNode(id, 'tool_names', updatedToolNames, yamlJsonObject, setYamlJsonObject);
    },
    [id, toolkitName, yamlNode?.tool_names, yamlJsonObject, setYamlJsonObject],
  );

  // Create accordion items for the toolkit
  const accordionItems = useMemo(
    () => [
      {
        title: `${toolkitName} (${selectedTools.length}/${tools.length})`,
        content: (
          <Select.SingleSelect
            showEmptyPlaceholder={false}
            options={toolOptions}
            value={selectedTools}
            onValueChange={handleToolsChange}
            label="Tools"
            showBorder
            multiple
            className="nopan nodrag nowheel"
            disabled={disabled}
          />
        ),
        itemDefaultExpanded: true,
      },
    ],
    [toolkitName, selectedTools, tools.length, toolOptions, handleToolsChange, disabled],
  );

  return (
    <BasicAccordion
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={styles.accordion}
      summarySX={styles.accordionSummary}
      titleSX={styles.accordionTitle}
      accordionDetailsSX={styles.accordionDetails}
      items={accordionItems}
    />
  );
});

LLMToolsSelect.displayName = 'LLMToolsSelect';

/** @type {MuiSx} */
const getStyles = () => ({
  accordion: ({ palette }) => ({ background: `${palette.background.tabPanel} !important` }),
  accordionSummary: ({ palette }) => ({
    background: palette.background.userInputBackground,
    borderRadius: '.5rem',
    minHeight: '2rem !important',
  }),
  accordionTitle: {
    color: 'text.secondary',
  },
  accordionDetails: {
    marginTop: '.5rem',
    paddingLeft: '0rem',
    gap: '.5rem',
  },
});

export default LLMToolsSelect;
