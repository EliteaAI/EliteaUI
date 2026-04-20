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

import { Label } from '@/[fsd]/shared/ui';
import { useLazyListModelsQuery, useListModelsQuery } from '@/api/configurations';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import RefreshIcon from '@/assets/refresh-icon.svg?react';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import ArrowDownIcon from './Icons/ArrowDownIcon';
import Person from './Icons/Person';

const EmbeddingModelSelect = memo(
  ({
    label = 'Embedding Model',
    description,
    required,
    error,
    helperText,
    value, // Current selected model
    onSelectModel, // Callback for selection change
    sx,
    renderValue,
    disabled,
  }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const panelRef = useRef(null);
    const open = Boolean(anchorEl);
    const { personal_project_id } = useSelector(state => state.user);
    const selectedProjectId = useSelectedProjectId();
    const [getModels, { isFetching }] = useLazyListModelsQuery();
    const [hasFetchedData, setHasFetchedData] = useState(false);

    const {
      data: embeddingModelsData = {
        items: [],
        total: 0,
        default_model_name: '',
        default_model_project_id: '',
      },
    } = useListModelsQuery(
      { projectId: selectedProjectId, include_shared: true, section: 'embedding' },
      { skip: !selectedProjectId },
    );

    const projectDefaultEmbeddingModel = useMemo(
      () => embeddingModelsData?.default_model_name || '',
      [embeddingModelsData?.default_model_name],
    );

    const [models, setModels] = useState([]);

    const onRefresh = useCallback(
      async event => {
        event?.stopPropagation();
        setModels([]);
        setHasFetchedData(false);
        let teamProjectModels = [];
        if (selectedProjectId) {
          const { data } = await getModels({
            projectId: selectedProjectId,
            include_shared: true,
            section: 'embedding',
          });
          // Add regular models with unified ID
          teamProjectModels = [
            ...(data?.items || []).map(item => ({
              ...item,
              id: `${item.project_id}_${item.name}`, // Unified ID pattern
            })),
          ];
        }
        if (personal_project_id && personal_project_id !== selectedProjectId) {
          const { data } = await getModels({
            projectId: personal_project_id,
            include_shared: true,
            section: 'embedding',
          });
          // Add personal models with unified ID
          teamProjectModels = [
            ...teamProjectModels,
            ...(data?.items || []).map(item => ({
              ...item,
              id: `${item.project_id}_${item.name}`, // Unified ID pattern
            })),
          ];
        }
        // Remove duplicates by unified ID
        const uniqueModels = teamProjectModels.reduce((acc, model) => {
          if (!acc.find(existing => existing.id === model.id)) {
            acc.push(model);
          }
          return acc;
        }, []);
        setHasFetchedData(true);
        setModels(uniqueModels);
      },
      [getModels, personal_project_id, selectedProjectId],
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

    // Models menu data
    const modelsMenuData = useMemo(() => {
      return models.map(model => {
        const isConfigurationPersonal = model.project_id === personal_project_id;
        return {
          id: `${model.name}_${model.project_id}`,
          name: model.name || model.id,
          private: isConfigurationPersonal,
          settings: model.settings || {},
          label: (
            <span style={styles.labelContainer}>
              {isConfigurationPersonal ? (
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
              <span key="label-text">{model.display_name || model.name || model.id}</span>
            </span>
          ),
        };
      });
    }, [models, personal_project_id]);

    // Find the selected option
    const selectedOption = useMemo(() => {
      return modelsMenuData.find(
        option =>
          option.name === value ||
          (projectDefaultEmbeddingModel && option.name === projectDefaultEmbeddingModel),
      );
    }, [modelsMenuData, value, projectDefaultEmbeddingModel]);

    const onSelectItem = useCallback(
      option => {
        onSelectModel(selectedOption?.name === option.name ? null : option.name);
        setAnchorEl(null); // Close dropdown
      },
      [onSelectModel, selectedOption?.name],
    );

    const onClick = useCallback(
      option => () => {
        if (!disabled) {
          onSelectItem(option);
        }
      },
      [disabled, onSelectItem],
    );

    return (
      <>
        <ClickAwayListener onClickAway={handleClickAway}>
          <Box
            sx={sx}
            ref={panelRef}
          >
            <Box
              onClick={handleFocus}
              sx={styles.clickableBox(error, open)}
            >
              <Box sx={styles.labelBox}>
                <Label.InfoLabelWithTooltip
                  label={required ? `${label} *` : label}
                  tooltip={description}
                  variant="bodySmall"
                  inheritColor
                  iconSize={14}
                  labelSx={styles.labelTypography(open)}
                />
                <Tooltip
                  title="Refresh the models"
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
              {/* Render selected value */}
              <Box sx={styles.selectedValueBox}>
                {renderValue ? (
                  renderValue(selectedOption)
                ) : (
                  <Typography
                    variant="bodyMedium"
                    sx={styles.selectedValueTypography(selectedOption)}
                  >
                    {selectedOption ? selectedOption?.label : !open ? 'Select model' : ''}
                  </Typography>
                )}
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
                <FormHelperText>{'Your model does not match any available models.'}</FormHelperText>
              </FormControl>
            )}
            <Popper
              open={open}
              anchorEl={panelRef.current}
              placement="bottom-start"
              sx={styles.popper(panelRef)}
            >
              <Box sx={styles.popperBox}>
                {!isFetching &&
                  modelsMenuData.map((option, index) => (
                    <MenuItem
                      key={option.name + index}
                      onClick={onClick(option)}
                      sx={styles.menuItem(selectedOption, option)}
                    >
                      <Box sx={styles.menuItemContent}>{option.label}</Box>
                      {selectedOption &&
                        option.name === selectedOption.name &&
                        option.private === selectedOption.private && (
                          <Box sx={styles.checkedIconBox}>
                            <CheckedIcon />
                          </Box>
                        )}
                    </MenuItem>
                  ))}
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

EmbeddingModelSelect.displayName = 'EmbeddingModelSelect';

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
        ? `0.0625rem solid ${palette.icon.fill.error}`
        : open
          ? `0.0625rem solid ${palette.primary.main}`
          : `0.0625rem solid ${palette.border.lines}`,
    ...(!error &&
      !open && {
        '&:hover': {
          borderBottom: ({ palette }) => `0.0625rem solid ${palette.border.hover}`,
        },
      }),
  }),
  labelTypography: open => ({
    color: ({ palette }) => (open ? palette.primary.main : palette.text.primary),
  }),
  selectedValueTypography: selectedOption => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minHeight: '1.5rem',
    color: ({ palette }) =>
      selectedOption?.label ? palette.text.select.selected.primary : palette.text.default,
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
  menuItem: (selectedOption, option) => ({
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
    background: ({ palette }) =>
      selectedOption && option.name === selectedOption.name && option.private === selectedOption.private
        ? palette.background.participant.active
        : undefined,
  }),
  checkedIconBox: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: palette.primary.main,
  }),
};

export default EmbeddingModelSelect;
