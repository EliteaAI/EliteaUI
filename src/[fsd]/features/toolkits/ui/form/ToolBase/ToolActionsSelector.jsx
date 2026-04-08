import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { useGetRemoteMcpTools } from '@/[fsd]/features/mcp/lib/hooks';
import { McpAuthModal } from '@/[fsd]/features/mcp/ui';
import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { useToolkitView } from '@/hooks/toolkit/useToolkitView.js';
import { useTheme } from '@emotion/react';

export const ToolActionsSelector = memo(props => {
  const {
    availableTools = [],
    onChange = () => {},
    extraProperties,
    disabled,
    isRemoteMcp,
    isPreconfiguredMcp,
    toolkitType,
    onToolsFetched,
  } = props;

  const { values } = useFormikContext();
  const { settings: { selected_tools } = {} } = values ?? { settings: {} };
  const selectedTools = useMemo(() => selected_tools ?? [], [selected_tools]);

  const styles = toolActionsSelectorStyles();
  const theme = useTheme();
  const { shouldUseAccordionView } = useToolkitView();

  // Unified hook for fetching MCP tools (works for both remote and pre-built MCPs)
  // Uses mcp_sync_tools endpoint for both cases
  const {
    fetchTools,
    isLoading: isFetchingTools,
    getModalProps,
  } = useGetRemoteMcpTools({
    values,
    toolkitType, // Pass toolkitType for pre-built MCPs
    onToolsFetched,
  });

  const canGetRemoteMcpTools = isRemoteMcp && values?.settings?.url;
  const canGetPreconfiguredMcpTools = isPreconfiguredMcp && toolkitType;
  const canGetTools = canGetRemoteMcpTools || canGetPreconfiguredMcpTools;

  const onClickGetTools = useCallback(
    event => {
      event.stopPropagation();
      if (canGetTools) {
        fetchTools();
      }
    },
    [canGetTools, fetchTools],
  );

  const toolsOptions = useMemo(
    () =>
      availableTools.map(tool =>
        tool.label
          ? tool
          : {
              label: (tool.charAt(0).toUpperCase() + tool.slice(1)).replaceAll('_', ' '),
              value: tool,
            },
      ),
    [availableTools],
  );

  // Find selected tools that are NOT in available tools
  const toolsOptionsValues = toolsOptions.map(option => option.value);
  const warningTools = (selectedTools || []).filter(tool => !toolsOptionsValues.includes(tool));

  const onSelectTool = useCallback(
    value => () => {
      const isSelected = !selectedTools?.includes(value);
      const newValue = isSelected ? [...selectedTools, value] : selectedTools.filter(i => i !== value);
      onChange(newValue);
    },
    [selectedTools, onChange],
  );

  return (
    <Box sx={styles.container(shouldUseAccordionView)}>
      {shouldUseAccordionView ? (
        <BasicAccordion
          showMode={AccordionConstants.AccordionShowMode.LeftMode}
          accordionSX={{
            background: `${theme.palette.background.tabPanel} !important`,
          }}
          summarySX={{
            '& .MuiAccordionSummary-content': { alignItems: 'center', paddingRight: 0 },
            paddingRight: '0 !important',
          }}
          items={[
            {
              title: 'Tools',
              summaryAction:
                isRemoteMcp || isPreconfiguredMcp ? (
                  <Typography
                    variant="labelSmall"
                    sx={styles.syncButton(!canGetTools || isFetchingTools)}
                    onClick={onClickGetTools}
                  >
                    {isFetchingTools ? 'Loading...' : 'Load Tools'}
                  </Typography>
                ) : null,
              content: (
                <>
                  {!isRemoteMcp && !isPreconfiguredMcp ? extraProperties : null}
                  {(isRemoteMcp || isPreconfiguredMcp) && availableTools.length === 0 && (
                    <ToolkitForm.EmptyMcpTools />
                  )}
                  <ToolkitForm.ToolActionsItems
                    toolsOptions={toolsOptions}
                    warningTools={warningTools}
                    selectedTools={selectedTools}
                    onSelectTool={onSelectTool}
                    disabled={disabled}
                    styles={styles}
                  />
                </>
              ),
            },
          ]}
        />
      ) : (
        <>
          <Typography variant="bodyMedium">Tools</Typography>
          <ToolkitForm.ToolActionsItems
            toolsOptions={toolsOptions}
            warningTools={warningTools}
            selectedTools={selectedTools}
            onSelectTool={onSelectTool}
            disabled={disabled}
            styles={styles}
          />
        </>
      )}
      <McpAuthModal {...getModalProps()} />
    </Box>
  );
});

ToolActionsSelector.displayName = 'ToolActionsSelector';

/** @type {MuiSx} */
const toolActionsSelectorStyles = () => ({
  container: shouldUseAccordionView => ({
    marginTop: '1rem',
    padding: shouldUseAccordionView ? '' : '0 0 0 0.75rem',
  }),
  stack: {
    marginTop: '0.5rem',
    gap: '1rem',
  },
  chip: {
    '.MuiChip-label': {
      paddingLeft: 0,
      paddingRight: 0,
    },
    '.MuiChip-icon': {
      marginLeft: 0,
      marginRight: 0,
    },
  },
  syncButton:
    disabled =>
    ({ palette }) => ({
      display: 'inline-block',
      color: !disabled ? palette.text.secondary : palette.text.button.disabled,
      cursor: !disabled ? 'pointer' : 'default',
      height: '1.75rem',
      boxSizing: 'border-box',
      padding: '0.375rem 1rem',
      borderRadius: '1.75rem',
      backgroundColor: palette.background.button.secondary.default,
      transition: 'all 0.2s',
      userSelect: 'none',
      '&:hover': {
        backgroundColor: !disabled ? palette.background.button.secondary.hover : undefined,
      },
      '&:active': {
        transform: 'scale(0.98)',
      },
    }),
});

export default ToolActionsSelector;
