import React, { memo, useCallback, useContext, useMemo } from 'react';

import { Box } from '@mui/material';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion.jsx';
import MultipleSelect from '@/components/MultipleSelect.jsx';

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
    return currentSelection.filter(tool => tools.includes(tool));
  }, [yamlNode?.tool_names, toolkitName, tools]);

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
          <Box
            className={'nowheel'}
            sx={{ overflow: 'auto' }}
          >
            <MultipleSelect
              sx={{ marginBottom: '0rem' }}
              options={tools
                .map(tool => ({ label: tool, value: tool }))
                .sort((a, b) => a.label.localeCompare(b.label))}
              emptyPlaceHolder={''}
              value={selectedTools}
              onValueChange={handleToolsChange}
              label="Tools"
              showBorder
              className="nopan nodrag"
              labelSX={{
                left: '.75rem',
                '& .Mui-focused': {
                  top: '-.3125rem',
                },
              }}
              MenuProps={{
                PaperProps: { style: { marginTop: '.5rem' } },
              }}
              selectSX={{
                '& .MuiSelect-icon': {
                  top: 'calc(50% - .6875rem) !important;',
                },
              }}
              valueItemSX={{ maxWidth: '100% !important' }}
              disabled={disabled}
            />
          </Box>
        ),
        itemDefaultExpanded: true,
      },
    ],
    [toolkitName, selectedTools, tools, handleToolsChange, disabled],
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
