import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Box } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useTrackEvent } from '@/GA';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { useProjectType } from '@/[fsd]/shared/lib/hooks';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { useApplicationListQuery } from '@/api/applications';
import { useLazyToolkitsDetailsQuery } from '@/api/toolkits';
import PlusIcon from '@/assets/plus-icon.svg?react';
import { SearchParams, VITE_BASE_URI } from '@/common/constants';
import { HEIGHTS, ICON_SIZES, SPACING } from '@/common/designTokens';
import EntityIcon from '@/components/EntityIcon';
import UnifiedDropdown, { DROPDOWN_CONSTANTS } from '@/components/UnifiedDropdown';
import { useAgentPipelineAssociation } from '@/hooks/application/useAgentPipelineAssociation.jsx';
import { useFilterAddedItems } from '@/hooks/application/useFilterAddedItems.js';
import { useLibraryToolkits } from '@/hooks/application/useLibraryToolkits';
import useDebounceValue from '@/hooks/useDebounceValue';
import { useIsFrom } from '@/hooks/useIsFromSpecificPageHooks';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes.js';
import { actions } from '@/slices/search';

const pageSize = 20;

// Component-specific constants for ToolMenu
const TOOL_MENU_CONSTANTS = {
  TIMEOUTS: {
    DEBOUNCE: 300,
    FOCUS_RETRY_1: 50,
    FOCUS_RETRY_2: 150,
    FOCUS_RETRY_3: 300,
    ASYNC_DELAY: 1000,
  },
  DIMENSIONS: {
    MENU_WIDTH: '228px', // Exact Figma width
    MENU_MAX_HEIGHT: '373px', // Set maxHeight instead of fixed height
    ITEM_HEIGHT: HEIGHTS.buttonLarge, // 40px
    SEARCH_FIELD_HEIGHT: '32px', // Figma height
    ICON_SIZE: ICON_SIZES.MD, // 20px
    SMALL_ICON_SIZE: '12px',
  },
  SPACING: {
    BUTTON_GAP: SPACING.gap.SM, // 8px
    BUTTON_ICON_GAP: SPACING.gap.XS, // 6px
    MENU_PADDING: '4px 0px', // Figma padding
    MENU_TOP_MARGIN: SPACING.SM, // 8px
    ITEM_ICON_TEXT_GAP: SPACING.gap.MD, // 12px (Figma gap between icon and text)
    ITEM_REGULAR_GAP: SPACING.gap.SM, // 8px (Figma gap for regular items)
  },
  BORDER_RADIUS: {
    MENU: SPACING.SM, // 8px
  },
};

