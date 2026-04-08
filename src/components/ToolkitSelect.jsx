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

import { toolkitsApi } from '@/api/toolkits';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import RefreshIcon from '@/assets/refresh-icon.svg?react';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import ArrowDownIcon from './Icons/ArrowDownIcon';
import Person from './Icons/Person';

const ToolkitSelect = memo(
  ({
    label = 'Toolkit',
    required,
    error,
    helperText,
    value, // Current selected toolkit ID(s)
    onSelectToolkit, // Callback for selection change
    sx,
    disabled,
    multiple = false,
    filters = {}, // Filters from schema (e.g. { toolkit_type: 'jira' })
    showBorder = false,
  }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const panelRef = useRef(null);
    const open = Boolean(anchorEl);
    const { personal_project_id } = useSelector(state => state.user);
    const selectedProjectId = useSelectedProjectId();
    const [getToolkits, { isFetching }] = toolkitsApi.useLazyToolkitsListQuery();
    const [hasFetchedData, setHasFetchedData] = useState(false);

    const [toolkits, setToolkits] = useState([]);
    const serializedFilters = JSON.stringify(filters);

    const onRefresh = useCallback(
      async event => {
        event?.stopPropagation();
        setToolkits([]);
        setHasFetchedData(false);
        let teamProjectToolkits = [];

        const queryParams = {
          ...JSON.parse(serializedFilters),
        };

        if (selectedProjectId) {
          const { data } = await getToolkits({
            projectId: selectedProjectId,
            page: 0,
            page_size: 500,
            params: queryParams,
          });
          teamProjectToolkits = [
            ...(data?.rows || []).map(item => ({
              ...item,
              id: `${item.id}_${selectedProjectId}`, // Unified ID pattern
              project_id: selectedProjectId,
            })),
          ];
        }
        if (personal_project_id && personal_project_id !== selectedProjectId) {
          const { data } = await getToolkits({
            projectId: personal_project_id,
            page: 0,
            page_size: 500,
            params: queryParams,
          });
          teamProjectToolkits = [
            ...teamProjectToolkits,
            ...(data?.rows || []).map(item => ({
              ...item,
              id: `${item.id}_${personal_project_id}`, // Unified ID pattern
              project_id: personal_project_id,
            })),
          ];
        }

        // Remove duplicates by unified ID
        const uniqueToolkits = teamProjectToolkits.reduce((acc, toolkit) => {
          if (!acc.find(existing => existing.id === toolkit.id)) {
            acc.push(toolkit);
          }
          return acc;
        }, []);

        setHasFetchedData(true);
        setToolkits(uniqueToolkits);
      },
      [getToolkits, personal_project_id, selectedProjectId, serializedFilters],
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
    }, []);

    // Toolkits menu data
    const toolkitsMenuData = useMemo(() => {
      return toolkits.map(toolkit => {
        const isToolkitPersonal = toolkit.project_id === personal_project_id;
        return {
          id: toolkit.id,
          toolkit_id: toolkit.id.split('_')[0], // Extract original toolkit ID
          name: toolkit.name,
          type: toolkit.type,
          private: isToolkitPersonal,
          label: (
            <span style={styles.labelContainer}>
              {isToolkitPersonal ? (
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
              <span key="label-text">{toolkit.name}</span>
            </span>
          ),
        };
      });
    }, [toolkits, personal_project_id]);

    // Find the selected option
    const selectedOption = useMemo(() => {
      if (multiple) {
        return toolkitsMenuData.filter(option => (value || []).some(v => option.toolkit_id === String(v)));
      }
      return toolkitsMenuData.find(option => option.toolkit_id === String(value));
    }, [toolkitsMenuData, value, multiple]);

    const onSelectItem = useCallback(
      option => {
        if (multiple) {
          const currentValues = value || [];
          const isSelected = currentValues.some(v => String(v) === option.toolkit_id);
          const newValues = isSelected
            ? currentValues.filter(v => String(v) !== option.toolkit_id)
            : [...currentValues, parseInt(option.toolkit_id)];
          onSelectToolkit(newValues);
        } else {
          onSelectToolkit(
            selectedOption?.toolkit_id === option.toolkit_id ? null : parseInt(option.toolkit_id),
          );
          setAnchorEl(null); // Close dropdown for single select
        }
      },
      [multiple, onSelectToolkit, selectedOption, value],
    );

    const onClick = useCallback(
      option => () => {
        if (!disabled) {
          onSelectItem(option);
        }
      },
      [disabled, onSelectItem],
    );

    const getDisplayValue = () => {
      if (multiple && selectedOption && selectedOption.length > 0) {
        return selectedOption.map(opt => opt.label).join(', ');
      }
      return selectedOption ? selectedOption.label : !open ? 'Select toolkit' : '';
    };

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
                    title="Refresh the toolkits"
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
                <FormHelperText>{'Your toolkit does not match any available toolkits.'}</FormHelperText>
              </FormControl>
            )}
            <Popper
              open={open}
              anchorEl={panelRef.current}
              placement="bottom-start"
              style={styles.popper(panelRef)}
            >
              <Box sx={styles.popperBox}>
                {!isFetching &&
                  toolkitsMenuData.map((option, index) => {
                    const isSelected = multiple
                      ? (value || []).some(v => String(v) === option.toolkit_id)
                      : selectedOption?.toolkit_id === option.toolkit_id;
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
                            {option.type}
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
          </Box>
        </ClickAwayListener>
      </>
    );
  },
);

ToolkitSelect.displayName = 'ToolkitSelect';

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

export default ToolkitSelect;
