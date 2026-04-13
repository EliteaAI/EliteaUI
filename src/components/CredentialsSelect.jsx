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

import { useTrackEvent } from '@/GA';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { useContextExecutionEntity } from '@/[fsd]/shared/lib/hooks';
import { useLazyGetConfigurationsListQuery, useListModelsQuery } from '@/api/configurations';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import RefreshIcon from '@/assets/refresh-icon.svg?react';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';
import { Create_Personal_Title, Create_Project_Title, Manual_Title } from '@/hooks/useConfigurations';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions, { getBasename } from '@/routes';

import CredentialWarningBanner from './CredentialWarningBanner';
import ArrowDownIcon from './Icons/ArrowDownIcon';
import InfoIcon from './Icons/InfoIcon';
import Person from './Icons/Person';

const CredentialsSelect = memo(
  ({
    label = 'Credentials',
    description,
    required,
    error,
    helperText,
    value, // Current selected configuration
    onSelectConfiguration, // Callback for selection change
    isCreationAllowed = true,
    sx,
    renderValue,
    setShowConfigurableFields,
    initialToolTypeState = {},
    type = '',
    section = 'credentials',
    disabled,
    onlyPublic = false,
    presetOptions,
  }) => {
    const trackEvent = useTrackEvent();

    const [anchorEl, setAnchorEl] = useState(null);
    const panelRef = useRef(null);
    const open = Boolean(anchorEl);
    const { personal_project_id } = useSelector(state => state.user);
    const selectedProjectId = useSelectedProjectId();
    const { contextExecutionEntity } = useContextExecutionEntity();
    const [getConfigurations, { isFetching }] = useLazyGetConfigurationsListQuery();
    const [hasFetchedData, setHasFetchedData] = useState(false);
    const [configurations, setConfigurations] = useState([]);
    const hasAutoSelectedRef = useRef(false);

    const {
      data: vectorStorageData = { items: [], total: 0, default_model_name: '', default_model_project_id: '' },
    } = useListModelsQuery(
      { projectId: selectedProjectId, include_shared: true, section: 'vectorstorage' },
      { skip: !selectedProjectId || section !== 'vectorstorage' },
    );

    const projectDefaultVectorStorageModel = useMemo(
      () => vectorStorageData?.default_model_name || '',
      [vectorStorageData?.default_model_name],
    );

    const mismatchedPrivateCredential = useMemo(() => {
      if (!value?.private || !value?.elitea_title || selectedProjectId === personal_project_id) return false;
      const match = configurations.find(
        config =>
          config.elitea_title &&
          config.elitea_title === value.elitea_title &&
          config.project_id === personal_project_id,
      );
      return !match;
    }, [value?.private, value?.elitea_title, selectedProjectId, personal_project_id, configurations]);
    const onRefresh = useCallback(
      async event => {
        event?.stopPropagation();
        setConfigurations([]);
        setHasFetchedData(false);
        hasAutoSelectedRef.current = false;
        let teamProjectConfigurations = [];
        if (selectedProjectId) {
          const { data } = await getConfigurations({
            projectId: selectedProjectId,
            page: 0,
            pageSize: 500,
            sharedOffset: 0,
            sharedLimit: 500,
            includeShared: true,
            section,
          });
          teamProjectConfigurations = [
            ...(data?.items?.filter(item => !type || item.type === type) || []),
            ...(data?.shared?.items?.filter(item => !type || item.type === type) || []),
          ];
        }
        if (personal_project_id && personal_project_id !== selectedProjectId) {
          if (!onlyPublic) {
            // Skip vectorstorage for personal project when in a team project
            // Private pgvector configs are not allowed in team projects
            if (section !== 'vectorstorage') {
              const { data } = await getConfigurations({
                projectId: personal_project_id,
                page: 0,
                pageSize: 500,
                sharedOffset: 0,
                sharedLimit: 500,
                includeShared: true,
                section,
              });
              teamProjectConfigurations = [
                ...teamProjectConfigurations,
                ...(data?.items?.filter(item => !type || item.type === type) || []),
              ];
            }
          }
        }
        setConfigurations(teamProjectConfigurations);
        setHasFetchedData(true);
      },
      [getConfigurations, personal_project_id, section, selectedProjectId, type, onlyPublic],
    );

    useEffect(() => {
      onRefresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProjectId, personal_project_id, type, section, onlyPublic]);

    const handleFocus = useCallback(() => {
      setAnchorEl(anchorEl ? null : panelRef.current);
    }, [anchorEl]);

    const handleClickAway = useCallback(() => {
      setAnchorEl(null);
    }, []);

    // Create menu data: Options for creating new credentials
    const createMenuData = useMemo(() => {
      const options = [];
      if (isCreationAllowed) {
        // Skip "New private credentials" button for vectorstorage in team projects
        // Private pgvector configs are not allowed in team projects
        const isVectorStorageInTeamProject =
          section === 'vectorstorage' && selectedProjectId !== personal_project_id;

        if (!onlyPublic && !isVectorStorageInTeamProject)
          options.push({
            elitea_title: Create_Personal_Title,
            private: true,
            label: (
              <span style={styles.labelContainer}>
                <Person fontSize="1rem" />
                {`New private ${type ? type + ' ' : ''}credentials`}
              </span>
            ),
            settings: initialToolTypeState || {},
          });

        if (selectedProjectId != personal_project_id) {
          // Only show project credentials option if the selected project is not personal
          options.push({
            elitea_title: Create_Project_Title,
            private: false,
            label: (
              <span style={styles.labelContainer}>
                <BriefcaseIcon fontSize="1rem" />
                {`New project ${type ? type + ' ' : ''}credentials`}
              </span>
            ),
            settings: initialToolTypeState || {},
          });
        }
      }
      return options;
    }, [
      isCreationAllowed,
      type,
      initialToolTypeState,
      selectedProjectId,
      personal_project_id,
      onlyPublic,
      section,
    ]);

    // Saved Credentials menu data
    const savedCredentialsMenuData = useMemo(() => {
      return (presetOptions?.length ? presetOptions : configurations)
        .filter(configuration => {
          const isConfigurationPersonal = configuration.project_id === personal_project_id;
          if (onlyPublic) return !isConfigurationPersonal;

          return true;
        })
        .map(configuration => {
          const isConfigurationPersonal = configuration.project_id === personal_project_id;
          return {
            id: `${configuration.elitea_title}_${configuration.project_id}`,
            elitea_title: configuration.elitea_title || configuration.data?.title,
            private: isConfigurationPersonal,
            settings: configuration.data || {},
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
                <span key="label-text">
                  {configuration.label || configuration.elitea_title || configuration.data?.title}
                </span>
              </span>
            ),
          };
        });
    }, [configurations, personal_project_id, onlyPublic, presetOptions]);

    // Combine create and saved credentials into menu data
    const menuData = useMemo(
      () => ({
        Create: createMenuData,
        [`Saved ${type ? type + ' ' : ''}Credentials`]: savedCredentialsMenuData,
      }),
      [createMenuData, savedCredentialsMenuData, type],
    );

    // Find the selected option
    const selectedOption = useMemo(() => {
      if ([Manual_Title, Create_Personal_Title, Create_Project_Title].includes(value?.elitea_title)) {
        return createMenuData.find(
          option =>
            option.elitea_title &&
            option.elitea_title === value?.elitea_title &&
            option.private === value?.private,
        );
      }

      const availableSavedData = savedCredentialsMenuData.find(
        option =>
          option.elitea_title &&
          option.elitea_title === value?.elitea_title &&
          option.private === value?.private,
      );

      if (availableSavedData) return availableSavedData;
      else {
        if (section === 'vectorstorage') {
          if (projectDefaultVectorStorageModel) {
            const defaultOption = savedCredentialsMenuData.find(
              option => option.elitea_title && option.elitea_title === projectDefaultVectorStorageModel,
            );

            return defaultOption ?? null;
          } else return null;
        }

        if (section === 'credentials')
          return (
            savedCredentialsMenuData.find(
              option => option.elitea_title && option.elitea_title === value?.elitea_title,
            ) || (!value?.elitea_title && !value?.private ? savedCredentialsMenuData[0] : null)
          );

        return null;
      }
    }, [createMenuData, savedCredentialsMenuData, value, section, projectDefaultVectorStorageModel]);

    useEffect(() => {
      setShowConfigurableFields?.(!!selectedOption);
    }, [selectedOption, setShowConfigurableFields]);

    // Notify parent when a default credential is auto-selected
    // This ensures editToolDetail gets updated with the default selection
    useEffect(() => {
      if (!hasFetchedData || !selectedOption) return;

      // Only notify if there's a mismatch: UI shows a selection but parent doesn't have it
      const isDefaultAutoSelected = selectedOption && !value?.elitea_title;

      if (isDefaultAutoSelected && !hasAutoSelectedRef.current) {
        hasAutoSelectedRef.current = true;
        const config = {
          private: selectedOption.private,
          elitea_title: selectedOption.elitea_title,
        };
        onSelectConfiguration?.(config);
      }
    }, [hasFetchedData, selectedOption, value, onSelectConfiguration]);

    const onSelectItem = useCallback(
      option => {
        const config = {
          private: option.private,
          elitea_title: option.elitea_title,
        };
        if (
          selectedOption?.elitea_title === option.elitea_title &&
          selectedOption?.private === option.private
        ) {
          onSelectConfiguration(null); // Deselect if already selected
        } else {
          trackEvent(GA_EVENT_NAMES.CREDENTIALS_ATTACHED, {
            [GA_EVENT_PARAMS.CREDENTIALS_TYPE]: option.private ? 'private' : 'project',
            [GA_EVENT_PARAMS.TOOLKIT_TYPE]: type || 'unknown',
            [GA_EVENT_PARAMS.ENTITY]: contextExecutionEntity,
          });
          onSelectConfiguration(config);
        }
        setAnchorEl(null); // Close dropdown
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [onSelectConfiguration, selectedOption?.elitea_title, selectedOption?.private, type],
    );

    const createSelectHandler = useCallback(
      (sec, option) => () => {
        if (!disabled) {
          if (sec === 'Create') {
            const baseUrl = `${window.location.protocol}//${window.location.host}`;
            const basename = getBasename();
            const newPath = `${baseUrl}${basename}/${selectedProjectId}${RouteDefinitions.CreateCredentialTypeFromMain.replace(':credentialType', type)}?project_id=${option.private ? personal_project_id : selectedProjectId}${section ? `&section=${section}` : ''}`;
            window.open(newPath, '_blank', 'noopener,noreferrer');
          } else {
            onSelectItem(option);
          }
        }
      },
      [disabled, onSelectItem, personal_project_id, section, selectedProjectId, type],
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
              sx={styles.clickableBox(error || mismatchedPrivateCredential, open)}
            >
              <Box sx={styles.labelBox}>
                <Typography
                  variant="bodySmall"
                  sx={styles.labelTypography(open)}
                >
                  {label}
                  {required && <span> *</span>}
                  {description && (
                    <Box
                      sx={{ marginLeft: '0.15rem', ':hover': { opacity: 0.8 } }}
                      component="span"
                    >
                      <Tooltip
                        title={description}
                        placement="top"
                      >
                        <Box component="span">
                          <InfoIcon
                            width={14}
                            height={14}
                          />
                        </Box>
                      </Tooltip>
                    </Box>
                  )}
                </Typography>
              </Box>
              {/* Render selected value */}
              <Box sx={styles.selectedValueBox}>
                {selectedOption ? (
                  renderValue ? (
                    renderValue(selectedOption)
                  ) : (
                    <Typography
                      variant="bodyMedium"
                      sx={styles.selectedValueTypography(selectedOption)}
                    >
                      {selectedOption.label}
                    </Typography>
                  )
                ) : (
                  <Box sx={styles.unmatchedValueBox}>
                    {value?.elitea_title ? (
                      value?.private ? (
                        <Person
                          key="person-icon"
                          fontSize="1rem"
                        />
                      ) : (
                        <BriefcaseIcon
                          key="briefcase-icon"
                          fontSize="1rem"
                        />
                      )
                    ) : null}
                    <Typography
                      variant="bodyMedium"
                      sx={styles.unmatchedValueTypography}
                    >
                      {!value?.elitea_title ? 'Select credentials' : value?.elitea_title}
                    </Typography>
                  </Box>
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
            {value && !open && !selectedOption && hasFetchedData && mismatchedPrivateCredential && (
              <CredentialWarningBanner
                credentialId={value?.elitea_title || value?.elitea_title}
                credentialType={type}
                section={section}
              />
            )}
            {value && !open && !selectedOption && hasFetchedData && !mismatchedPrivateCredential && (
              <FormControl error>
                <FormHelperText>
                  Your configuration does not match any available configurations.
                </FormHelperText>
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
                  Object.keys(menuData).map(sec => (
                    <React.Fragment key={sec}>
                      <MenuItem
                        sx={[styles.normalMenuItem, styles.headerWrapper]}
                        disabled
                      >
                        <Typography
                          variant="bodySmall"
                          color="textSecondary"
                          sx={styles.sectionHeader}
                        >
                          {sec}
                        </Typography>
                      </MenuItem>
                      <Box sx={{ position: 'relative' }}>
                        {sec.includes('Saved') && (
                          <Tooltip
                            title="Refresh the configurations"
                            placement="top"
                            sx={styles.refreshIconWrapper}
                          >
                            <IconButton
                              variant="elitea"
                              color="tertiary"
                              onClick={onRefresh}
                            >
                              <RefreshIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {menuData[sec].map((option, index) => (
                          <MenuItem
                            key={option.elitea_title + sec + index}
                            onClick={createSelectHandler(sec, option)}
                            sx={[styles.normalMenuItem, styles.menuItem(selectedOption, option)]}
                          >
                            <Box sx={styles.menuItemContent}>{option.label}</Box>
                            {selectedOption &&
                              option.elitea_title &&
                              option.elitea_title === selectedOption.elitea_title &&
                              option.private === selectedOption.private && (
                                <Box sx={styles.checkedIconBox}>
                                  <CheckedIcon />
                                </Box>
                              )}
                          </MenuItem>
                        ))}
                      </Box>
                    </React.Fragment>
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

CredentialsSelect.displayName = 'CredentialsSelect';

/** @type {MuiSx} */
const styles = {
  normalMenuItem: ({ palette }) => ({
    justifyContent: 'space-between',
    padding: '0.5rem 1.5rem',
    fontSize: '0.875rem',
    color: palette.text.secondary,
    '&:hover': {
      backgroundColor: palette.background.button.iconLabelButton.hover,
    },
    '&.Mui-disabled': {
      color: palette.text.disabled,
    },
  }),
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
  sectionHeader: {
    textTransform: 'uppercase',
    padding: '0.125rem 0',
  },
  headerWrapper: ({ palette }) => ({
    borderBottom: `1px solid ${palette.border.lines}`,
    borderTop: `1px solid ${palette.border.lines}`,
  }),
  refreshIconWrapper: {
    position: 'absolute',
    top: '-.3rem',
    right: '.75rem',
    transform: 'translateY(-100%)',
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
    // color: error ? theme.palette.error.main : theme.palette.text.secondary,
    color: ({ palette }) => (open ? palette.primary.main : palette.text.secondary),
  }),
  selectedValueTypography: selectedOption => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minHeight: '1.5rem',
    color: ({ palette }) => (selectedOption?.label ? palette.text.secondary : palette.text.disabled),
  }),
  unmatchedValueBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: ({ palette }) => palette.text.secondary,
  },
  unmatchedValueTypography: {
    color: ({ palette }) => palette.text.secondary,
  },
  arrowIcon: open => ({
    fontSize: '1rem',
    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
  }),
  popper: panelRef => ({
    width: panelRef.current?.clientWidth,
    zIndex: 1300,
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
    background: ({ palette }) =>
      selectedOption &&
      option.elitea_title &&
      option.elitea_title === selectedOption.elitea_title &&
      option.private === selectedOption.private
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

export default CredentialsSelect;
