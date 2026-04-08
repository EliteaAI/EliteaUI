import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import {
  Box,
  CircularProgress,
  ClickAwayListener,
  FormControl,
  FormHelperText,
  IconButton,
  Popper,
  SvgIcon,
  Tooltip,
  Typography,
} from '@mui/material';
import MenuItem from '@mui/material/MenuItem';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { apiSlice } from '@/api/applications';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import RefreshIcon from '@/assets/refresh-icon.svg?react';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import ArrowDownIcon from './Icons/ArrowDownIcon';
import Person from './Icons/Person';

const AgentSelect = memo(
  ({
    label = 'Agent',
    type = 'agent', // 'agent' or 'pipeline' - determines the API filter and field mapping
    required,
    error,
    helperText,
    value, // For single: { id: number, version_id: number, name?: string } | For multiple: [{ id, version_id, name }]
    onSelectAgent, // Callback for selection change (keeping same name for backward compatibility)
    sx,
    disabled,
    multiple = false,
    filters = {}, // Filters from schema (e.g. { agent_tags: ['skill'] })
    showBorder = false,
  }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [versionAnchorEl, setVersionAnchorEl] = useState(null);
    const [selectedAgentForVersion, setSelectedAgentForVersion] = useState(null);
    const panelRef = useRef(null);
    const versionPanelRef = useRef(null);
    const open = Boolean(anchorEl);
    const versionOpen = Boolean(versionAnchorEl);
    const { personal_project_id } = useSelector(state => state.user);
    const selectedProjectId = useSelectedProjectId();

    // Use applications API with agent filter
    const [getAgents, { isFetching }] = apiSlice.useLazyApplicationListQuery();
    const [getItemDetails, { isFetching: isFetchingVersions }] = apiSlice.useLazyApplicationDetailsQuery();

    const [hasFetchedData, setHasFetchedData] = useState(false);
    const [agents, setAgents] = useState([]);
    const [versions, setVersions] = useState([]);

    const serializedFilters = JSON.stringify(filters);

    const onRefresh = useCallback(
      async event => {
        event?.stopPropagation();
        setAgents([]);
        setHasFetchedData(false);
        let teamProjectItems = [];

        const queryParams = {
          agents_type: type === 'agent' ? 'classic' : 'pipeline', // Dynamic filter based on type
          ...JSON.parse(serializedFilters),
        };

        if (selectedProjectId) {
          const { data } = await getAgents({
            projectId: selectedProjectId,
            page: 0,
            pageSize: 500,
            params: queryParams,
          });
          teamProjectItems = [
            ...(data?.rows || []).map(item => ({
              ...item,
              id: `${item.id}_${selectedProjectId}`, // Unified ID pattern
              original_id: item.id, // Keep original ID for API calls
              project_id: selectedProjectId,
            })),
          ];
        }

        if (personal_project_id && personal_project_id !== selectedProjectId) {
          const { data } = await getAgents({
            projectId: personal_project_id,
            page: 0,
            pageSize: 500,
            params: queryParams,
          });
          teamProjectItems = [
            ...teamProjectItems,
            ...(data?.rows || []).map(item => ({
              ...item,
              id: `${item.id}_${personal_project_id}`, // Unified ID pattern
              original_id: item.id, // Keep original ID for API calls
              project_id: personal_project_id,
            })),
          ];
        }

        // Remove duplicates by unified ID and filter by tags if provided
        let uniqueItems = teamProjectItems.reduce((acc, item) => {
          if (!acc.find(existing => existing.id === item.id)) {
            acc.push(item);
          }
          return acc;
        }, []);

        // Apply tag filtering - use dynamic tag field based on type
        const tagField = type === 'agent' ? 'agent_tags' : 'pipeline_tags';
        if (filters[tagField] && filters[tagField].length > 0) {
          uniqueItems = uniqueItems.filter(
            item => item.tags && item.tags.some(tag => filters[tagField].includes(tag.name || tag)),
          );
        }

        setHasFetchedData(true);
        setAgents(uniqueItems);
      },
      [getAgents, personal_project_id, selectedProjectId, serializedFilters, filters, type],
    );

    useEffect(() => {
      onRefresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProjectId, personal_project_id]);

    const handleFocus = useCallback(() => {
      if (disabled) {
        return;
      }
      setAnchorEl(anchorEl ? null : panelRef.current);
    }, [anchorEl, disabled]);

    const handleClickAway = useCallback(() => {
      setAnchorEl(null);
      setVersionAnchorEl(null);
    }, []);

    // Load versions for a specific agent or pipeline
    const loadVersions = useCallback(
      async item => {
        if (!item) return;

        try {
          // Get the correct application ID - use agent_id for both agents and pipelines
          // as both are stored with agent_id in the menu data structure
          const applicationId = item.agent_id;

          if (!applicationId) {
            setVersions([]);
            return;
          }

          // Both agents and pipelines use the same applicationDetails API
          // The backend treats both as "applications"
          const { data } = await getItemDetails({
            projectId: item.project_id,
            applicationId,
          });

          const itemVersions = (data?.versions || [])
            .map(version => ({
              id: parseInt(version.id, 10),
              name: version.name || 'Unnamed version',
              created_at: version.created_at,
              status: version.status,
              isLatest: version.name === LATEST_VERSION_NAME,
            }))
            .filter(v => !isNaN(v.id) && v.id > 0)
            .sort((a, b) => {
              // Latest version always comes first
              if (a.isLatest && !b.isLatest) return -1;
              if (!a.isLatest && b.isLatest) return 1;
              // Sort by creation date (newest first)
              const dateA = new Date(a.created_at || 0);
              const dateB = new Date(b.created_at || 0);
              return dateB.getTime() - dateA.getTime();
            });

          setVersions(itemVersions);
        } catch {
          // Failed to load versions, set empty array
          setVersions([]);
        }
      },
      [getItemDetails],
    );

    // Items menu data (works for both agents and pipelines)
    const agentsMenuData = useMemo(() => {
      return agents.map(agent => {
        const isAgentPersonal = agent.project_id === personal_project_id;
        const isPipeline = agent.agent_type === 'pipeline';

        // Use original_id for both agents and pipelines since we set it in onRefresh
        const applicationId = agent.original_id || agent.id;

        return {
          id: agent.id,
          agent_id: applicationId, // Keep this name for backward compatibility
          name: agent.name,
          description: agent.description,
          tags: agent.tags,
          project_id: agent.project_id,
          private: isAgentPersonal,
          type: isPipeline ? 'pipeline' : 'agent',
          label: (
            <span style={styles.labelContainer}>
              {isAgentPersonal ? (
                <Person
                  key="person-icon"
                  fontSize="1rem"
                />
              ) : (
                <BriefcaseIcon
                  key="briefcase-icon"
                  fontSize="1rem"
                />
              )}
              <span key="label-text">{agent.name}</span>
            </span>
          ),
        };
      });
    }, [agents, personal_project_id]);

    // Find the selected option(s)
    const selectedOption = useMemo(() => {
      if (multiple) {
        const selectedValues = Array.isArray(value) ? value : [];
        return agentsMenuData.filter(option =>
          selectedValues.some(v => option.agent_id === v.id && v.version_id),
        );
      }
      return agentsMenuData.find(option => option.agent_id === value?.id);
    }, [agentsMenuData, value, multiple]);

    const onSelectItem = useCallback(
      async option => {
        if (multiple) {
          const currentValues = Array.isArray(value) ? value : [];
          const isSelected = currentValues.some(v => v.id === option.agent_id && v.version_id);

          if (isSelected) {
            // Remove from selection - remove all entries with this agent_id
            const newValues = currentValues.filter(v => v.id !== option.agent_id);
            onSelectAgent(newValues);
          } else {
            // Add to selection - need to show version selector
            setSelectedAgentForVersion(option);
            await loadVersions(option);
            // Don't close main dropdown for multiple select
            setVersionAnchorEl(versionPanelRef.current);
          }
        } else {
          // Single select - show version selector
          setSelectedAgentForVersion(option);
          await loadVersions(option);
          setAnchorEl(null); // Close main dropdown
          setVersionAnchorEl(versionPanelRef.current); // Open version dropdown
        }
      },
      [multiple, onSelectAgent, value, loadVersions],
    );

    const onSelectVersion = useCallback(
      version => {
        if (!selectedAgentForVersion) return;

        const agentWithVersion = {
          id: selectedAgentForVersion.agent_id,
          version_id: version.id,
          name: selectedAgentForVersion.name,
        };

        if (multiple) {
          const currentValues = Array.isArray(value) ? value : [];
          const newValues = [...currentValues, agentWithVersion];
          onSelectAgent(newValues);
          // Keep main dropdown open for multiple select
        } else {
          onSelectAgent(agentWithVersion);
          // Close all dropdowns for single select
          setAnchorEl(null);
        }

        setVersionAnchorEl(null);
        setSelectedAgentForVersion(null);
        setVersions([]);
      },
      [selectedAgentForVersion, multiple, value, onSelectAgent],
    );

    const onClick = useCallback(
      option => () => {
        if (!disabled) {
          onSelectItem(option);
        }
      },
      [disabled, onSelectItem],
    );

    const onVersionClick = useCallback(
      version => () => {
        onSelectVersion(version);
      },
      [onSelectVersion],
    );

    const getDisplayValue = () => {
      if (multiple && selectedOption && selectedOption.length > 0) {
        return selectedOption
          .map(opt => {
            const versionLabel =
              opt.version_id === LATEST_VERSION_NAME || !opt.version_id
                ? LATEST_VERSION_NAME
                : `v${opt.version_id}`;
            return `${opt.name} (${versionLabel})`;
          })
          .join(', ');
      }
      if (selectedOption && value?.version_id) {
        const versionLabel =
          value.version_id === LATEST_VERSION_NAME ? LATEST_VERSION_NAME : `v${value.version_id}`;
        return `${selectedOption.name} (${versionLabel})`;
      }
      return selectedOption ? selectedOption.name : !open ? `Select ${type}` : '';
    };

    const formatVersionDisplayText = useCallback(version => {
      if (version.isLatest) return LATEST_VERSION_NAME;

      const versionName = version.name || 'Unnamed version';

      if (version.created_at) {
        try {
          const date = new Date(version.created_at);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          const formattedDate = `${day}.${month}.${year}`;

          return `${versionName} – ${formattedDate}`;
        } catch {
          return versionName;
        }
      }

      return versionName;
    }, []);

    return (
      <>
        <ClickAwayListener onClickAway={handleClickAway}>
          <Box
            sx={sx}
            ref={panelRef}
          >
            <Box
              onClick={handleFocus}
              sx={showBorder ? styles.clickableBox(error, open) : {}}
            >
              {showBorder && (
                <Box sx={styles.labelBox}>
                  <Typography
                    variant="bodySmall"
                    sx={styles.labelTypography(open)}
                  >
                    {label}
                    {required && <span> *</span>}
                  </Typography>
                  <Tooltip
                    title={`Refresh the ${type}s`}
                    placement="top"
                  >
                    <IconButton
                      variant="elitea"
                      color="tertiary"
                      onClick={onRefresh}
                      disabled={disabled}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
              {/* Render selected value */}
              <Box sx={styles.selectedValueBox}>
                <Typography
                  variant="bodyMedium"
                  sx={styles.selectedValueTypography(selectedOption)}
                >
                  {getDisplayValue()}
                </Typography>
                <SvgIcon
                  viewBox="0 0 16 16"
                  sx={styles.arrowIcon(open)}
                >
                  <ArrowDownIcon />
                </SvgIcon>
              </Box>
            </Box>
            {error && helperText && (
              <FormControl error>
                <FormHelperText>{error ? helperText : undefined}</FormHelperText>
              </FormControl>
            )}
            {value && !selectedOption && hasFetchedData && (
              <FormControl error>
                <FormHelperText>{`Your selection does not match any available ${type}s.`}</FormHelperText>
              </FormControl>
            )}

            {/* Item Selection Dropdown */}
            <Popper
              open={open}
              anchorEl={panelRef.current}
              placement="bottom-start"
              style={styles.popper(panelRef)}
            >
              <Box sx={styles.popperBox}>
                {!isFetching &&
                  agentsMenuData.map((option, index) => {
                    const isSelected = multiple
                      ? (value || []).some(v => v.id === option.agent_id)
                      : selectedOption?.agent_id === option.agent_id;
                    return (
                      <MenuItem
                        key={option.id + index}
                        onClick={onClick(option)}
                        sx={styles.menuItem(isSelected)}
                      >
                        <Box sx={styles.menuItemContent}>
                          {option.label}
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', ml: 0.5 }}
                          >
                            {option.type || 'skill'}
                          </Typography>
                        </Box>
                        {isSelected && (
                          <Box sx={styles.checkedIconBox}>
                            <CheckedIcon />
                          </Box>
                        )}
                      </MenuItem>
                    );
                  })}
                {isFetching && (
                  <Box sx={styles.loadingBox}>
                    <CircularProgress size={24} />
                  </Box>
                )}
              </Box>
            </Popper>

            {/* Version Selection Dropdown */}
            <Box ref={versionPanelRef} />
            <Popper
              open={versionOpen}
              anchorEl={versionPanelRef.current}
              placement="bottom-start"
              style={styles.popper(versionPanelRef)}
            >
              <Box sx={styles.popperBox}>
                <Box sx={styles.versionHeader}>
                  <Typography
                    variant="bodySmall"
                    sx={{ fontWeight: 500, mb: 1 }}
                  >
                    Select version for &ldquo;{selectedAgentForVersion?.name}&rdquo;
                  </Typography>
                </Box>
                {!isFetchingVersions &&
                  versions.map(version => (
                    <MenuItem
                      key={version.id}
                      onClick={onVersionClick(version)}
                      sx={styles.menuItem(false)}
                    >
                      <Typography
                        variant="bodySmall"
                        sx={{ color: 'text.secondary' }}
                      >
                        {formatVersionDisplayText(version)}
                      </Typography>
                    </MenuItem>
                  ))}
                {isFetchingVersions && (
                  <Box sx={styles.loadingBox}>
                    <CircularProgress size={24} />
                  </Box>
                )}
                {!isFetchingVersions && versions.length === 0 && (
                  <MenuItem
                    disabled
                    sx={styles.menuItem(false)}
                  >
                    No versions available
                  </MenuItem>
                )}
              </Box>
            </Popper>
          </Box>
        </ClickAwayListener>
      </>
    );
  },
);

AgentSelect.displayName = 'AgentSelect';

/** @type {MuiSx} */
const styles = {
  // Static styles
  labelContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  labelBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '0.5rem',
  },
  selectedValueBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemContent: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  loadingBox: {
    padding: '0.5rem',
    display: 'flex',
    justifyContent: 'center',
  },
  versionHeader: {
    padding: '0.5rem 1rem',
    borderBottom: '1px solid',
    borderBottomColor: 'divider',
  },
  // Dynamic styles (functions)
  clickableBox: (error, open) => ({
    cursor: 'pointer',
    padding: '0.5rem 0.75rem',
    width: '100%',
    borderBottom: ({ palette }) =>
      error
        ? '0.0625rem solid red'
        : open
          ? `0.0625rem solid ${palette.primary.main}`
          : `0.0625rem solid ${palette.border.lines}`,
  }),
  labelTypography: open => ({
    color: ({ palette }) => (open ? palette.primary.main : palette.text.secondary),
  }),
  selectedValueTypography: selectedOption => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minHeight: '1.5rem',
    color: ({ palette }) => (selectedOption ? palette.text.secondary : palette.text.disabled),
  }),
  arrowIcon: open => ({
    fontSize: '1rem',
    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
  }),
  popper: panelRef => ({
    width: panelRef.current?.clientWidth,
    zIndex: theme => theme.zIndex.modal,
  }),
  popperBox: ({ palette }) => ({
    marginTop: '0.25rem',
    maxHeight: '18.75rem',
    overflowY: 'auto',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    background: palette.background.secondary,
  }),
  menuItem: isSelected => ({
    justifyContent: 'space-between',
    padding: '0.5rem 1.5rem',
    fontSize: '0.875rem',
    color: ({ palette }) => palette.text.secondary,
    '&:hover': {
      backgroundColor: ({ palette }) => palette.background.button.iconLabelButton.hover,
    },
    '&.Mui-disabled': {
      color: ({ palette }) => palette.text.disabled,
    },
    background: ({ palette }) => (isSelected ? palette.background.participant.active : undefined),
  }),
  checkedIconBox: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: palette.primary.main,
  }),
};

export default AgentSelect;
