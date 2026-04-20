import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, FormControl, FormHelperText, IconButton, InputLabel, Tooltip, Typography } from '@mui/material';

import { useTrackEvent } from '@/GA';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { useContextExecutionEntity } from '@/[fsd]/shared/lib/hooks';
import { Select } from '@/[fsd]/shared/ui';
import { useLazyGetConfigurationsListQuery, useListModelsQuery } from '@/api/configurations';
import RefreshIcon from '@/assets/refresh-icon.svg?react';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';
import { Create_Personal_Title, Create_Project_Title, Manual_Title } from '@/hooks/useConfigurations';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions, { getBasename } from '@/routes';

import CredentialWarningBanner from './CredentialWarningBanner';
import InfoIcon from './Icons/InfoIcon';
import Person from './Icons/Person';

const credentialMenuItemValue = Object.freeze({
  keyKind: 'kind',
  keyEliteaTitle: 'elitea_title',
  keyPrivate: 'private',
  kindSaved: 'saved',
  kindCreateAction: 'create_action',
});

const isBlankEliteaTitle = title => title == null || String(title).trim() === '';

const savedRowToSelectValue = row => {
  if (isBlankEliteaTitle(row?.elitea_title)) return '';
  return JSON.stringify({
    [credentialMenuItemValue.keyKind]: credentialMenuItemValue.kindSaved,
    [credentialMenuItemValue.keyEliteaTitle]: row.elitea_title,
    [credentialMenuItemValue.keyPrivate]: !!row.private,
  });
};

const selectValueToSavedRow = str => {
  if (!str || typeof str !== 'string') return null;
  try {
    const payload = JSON.parse(str);
    if (payload?.[credentialMenuItemValue.keyKind] !== credentialMenuItemValue.kindSaved) return null;
    const title = payload[credentialMenuItemValue.keyEliteaTitle];
    if (typeof title !== 'string') return null;
    if (isBlankEliteaTitle(title)) return null;
    return {
      elitea_title: title,
      private: !!payload[credentialMenuItemValue.keyPrivate],
    };
  } catch {
    return null;
  }
};

const createActionToSelectValue = isPrivate =>
  JSON.stringify({
    [credentialMenuItemValue.keyKind]: credentialMenuItemValue.kindCreateAction,
    [credentialMenuItemValue.keyPrivate]: !!isPrivate,
  });

const selectValueToCreateAction = str => {
  if (!str || typeof str !== 'string') return null;
  try {
    const payload = JSON.parse(str);
    if (payload?.[credentialMenuItemValue.keyKind] !== credentialMenuItemValue.kindCreateAction) return null;
    return { isPrivate: !!payload[credentialMenuItemValue.keyPrivate] };
  } catch {
    return null;
  }
};