const ToolMenu = memo(props => {
  const { applicationId } = props;

  const styles = useMemo(() => toolMenuStyles(), []);

  const trackEvent = useTrackEvent();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toastSuccess } = useToast();
  const formik = useFormikContext();
  const { values = {} } = formik || {};
  const projectId = useSelectedProjectId();

  const { projectType } = useProjectType();

  const isFromAgents = useIsFrom(RouteDefinitions.Applications);
  const isFromPipelines = useIsFrom(RouteDefinitions.Pipelines);

  // Extract version ID from Formik context
  const versionId = values?.version_details?.id;

  // Determine entity type for context-aware messaging
  const entityType = values?.version_details?.agent_type === 'pipeline' ? 'pipeline' : 'agent';

  // Ref to track processed toolkit IDs to prevent double processing
  const processedToolkitIds = useRef(new Set());

  // Determine if the current entity is unsaved (newly created but not yet persisted)
  // An entity is considered unsaved if it doesn't have an ID or version_details.id
  const isEntityUnsaved = !values?.id || !values?.version_details?.id;

  // Use the hook to filter out already-added items
  const { filterToolkits, filterAgents, filterPipelines } = useFilterAddedItems();

  // State for managing which dropdown is open
  const [toolkitAnchor, setToolkitAnchor] = useState(null);
  const [mcpAnchor, setMCPAnchor] = useState(null);
  const [agentAnchor, setAgentAnchor] = useState(null);
  const [pipelineAnchor, setPipelineAnchor] = useState(null);

  // Search states for each dropdown
  const [toolkitSearch, setToolkitSearch] = useState('');
  const debouncedToolkitSearch = useDebounceValue(toolkitSearch, 200);
  const [mcpSearch, setMCPSearch] = useState('');
  const debouncedMCPSearch = useDebounceValue(mcpSearch, 200);
  const [agentSearch, setAgentSearch] = useState('');
  const debouncedAgentSearch = useDebounceValue(agentSearch, 200);
  const [pipelineSearch, setPipelineSearch] = useState('');
  const debouncedPipelineSearch = useDebounceValue(pipelineSearch, 200);

  // Ref for the search input to handle auto-focus
  const toolkitSearchRef = useRef(null);

  // Note: Removed createNewAnchor state as we're navigating instead of showing submenu

  // Note: Removed toolMenuItems as we're not using the submenu anymore

  // Use the new agent/pipeline association hook
  const { handleAssociateAgent } = useAgentPipelineAssociation(applicationId, versionId);

  // Lazy query to fetch toolkit details by ID
  const [fetchToolkitDetails] = useLazyToolkitsDetailsQuery();

  // Handle toolkit selection from library
  const handleSelectToolkitFromLibrary = useCallback(
    t => {
      // The association is handled in useLibraryToolkits hook
      setToolkitAnchor(null); // Close dropdown after selection
      setToolkitSearch(''); // Clear search when item is selected

      if (isFromAgents || isFromPipelines) {
        const entity = isFromAgents ? 'agent' : 'pipeline';
        if (t?.type === 'mcp')
          trackEvent(GA_EVENT_NAMES.MCP_ATTACHED, {
            [GA_EVENT_PARAMS.MCP_TYPE]: t?.type || 'unknown',
            [GA_EVENT_PARAMS.MCP_NAME]: t?.name || 'unknown',
            [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString().split('T')[0],
            [GA_EVENT_PARAMS.PROJECT_TYPE]: projectType,
            [GA_EVENT_PARAMS.ENTITY]: entity,
          });
        else
          trackEvent(GA_EVENT_NAMES.TOOLKIT_ATTACHED, {
            [GA_EVENT_PARAMS.TOOLKIT_TYPE]: t?.type || 'unknown',
            [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString().split('T')[0],
            [GA_EVENT_PARAMS.PROJECT_TYPE]: projectType,
            [GA_EVENT_PARAMS.ENTITY]: entity,
          });
      }

      // Note: Success message is handled by the useLibraryToolkits hook
      // Don't show duplicate messages here
    },
    [isFromAgents, isFromPipelines, projectType, trackEvent],
  );

  // Load toolkits from library
  const {
    menuItems: libraryToolkits,
    isFetching: isFetchingToolkits,
    handleAssociateToolkit,
    onLoadMoreToolkits,
  } = useLibraryToolkits(handleSelectToolkitFromLibrary, applicationId, versionId, formik);

  const {
    menuItems: libraryMCPs,
    isFetching: isFetchingMCPs,
    onLoadMoreToolkits: onLoadMoreMCPs,
  } = useLibraryToolkits(handleSelectToolkitFromLibrary, applicationId, versionId, formik, true);

  // Function to handle adding newly created toolkit
  const handleAddNewlyCreatedToolkit = useCallback(
    async (toolkitId, isMCP) => {
      // Wait for 1 second to ensure toolkit is properly created in backend
      await new Promise(resolve => setTimeout(resolve, TOOL_MENU_CONSTANTS.TIMEOUTS.ASYNC_DELAY));

      try {
        // First, fetch the toolkit details to get the correct name and data
        const toolkitDetails = await fetchToolkitDetails({
          projectId,
          toolkitId,
        }).unwrap();

        // Now associate the toolkit with proper data
        await handleAssociateToolkit(toolkitDetails, isMCP);

        // Success message is handled by handleAssociateToolkit

        // Clean up URL parameters after successful association
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('newToolkitId');
        setSearchParams(newSearchParams, { replace: true });
      } catch {
        // Enhanced fallback message - context-aware for when toolkit details can't be fetched
        toastSuccess(`The toolkit has been successfully added to the ${entityType}.`);

        // Clean up URL parameters even on error
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('newToolkitId');
        setSearchParams(newSearchParams, { replace: true });
      }
    },
    [
      fetchToolkitDetails,
      projectId,
      handleAssociateToolkit,
      toastSuccess,
      entityType,
      searchParams,
      setSearchParams,
    ],
  );

  // Check for newly created toolkit that should be automatically added
  useEffect(() => {
    const newToolkitId = searchParams.get('newToolkitId');
    const isMCP = searchParams.get('mcp');

    if (newToolkitId && applicationId && versionId && !isEntityUnsaved) {
      // Check if we've already processed this toolkit ID
      if (!processedToolkitIds.current.has(newToolkitId)) {
        // Mark this toolkit ID as processed
        processedToolkitIds.current.add(newToolkitId);

        // Auto-add the newly created toolkit
        handleAddNewlyCreatedToolkit(newToolkitId, isMCP);
      }
    }
  }, [searchParams, applicationId, versionId, isEntityUnsaved, handleAddNewlyCreatedToolkit]);

  // Auto-focus search input when toolkit menu opens
  useEffect(() => {
    if (toolkitAnchor) {
      // Use a longer timeout and try multiple methods to ensure focus works
      const focusInput = () => {
        if (toolkitSearchRef.current) {
          // Method 1: Try direct focus on the ref
          toolkitSearchRef.current.focus?.();

          // Method 2: Try querySelector for input element
          const inputElement = toolkitSearchRef.current.querySelector('input');
          if (inputElement) {
            inputElement.focus();
            return;
          }

          // Method 3: Try querySelector for textarea (in case it's multiline)
          const textareaElement = toolkitSearchRef.current.querySelector('textarea');
          if (textareaElement) {
            textareaElement.focus();
            return;
          }
        }
      };

      // Array to store timeout IDs
      const timeoutIds = [];

      // Try multiple times with increasing delays to ensure the menu is fully rendered
      timeoutIds.push(setTimeout(focusInput, TOOL_MENU_CONSTANTS.TIMEOUTS.FOCUS_RETRY_1));
      timeoutIds.push(setTimeout(focusInput, TOOL_MENU_CONSTANTS.TIMEOUTS.FOCUS_RETRY_2));
      timeoutIds.push(setTimeout(focusInput, TOOL_MENU_CONSTANTS.TIMEOUTS.FOCUS_RETRY_3));

      // Cleanup function to clear timeouts
      return () => {
        timeoutIds.forEach(clearTimeout);
      };
    }
  }, [toolkitAnchor]);

  // Event handlers
  // Event handlers
  const handleMCPButtonClick = useCallback(e => setMCPAnchor(e.currentTarget), []);
  const handleToolkitButtonClick = useCallback(e => setToolkitAnchor(e.currentTarget), []);
  const handleAgentButtonClick = useCallback(e => setAgentAnchor(e.currentTarget), []);
  const handlePipelineButtonClick = useCallback(e => setPipelineAnchor(e.currentTarget), []);

  const handleMCPMenuClose = useCallback(() => {
    setMCPAnchor(null);
    setToolkitSearch(''); // Clear search when menu closes
  }, []);
  const handleToolkitMenuClose = useCallback(() => {
    setToolkitAnchor(null);
    setToolkitSearch(''); // Clear search when menu closes
  }, []);
  const handleAgentMenuClose = useCallback(() => {
    setAgentAnchor(null);
    setAgentSearch(''); // Clear search when menu closes
  }, []);
  const handlePipelineMenuClose = useCallback(() => {
    setPipelineAnchor(null);
    setPipelineSearch(''); // Clear search when menu closes
  }, []);

  const handleToolkitSearchChange = useCallback(e => setToolkitSearch(e.target.value), []);
  const handleMCPSearchChange = useCallback(e => setMCPSearch(e.target.value), []);
  const handleAgentSearchChange = useCallback(e => setAgentSearch(e.target.value), []);
  const handlePipelineSearchChange = useCallback(e => setPipelineSearch(e.target.value), []);

  // Handle create new toolkit - navigate to toolkit creation page
  const handleCreateNewToolkit = useCallback(
    isMCP => () => {
      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;
      let returnUrl;
      // Detect if we are on the chat page
      if (currentPath.startsWith('/chat/')) {
        // Parse current search params
        const currentParams = new URLSearchParams(currentSearch);
        // If 'edited_participant_id' is present, preserve it for AgentEditor restoration
        const editedParticipantId = searchParams.get(SearchParams.EditedParticipantId);
        if (editedParticipantId) {
          currentParams.set(SearchParams.EditedParticipantId, editedParticipantId);
        }
        if (isMCP) {
          currentParams.set(SearchParams.IsMCP, 'true');
        }
        // For now, just preserve all currentParams (including participant_id if present)
        returnUrl = encodeURIComponent(currentPath + '?' + currentParams.toString());
      } else {
        // For non-chat pages, keep previous logic and force destTab=Configuration
        const currentParams = new URLSearchParams(currentSearch);
        currentParams.set(SearchParams.DestTab, 'Configuration');
        if (isMCP) {
          currentParams.set(SearchParams.IsMCP, 'true');
        }
        returnUrl = encodeURIComponent(currentPath + '?' + currentParams.toString());
      }
      // Navigate to create toolkit page with source application context
      const createToolkitUrl = `${isMCP ? RouteDefinitions.CreateMCP : RouteDefinitions.CreateToolkit}?${SearchParams.SourceApplicationId}=${applicationId}&${SearchParams.ReturnUrl}=${returnUrl.replace(encodeURIComponent(`${VITE_BASE_URI}/`), '')}`;
      navigate(createToolkitUrl);
      setToolkitAnchor(null); // Close the toolkit dropdown
      setToolkitSearch(''); // Clear search
    },
    [navigate, applicationId, searchParams],
  );

  const [agentPage, setAgentPage] = useState(0);

  // Load agents (applications) with type 'classic'
  const { data: agentsData, isFetching: isAgentsLoading } = useApplicationListQuery(
    {
      projectId,
      page: agentPage,
      pageSize,
      params: {
        agents_type: 'classic',
        sort_by: 'created_at',
        sort_order: 'desc',
        query: debouncedAgentSearch, // Server-side filtering based on search
      },
    },
    {
      skip: !projectId,
    },
  );

  useEffect(() => {
    setAgentPage(0);
  }, [agentSearch, projectId]);

  const handleAgentScroll = useCallback(() => {
    if (isAgentsLoading || agentPage * pageSize >= (agentsData?.total || 0)) return;
    setAgentPage(prev => prev + 1);
  }, [isAgentsLoading, agentPage, agentsData?.total]);

  // Load pipelines (applications) with type 'pipeline'
  const [pipelinePage, setPipelinePage] = useState(0);
  const { data: pipelinesData, isFetching: isPipelinesLoading } = useApplicationListQuery(
    {
      projectId,
      page: pipelinePage,
      pageSize,
      params: {
        agents_type: 'pipeline',
        sort_by: 'created_at',
        sort_order: 'desc',
        query: debouncedPipelineSearch, // Server-side filtering based on search
      },
    },
    {
      skip: !projectId,
    },
  );

  useEffect(() => {
    setPipelinePage(0);
  }, [pipelineSearch, projectId]);

  const handlePipelineScroll = useCallback(() => {
    if (isPipelinesLoading || pipelinePage * pageSize >= (pipelinesData?.total || 0)) return;
    setPipelinePage(prev => prev + 1);
  }, [isPipelinesLoading, pipelinePage, pipelinesData?.total]);

  // Transform agents data for menu display
  const agentMenuItems = useMemo(() => {
    if (!agentsData?.rows) return [];

    return agentsData.rows
      .filter(agent => agent.id !== applicationId)
      .filter(agent => !agent.has_swarm)
      .map(agent => ({
        key: `agent-${agent.id}`,
        label: agent.name,
        description: agent.description,
        data: agent, // Store the full agent data
        icon: (
          <EntityIcon
            sx={styles.entityIcon}
            imageStyle={styles.entityImageStyle}
            icon={agent.icon_meta}
            entityType={'application'}
            projectId={projectId}
            editable={false}
            specifiedFontSize={DROPDOWN_CONSTANTS.DIMENSIONS.ICON_SVG_SIZE}
          />
        ),
        onClick: async () => {
          // Handle agent selection - associate as toolkit
          await handleAssociateAgent(agent);
          setAgentAnchor(null);
          setAgentSearch(''); // Clear search when item is selected
        },
      }));
  }, [
    agentsData?.rows,
    applicationId,
    projectId,
    handleAssociateAgent,
    styles.entityIcon,
    styles.entityImageStyle,
  ]);

  // Transform pipelines data for menu display
  const pipelineMenuItems = useMemo(() => {
    if (!pipelinesData?.rows) return [];

    return pipelinesData.rows
      .filter(pipeline => pipeline.id !== applicationId)
      .map(pipeline => ({
        key: `pipeline-${pipeline.id}`,
        label: pipeline.name,
        description: pipeline.description,
        data: pipeline, // Store the full pipeline data
        has_interrupt: pipeline.has_interrupt,
        icon: (
          <EntityIcon
            sx={styles.entityIcon}
            imageStyle={styles.entityImageStyle}
            icon={pipeline.icon_meta}
            entityType={'pipeline'}
            projectId={projectId}
            editable={false}
            specifiedFontSize={DROPDOWN_CONSTANTS.DIMENSIONS.ICON_SVG_SIZE}
          />
        ),
        onClick: async () => {
          // Handle pipeline selection - associate as toolkit
          await handleAssociateAgent(pipeline, true);
          setPipelineAnchor(null);
          setPipelineSearch(''); // Clear search when item is selected
        },
      }));
  }, [
    pipelinesData?.rows,
    applicationId,
    projectId,
    handleAssociateAgent,
    styles.entityIcon,
    styles.entityImageStyle,
  ]);

  // Filter agent items based on search and exclude already-added agents
  const filteredAgentItems = useMemo(() => {
    if (!agentMenuItems) return [];
    const availableAgents = filterAgents(agentMenuItems);
    return availableAgents
      .filter(agent => agent.label.toLowerCase().includes(agentSearch.toLowerCase()))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [agentMenuItems, agentSearch, filterAgents]);

  // Filter pipeline items based on search and exclude already-added pipelines
  const filteredPipelineItems = useMemo(() => {
    if (!pipelineMenuItems) return [];
    const availablePipelines = filterPipelines(pipelineMenuItems);
    return availablePipelines
      .filter(pipeline => pipeline.label.toLowerCase().includes(pipelineSearch.toLowerCase()))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [pipelineMenuItems, pipelineSearch, filterPipelines]);

  // Filter toolkit items based on search and exclude already-added toolkits (regular toolkits only)
  const allToolkitItems = useMemo(() => {
    if (!libraryToolkits) return [];
    const availableToolkits = filterToolkits(libraryToolkits);
    return availableToolkits.map(item => ({
      ...item,
      icon: (
        <EntityIcon
          sx={styles.entityIcon}
          imageStyle={styles.entityImageStyle}
          icon={{ component: item.icon }}
          editable={false}
          specifiedFontSize={DROPDOWN_CONSTANTS.DIMENSIONS.ICON_SVG_SIZE}
        />
      ),
    }));
  }, [libraryToolkits, filterToolkits, styles.entityIcon, styles.entityImageStyle]);

  useEffect(() => {
    dispatch(actions.setQuery({ query: debouncedToolkitSearch, queryTags: [] }));
  }, [dispatch, debouncedToolkitSearch]);

  // Handle scroll event to detect when user reaches the end
  const handleToolkitScroll = useCallback(() => {
    if (!isFetchingToolkits) {
      // Only load more if we have items (prevents loading on empty state)
      onLoadMoreToolkits();
    }
  }, [onLoadMoreToolkits, isFetchingToolkits]);

  // Filter mcp items based on search and exclude already-added toolkits (regular toolkits only)
  const filteredMCPItems = useMemo(() => {
    if (!libraryMCPs) return [];
    const availableMCPs = filterToolkits(libraryMCPs);
    return availableMCPs
      .filter(mcp => mcp.label.toLowerCase().includes(mcpSearch.toLowerCase()))
      .sort((a, b) => a.label.localeCompare(b.label))
      .map(item => ({
        ...item,
        icon: (
          <EntityIcon
            sx={styles.entityIcon}
            imageStyle={styles.entityImageStyle}
            icon={{ component: item.icon }}
            editable={false}
            specifiedFontSize={DROPDOWN_CONSTANTS.DIMENSIONS.ICON_SVG_SIZE}
          />
        ),
      }));
  }, [libraryMCPs, mcpSearch, filterToolkits, styles.entityIcon, styles.entityImageStyle]);

  const allMCPItems = useMemo(() => {
    // For the mcp button dropdown, show only regular mcp (not agents/pipelines)
    return filteredMCPItems.sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredMCPItems]);

  useEffect(() => {
    dispatch(actions.setQuery({ query: debouncedMCPSearch, queryTags: [] }));
  }, [dispatch, debouncedMCPSearch]);

  // Handle scroll event to detect when user reaches the end
  const handleMCPScroll = useCallback(() => {
    if (!isFetchingMCPs) {
      // Only load more if we have items (prevents loading on empty state)
      onLoadMoreMCPs();
    }
  }, [onLoadMoreMCPs, isFetchingMCPs]);

  return (
    <>
      <Box sx={styles.container}>
        {/* Toolkit Button */}
        <Tooltip
          title={
            isEntityUnsaved
              ? `Save the ${values?.version_details?.agent_type === 'pipeline' ? 'pipeline' : 'agent'} first, then add toolkits`
              : ''
          }
          placement="top"
        >
          <Box component="span">
            <BaseBtn
              variant={BUTTON_VARIANTS.iconLabel}
              startIcon={<PlusIcon />}
              disableRipple
              disabled={isEntityUnsaved}
              onClick={isEntityUnsaved ? undefined : handleToolkitButtonClick}
            >
              Toolkit
            </BaseBtn>
          </Box>
        </Tooltip>
        {/* Toolkit Button */}
        <Tooltip
          title={
            isEntityUnsaved
              ? `Save the ${values?.version_details?.agent_type === 'pipeline' ? 'pipeline' : 'agent'} first, then add mcps`
              : ''
          }
          placement="top"
        >
          <Box component="span">
            <BaseBtn
              variant={BUTTON_VARIANTS.iconLabel}
              startIcon={<PlusIcon />}
              disableRipple
              disabled={isEntityUnsaved}
              onClick={isEntityUnsaved ? undefined : handleMCPButtonClick}
            >
              MCP
            </BaseBtn>
          </Box>
        </Tooltip>
        {/* Agent Button */}
        <Tooltip
          title={
            isEntityUnsaved
              ? `Save the ${values?.version_details?.agent_type === 'pipeline' ? 'pipeline' : 'agent'} first, then add agents`
              : ''
          }
          placement="top"
        >
          <Box component="span">
            <BaseBtn
              variant={BUTTON_VARIANTS.iconLabel}
              startIcon={<PlusIcon />}
              disableRipple
              disabled={isEntityUnsaved}
              onClick={isEntityUnsaved ? undefined : handleAgentButtonClick}
            >
              Agent
            </BaseBtn>
          </Box>
        </Tooltip>

        {/* Pipeline Button */}
        <Tooltip
          title={
            isEntityUnsaved
              ? `Save the ${values?.version_details?.agent_type === 'pipeline' ? 'pipeline' : 'agent'} first, then add pipelines`
              : ''
          }
          placement="top"
        >
          <Box component="span">
            <BaseBtn
              variant={BUTTON_VARIANTS.iconLabel}
              startIcon={<PlusIcon />}
              disableRipple
              disabled={isEntityUnsaved}
              onClick={isEntityUnsaved ? undefined : handlePipelineButtonClick}
            >
              Pipeline
            </BaseBtn>
          </Box>
        </Tooltip>
      </Box>

      {/* Toolkit Dropdown */}
      <UnifiedDropdown
        anchorEl={toolkitAnchor}
        open={Boolean(toolkitAnchor)}
        onClose={handleToolkitMenuClose}
        items={allToolkitItems}
        searchValue={toolkitSearch}
        onSearchChange={handleToolkitSearchChange}
        searchPlaceholder="Search toolkits..."
        onCreateNew={handleCreateNewToolkit()}
        createNewLabel="Create new"
        showCreateNew={true}
        isLoading={isFetchingToolkits}
        emptyMessage="No toolkits available"
        noResultsMessage="No toolkits found"
        onScroll={handleToolkitScroll}
        autoFocus={true}
        showDivider={true}
      />

      {/* MCP Dropdown */}
      <UnifiedDropdown
        anchorEl={mcpAnchor}
        open={Boolean(mcpAnchor)}
        onClose={handleMCPMenuClose}
        items={allMCPItems}
        searchValue={mcpSearch}
        onSearchChange={handleMCPSearchChange}
        searchPlaceholder="Search mcps..."
        onCreateNew={handleCreateNewToolkit(true)}
        createNewLabel="Create new"
        showCreateNew={true}
        isLoading={isFetchingMCPs}
        emptyMessage="No mcps available"
        noResultsMessage="No mcps found"
        onScroll={handleMCPScroll}
        autoFocus={true}
        showDivider={true}
      />

      {/* Agent Dropdown */}
      <UnifiedDropdown
        anchorEl={agentAnchor}
        open={Boolean(agentAnchor)}
        onClose={handleAgentMenuClose}
        items={filteredAgentItems}
        searchValue={agentSearch}
        onSearchChange={handleAgentSearchChange}
        searchPlaceholder="Search agents..."
        showCreateNew={false}
        isLoading={isAgentsLoading}
        emptyMessage="No agents available"
        noResultsMessage="No agents found"
        autoFocus={true}
        showDivider={true}
        onScroll={handleAgentScroll}
      />

      {/* Pipeline Dropdown */}
      <UnifiedDropdown
        anchorEl={pipelineAnchor}
        open={Boolean(pipelineAnchor)}
        onClose={handlePipelineMenuClose}
        items={filteredPipelineItems}
        searchValue={pipelineSearch}
        onSearchChange={handlePipelineSearchChange}
        searchPlaceholder="Search pipelines..."
        showCreateNew={false}
        isLoading={isPipelinesLoading}
        emptyMessage="No pipelines available"
        noResultsMessage="No pipelines found"
        autoFocus={true}
        showDivider={true}
        onScroll={handlePipelineScroll}
      />
    </>
  );
});

ToolMenu.displayName = 'ToolMenu';

/** @type {MuiSx} */
const toolMenuStyles = () => ({
  container: {
    display: 'flex',
    gap: TOOL_MENU_CONSTANTS.SPACING.BUTTON_GAP,
    alignItems: 'center',
    maxWidth: '100%',
    flexWrap: 'wrap',
  },
  entityIcon: {
    minWidth: `${TOOL_MENU_CONSTANTS.DIMENSIONS.ICON_SIZE} !important`,
    width: `${TOOL_MENU_CONSTANTS.DIMENSIONS.ICON_SIZE} !important`,
    height: `${TOOL_MENU_CONSTANTS.DIMENSIONS.ICON_SIZE} !important`,
    '& > div': {
      width: TOOL_MENU_CONSTANTS.DIMENSIONS.ICON_SIZE,
      height: TOOL_MENU_CONSTANTS.DIMENSIONS.ICON_SIZE,
    },
    '& svg': {
      width: DROPDOWN_CONSTANTS.DIMENSIONS.ICON_SVG_SIZE,
      height: DROPDOWN_CONSTANTS.DIMENSIONS.ICON_SVG_SIZE,
      fontSize: DROPDOWN_CONSTANTS.DIMENSIONS.ICON_SVG_SIZE,
    },
  },
  entityImageStyle: {
    width: TOOL_MENU_CONSTANTS.DIMENSIONS.ICON_SIZE,
    height: TOOL_MENU_CONSTANTS.DIMENSIONS.ICON_SIZE,
    borderRadius: '50%',
  },
});

export default ToolMenu;
