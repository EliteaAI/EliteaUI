import { memo, useCallback, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, Tooltip, Typography, useTheme } from '@mui/material';

import {
  McpAuthModal,
  PAT_REQUIRED_ACTION_HINT,
  useGetRemoteMcpTools,
  useInternalMcpPatStatus,
} from '@/[fsd]/features/mcp';
import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { AccordionConstants, TourTargetConstants } from '@/[fsd]/shared/lib/constants';
import { Input } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import OnlineIcon from '@/assets/online-icon.svg?react';
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

  const showSearch = toolsOptions.length > 0;

  const renderToolsControls = () =>
    showSearch && (
      <Input.SimpleSearchBar
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchClear={() => setSearchTerm('')}
        placeholder="Search tools"
        autoFocus={false}
        data-testid="toolkit-tools-search"
        sx={styles.controlsRow}
      />
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
                    <Box sx={styles.mcpToggleRow}>
                      <Box sx={styles.mcpToggleIcon}>
                        <OnlineIcon
                          width={16}
                          height={16}
                        />
                      </Box>
                      {extraProperties}
                    </Box>
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
  mcpToggleRow: ({ palette }) => ({
    marginTop: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.75rem',
    backgroundColor: palette.background.tabButton.default,
    border: `0.0625rem solid ${palette.border.cardsOutlines}`,
  }),
  mcpToggleIcon: ({ palette }) => ({
    width: '1.25rem',
    height: '1.25rem',
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.secondary.main,
    color: palette.background.default,
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
