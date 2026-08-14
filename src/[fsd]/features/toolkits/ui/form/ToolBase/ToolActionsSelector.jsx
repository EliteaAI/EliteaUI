import { memo, useCallback, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, Stack, Tooltip, Typography, useTheme } from '@mui/material';

import {
  McpAuthModal,
  PAT_REQUIRED_ACTION_HINT,
  useGetRemoteMcpTools,
  useInternalMcpPatStatus,
} from '@/[fsd]/features/mcp';
import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { AccordionConstants, TourTargetConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Input } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { useToolkitView } from '@/hooks/toolkit/useToolkitView.js';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const ToolActionsSelector = memo(props => {
  const {
    availableTools = [],
    toolGroups,
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

  const [searchTerm, setSearchTerm] = useState('');

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

  const projectId = useSelectedProjectId();
  const { patInvalid } = useInternalMcpPatStatus({ projectId, toolkitType });

  const canGetRemoteMcpTools = isRemoteMcp && values?.settings?.url;
  const canGetPreconfiguredMcpTools = isPreconfiguredMcp && toolkitType;
  const canGetTools = (canGetRemoteMcpTools || canGetPreconfiguredMcpTools) && !patInvalid;

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

  const hasGroups = toolGroups && Object.keys(toolGroups).length > 0;

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

  const onToggleTools = useCallback(
    (toolValues, allSelected) => {
      const newValue = allSelected
        ? selectedTools.filter(tool => !toolValues.includes(tool))
        : [...selectedTools, ...toolValues.filter(tool => !selectedTools.includes(tool))];
      onChange(newValue);
    },
    [selectedTools, onChange],
  );

  // Unavailable (warning) selections are left untouched — only classified tools are cleared
  const nonReadSelected = useMemo(
    () =>
      hasGroups
        ? selectedTools.filter(tool => toolsOptionsValues.includes(tool) && toolGroups[tool] !== 'read')
        : [],
    [hasGroups, selectedTools, toolsOptionsValues, toolGroups],
  );

  const onKeepReadOnly = useCallback(() => {
    onChange(selectedTools.filter(tool => !nonReadSelected.includes(tool)));
  }, [selectedTools, nonReadSelected, onChange]);

  const showSearch = toolsOptions.length > 0;

  const renderToolsControls = () =>
    showSearch && (
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={styles.controlsRow}
      >
        <Input.SimpleSearchBar
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchClear={() => setSearchTerm('')}
          placeholder="Search tools"
          autoFocus={false}
          data-testid="toolkit-tools-search"
          sx={styles.search}
        />
        {hasGroups && (
          <Tooltip
            title={
              nonReadSelected.length
                ? `Deselects the ${nonReadSelected.length} selected tools that create, delete, or execute actions. You can re-select them afterwards.`
                : ''
            }
            placement="top"
          >
            <Box component="span">
              <Button.BaseBtn
                variant="text"
                size="small"
                disabled={disabled || !nonReadSelected.length}
                onClick={onKeepReadOnly}
                data-testid="toolkit-keep-read-only-button"
                sx={styles.keepReadOnly}
              >
                Keep read-only only
              </Button.BaseBtn>
            </Box>
          </Tooltip>
        )}
      </Stack>
    );

  const renderItems = () => (
    <ToolkitForm.ToolActionsItems
      toolsOptions={toolsOptions}
      toolGroups={toolGroups}
      warningTools={warningTools}
      selectedTools={selectedTools}
      onSelectTool={onSelectTool}
      onToggleTools={onToggleTools}
      searchTerm={searchTerm}
      disabled={disabled}
      styles={styles}
    />
  );

  return (
    <Box
      sx={styles.container(shouldUseAccordionView)}
      data-tour={TourTargetConstants.SHARED_TOUR_TARGET_IDS.tools}
    >
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
                  <Tooltip title={patInvalid ? PAT_REQUIRED_ACTION_HINT : ''}>
                    <Typography
                      data-testid="toolkit-load-tools-button"
                      variant="labelSmall"
                      sx={styles.syncButton(!canGetTools || isFetchingTools)}
                      onClick={onClickGetTools}
                    >
                      {isFetchingTools ? 'Loading...' : 'Load Tools'}
                    </Typography>
                  </Tooltip>
                ) : null,
              content: (
                <>
                  {(isRemoteMcp || isPreconfiguredMcp) && availableTools.length === 0 && (
                    <ToolkitForm.EmptyMcpTools />
                  )}
                  {renderToolsControls()}
                  {renderItems()}
                  {!isRemoteMcp && !isPreconfiguredMcp && extraProperties ? (
                    <Box sx={styles.mcpToggleRow}>{extraProperties}</Box>
                  ) : null}
                </>
              ),
            },
          ]}
        />
      ) : (
        <>
          <Typography variant="bodyMedium">Tools</Typography>
          {renderToolsControls()}
          {renderItems()}
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
  controlsRow: {
    marginTop: '0.5rem',
  },
  search: {
    flexGrow: 1,
  },
  keepReadOnly: {
    whiteSpace: 'nowrap',
  },
  mcpToggleRow: ({ palette }) => ({
    marginTop: '1rem',
    paddingTop: '0.75rem',
    borderTop: `0.0625rem solid ${palette.border.lines}`,
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