const CredentialsSelect = memo(
  ({
    label = 'Credentials',
    description,
    required,
    error,
    helperText,
    value,
    onSelectConfiguration,
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
      if (
        !value?.private ||
        isBlankEliteaTitle(value?.elitea_title) ||
        selectedProjectId === personal_project_id
      )
        return false;
      const match = configurations.find(
        config =>
          config.elitea_title &&
          config.elitea_title === value.elitea_title &&
          (config.project_id === personal_project_id || config.shared),
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
            type,
          });
          teamProjectConfigurations = [
            ...(data?.items?.filter(item => !type || item.type === type) || []),
            ...(data?.shared?.items?.filter(item => !type || item.type === type) || []),
          ];
        }
        if (personal_project_id && personal_project_id !== selectedProjectId) {
          if (!onlyPublic) {
            if (section !== 'vectorstorage') {
              const { data } = await getConfigurations({
                projectId: personal_project_id,
                page: 0,
                pageSize: 500,
                sharedOffset: 0,
                sharedLimit: 500,
                includeShared: true,
                section,
                type,
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

    const createMenuData = useMemo(() => {
      const options = [];
      if (isCreationAllowed) {
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
            shared: configuration.shared || false,
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

    const menuData = useMemo(
      () => ({
        Create: createMenuData,
        [`Saved ${type ? type + ' ' : ''}Credentials`]: savedCredentialsMenuData,
      }),
      [createMenuData, savedCredentialsMenuData, type],
    );

    const selectedOption = useMemo(() => {
      if ([Manual_Title, Create_Personal_Title, Create_Project_Title].includes(value?.elitea_title)) {
        return createMenuData.find(
          option => option.elitea_title === value?.elitea_title && option.private === value?.private,
        );
      }

      const availableSavedData = savedCredentialsMenuData.find(
        option => option.elitea_title === value?.elitea_title && option.private === value?.private,
      );

      if (availableSavedData) return availableSavedData;
      else {
        if (section === 'vectorstorage') {
          if (projectDefaultVectorStorageModel) {
            const defaultOption = savedCredentialsMenuData.find(
              option => option.elitea_title === projectDefaultVectorStorageModel,
            );

            return defaultOption ?? null;
          } else return null;
        }

        if (section === 'credentials')
          return (
            savedCredentialsMenuData.find(
              option => option.elitea_title && option.elitea_title === value?.elitea_title && option.shared,
            ) ||
            (isBlankEliteaTitle(value?.elitea_title) && !value?.private ? savedCredentialsMenuData[0] : null)
          );

        return null;
      }
    }, [createMenuData, savedCredentialsMenuData, value, section, projectDefaultVectorStorageModel]);

    useEffect(() => {
      setShowConfigurableFields?.(!!selectedOption);
    }, [selectedOption, setShowConfigurableFields]);

    useEffect(() => {
      if (!hasFetchedData || !selectedOption) return;

      const isDefaultAutoSelected = selectedOption && isBlankEliteaTitle(value?.elitea_title);

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
          onSelectConfiguration(null);
        } else {
          trackEvent(GA_EVENT_NAMES.CREDENTIALS_ATTACHED, {
            [GA_EVENT_PARAMS.CREDENTIALS_TYPE]: option.private ? 'private' : 'project',
            [GA_EVENT_PARAMS.TOOLKIT_TYPE]: type || 'unknown',
            [GA_EVENT_PARAMS.ENTITY]: contextExecutionEntity,
          });
          onSelectConfiguration(config);
        }
      },
      [
        onSelectConfiguration,
        selectedOption?.elitea_title,
        selectedOption?.private,
        type,
        trackEvent,
        contextExecutionEntity,
      ],
    );

    const createSelectHandler = useCallback(
      (sec, option) => {
        if (disabled) return;
        if (sec === 'Create') {
          const baseUrl = `${window.location.protocol}//${window.location.host}`;
          const basename = getBasename();
          const projectId = option.private ? personal_project_id : selectedProjectId;
          const newPath = `${baseUrl}${basename}/${projectId}${RouteDefinitions.CreateCredentialTypeFromMain.replace(':credentialType', type)}?${section ? `section=${section}` : ''}`;
          window.open(newPath, '_blank', 'noopener,noreferrer');
        } else {
          onSelectItem(option);
        }
      },
      [disabled, onSelectItem, personal_project_id, section, selectedProjectId, type],
    );

    const optionGroups = useMemo(() => {
      const refreshButton = (
        <Tooltip
          title="Refresh the configurations"
          placement="top"
        >
          <IconButton
            size="small"
            onClick={onRefresh}
            sx={({ palette }) => ({ color: palette.text.default })}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      );

      return Object.entries(menuData)
        .filter(([title, list]) => (title === 'Create' ? list.length > 0 : true))
        .map(([title, list]) => ({
          key: title,
          title,
          headerEnd: title.includes('Saved') ? refreshButton : undefined,
          options:
            title === 'Create'
              ? list.map(opt => ({
                  value: createActionToSelectValue(opt.private),
                  label: opt.label,
                  variant: 'action',
                  meta: opt,
                  onActivate: () => createSelectHandler(title, opt),
                }))
              : list.map(opt => ({
                  value: savedRowToSelectValue(opt),
                  label: opt.label,
                  meta: opt,
                })),
        }));
    }, [menuData, createSelectHandler, onRefresh]);

    const selectStringValue = useMemo(() => {
      if (!selectedOption) return value?.elitea_title || '';
      if (
        createMenuData.some(
          o => o.elitea_title === selectedOption.elitea_title && o.private === selectedOption.private,
        )
      ) {
        return createActionToSelectValue(selectedOption.private);
      }
      return savedRowToSelectValue(selectedOption);
    }, [selectedOption, value?.elitea_title, createMenuData]);

    const handleSelectValueChange = useCallback(
      newValue => {
        const savedRow = selectValueToSavedRow(newValue);
        if (savedRow) {
          const matchingSaved = savedCredentialsMenuData.find(
            credentialOption =>
              credentialOption.elitea_title === savedRow.elitea_title &&
              credentialOption.private === savedRow.private,
          );
          if (matchingSaved) onSelectItem(matchingSaved);
          return;
        }
        const createAction = selectValueToCreateAction(newValue);
        if (createAction) {
          const matchingCreate = createMenuData.find(
            createOption => createOption.private === createAction.isPrivate,
          );
          if (matchingCreate) createSelectHandler('Create', matchingCreate);
        }
      },
      [savedCredentialsMenuData, onSelectItem, createMenuData, createSelectHandler],
    );

    const customRenderSelectValue = useCallback(
      foundOption => {
        if (!foundOption) {
          return (
            <Box sx={styles.unmatchedValueBox(value?.elitea_title && hasFetchedData)}>
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
                variant="labelMedium"
                sx={styles.unmatchedValueTypography(value?.elitea_title && hasFetchedData)}
              >
                {!value?.elitea_title ? 'Select credentials' : value.elitea_title}
              </Typography>
            </Box>
          );
        }

        const row = foundOption?.meta ?? foundOption;
        if (renderValue) return renderValue(row);
        return (
          <Typography
            variant="labelMedium"
            sx={styles.selectedValueTypography(row)}
          >
            {row.label}
          </Typography>
        );
      },
      [renderValue, value, hasFetchedData],
    );

    const labelNode = useMemo(() => {
      return (
        <InputLabel
          id={`simple-select-label-${label}`}
          sx={{
            left: '0.75rem',
            fontSize: '1rem',
            fontWeight: 500,
            ...(required && {
              '& .MuiInputLabel-asterisk, & .MuiFormLabel-asterisk': { display: 'none' },
            }),
          }}
          shrink
        >
          {label}
          {required && ' *'}
          <Box
            component="span"
            sx={{ marginLeft: '0.15rem', ':hover': { opacity: 0.8 } }}
          >
            {description && (
              <Tooltip
                title={description}
                placement="top"
              >
                <Box
                  component="span"
                  sx={{ display: 'inline-flex', verticalAlign: 'middle' }}
                >
                  <InfoIcon
                    width={18}
                    height={18}
                  />
                </Box>
              </Tooltip>
            )}
          </Box>
        </InputLabel>
      );
    }, [description, label, required]);

    const selectError = error || (mismatchedPrivateCredential && hasFetchedData);

    const showMismatchFooter = Boolean(
      value && !isBlankEliteaTitle(value?.elitea_title) && !selectedOption && hasFetchedData,
    );

    return (
      <Box sx={[{ marginTop: '0.75rem' }, sx]}>
        <Select.SingleSelect
          label={label}
          labelNode={labelNode}
          required={required}
          error={selectError}
          helperText={showMismatchFooter ? '' : helperText}
          disabled={disabled}
          showBorder
          customSelectedFontSize="0.875rem"
          optionGroups={optionGroups}
          options={[]}
          value={selectStringValue}
          onValueChange={handleSelectValueChange}
          onClear={() => onSelectConfiguration?.(null)}
          customRenderValue={customRenderSelectValue}
          displayEmpty
          showEmptyPlaceholder={false}
          isListFetching={isFetching}
        />
        {showMismatchFooter && mismatchedPrivateCredential && (
          <CredentialWarningBanner
            credentialId={value?.elitea_title}
            credentialType={type}
            section={section}
          />
        )}
        {showMismatchFooter && !mismatchedPrivateCredential && (
          <FormControl
            error
            fullWidth
          >
            <FormHelperText>Your configuration does not match any available configurations.</FormHelperText>
          </FormControl>
        )}
      </Box>
    );
  },
);

CredentialsSelect.displayName = 'CredentialsSelect';

/** @type {MuiSx} */
const styles = {
  labelContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  selectedValueTypography: selectedOption => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minHeight: '1.5rem',
    color: ({ palette }) => (selectedOption?.label ? palette.text.secondary : palette.text.disabled),
  }),
  unmatchedValueBox: mismatch => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: ({ palette }) => (mismatch ? palette.status.rejected : palette.text.secondary),
  }),
  unmatchedValueTypography: mismatch => ({
    color: ({ palette }) => (mismatch ? palette.status.rejected : palette.text.disabled),
  }),
};

export default CredentialsSelect;
