import React, { memo, useCallback, useEffect, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { Box, Tooltip, Typography } from '@mui/material';

import { useTrackEvent } from '@/GA';
import { useCredentialValidation, useCredentialsData } from '@/[fsd]/features/credentials/lib/hooks';
import { CredentialOptionLabel } from '@/[fsd]/features/credentials/ui';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { useContextExecutionEntity } from '@/[fsd]/shared/lib/hooks';
import { Select } from '@/[fsd]/shared/ui';
import { BaseBtn } from '@/[fsd]/shared/ui/button';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import RefreshIcon from '@/assets/refresh-icon.svg?react';
import { Create_Personal_Title, Create_Project_Title, Manual_Title } from '@/hooks/useConfigurations';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions, { getBasename } from '@/routes';

import CredentialCreateLabel from './CredentialCreateLabel';
import CredentialMismatchFooter from './CredentialMismatchFooter';
import CredentialNotFoundValue from './CredentialNotFoundValue';

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
    const {
      validateCredential,
      batchValidateCredentials,
      getCredentialStatus,
      getCredentialMessage,
      resetStatus,
      resetStatuses,
    } = useCredentialValidation();

    const {
      configurations,
      hasFetchedData,
      isFetching,
      onRefresh,
      hasAutoSelectedRef,
      projectDefaultVectorStorageModel,
    } = useCredentialsData({
      selectedProjectId,
      personal_project_id,
      section,
      type,
      onlyPublic,
      batchValidateCredentials,
      resetStatuses,
    });

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
              <CredentialCreateLabel
                isPrivate
                type={type}
              />
            ),
            settings: initialToolTypeState || {},
          });

        if (selectedProjectId != personal_project_id) {
          options.push({
            elitea_title: Create_Project_Title,
            private: false,
            label: (
              <CredentialCreateLabel
                isPrivate={false}
                type={type}
              />
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
          const configUid = configuration.id || configuration.uuid;
          const credentialUrl = configUid
            ? (() => {
                const baseUrl = `${window.location.protocol}//${window.location.host}`;
                const basename = getBasename();
                const credProjectId = configuration.project_id || selectedProjectId;
                const path = RouteDefinitions.EditCredentialFromMain.replace(':tab', 'all').replace(
                  ':credential_uid',
                  configUid,
                );
                return `${baseUrl}${basename}/${credProjectId}${path}`;
              })()
            : null;

          const credStatus = getCredentialStatus(configUid);
          const isCredentialInvalid = credStatus === 'invalid';
          const isChecking = credStatus === 'checking';
          const credentialMessage = getCredentialMessage(configUid);

          const handleRevalidate = event => {
            event.stopPropagation();
            resetStatus(configUid);
            validateCredential({
              projectId: configuration.project_id || selectedProjectId,
              credential: configuration,
            });
          };

          return {
            id: `${configuration.elitea_title}_${configuration.project_id}`,
            elitea_title: configuration.elitea_title || configuration.data?.title,
            private: isConfigurationPersonal,
            settings: configuration.data || {},
            shared: configuration.shared || false,
            label: (
              <CredentialOptionLabel
                isPersonal={isConfigurationPersonal}
                label={configuration.label || configuration.elitea_title || configuration.data?.title}
                credentialUrl={credentialUrl}
                isInvalid={isCredentialInvalid}
                isChecking={isChecking}
                invalidMessage={credentialMessage}
                onRevalidate={handleRevalidate}
              />
            ),
          };
        });
    }, [
      presetOptions,
      configurations,
      personal_project_id,
      onlyPublic,
      getCredentialStatus,
      getCredentialMessage,
      resetStatus,
      validateCredential,
      selectedProjectId,
    ]);

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

      if (section === 'vectorstorage') {
        if (projectDefaultVectorStorageModel) {
          return (
            savedCredentialsMenuData.find(
              option => option.elitea_title === projectDefaultVectorStorageModel,
            ) ?? null
          );
        }
        return null;
      }

      if (section === 'credentials')
        return (
          savedCredentialsMenuData.find(
            option => option.elitea_title && option.elitea_title === value?.elitea_title && option.shared,
          ) ||
          (isBlankEliteaTitle(value?.elitea_title) && !value?.private ? savedCredentialsMenuData[0] : null)
        );

      return null;
    }, [createMenuData, savedCredentialsMenuData, value, section, projectDefaultVectorStorageModel]);

    useEffect(() => {
      setShowConfigurableFields?.(!!selectedOption);
    }, [selectedOption, setShowConfigurableFields]);

    useEffect(() => {
      if (!hasFetchedData || !selectedOption) return;

      const isDefaultAutoSelected =
        selectedOption && (section === 'vectorstorage' || isBlankEliteaTitle(value?.elitea_title));

      if (isDefaultAutoSelected && !hasAutoSelectedRef.current) {
        hasAutoSelectedRef.current = true;
        onSelectConfiguration?.({
          private: selectedOption.private,
          elitea_title: selectedOption.elitea_title,
        });
      }
    }, [hasFetchedData, selectedOption, value, onSelectConfiguration, section, hasAutoSelectedRef]);

    const onSelectItem = useCallback(
      option => {
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
          onSelectConfiguration({ private: option.private, elitea_title: option.elitea_title });
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
          <BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            size="small"
            onClick={onRefresh}
            sx={styles.refreshIcon}
          >
            <RefreshIcon />
          </BaseBtn>
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

    const isOptionsReady = useMemo(() => {
      if (!hasFetchedData) return false;
      return createMenuData.length > 0 || savedCredentialsMenuData.length > 0;
    }, [hasFetchedData, createMenuData.length, savedCredentialsMenuData.length]);

    const selectStringValue = useMemo(() => {
      if (!isOptionsReady) return '';
      if (selectedOption) {
        const isCreateSelected = createMenuData.some(
          o => o.elitea_title === selectedOption.elitea_title && o.private === selectedOption.private,
        );
        return isCreateSelected
          ? createActionToSelectValue(selectedOption.private)
          : savedRowToSelectValue(selectedOption);
      }
      if (!value || isBlankEliteaTitle(value?.elitea_title)) return '';
      return savedRowToSelectValue({ elitea_title: value.elitea_title, private: !!value.private });
    }, [isOptionsReady, selectedOption, createMenuData, value]);

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
          if (!value?.elitea_title) return null;
          return (
            <CredentialNotFoundValue
              eliteaTitle={value.elitea_title}
              isPrivate={value?.private}
              hasFetchedData={hasFetchedData}
            />
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

    const showMismatchFooter = Boolean(
      value && !isBlankEliteaTitle(value?.elitea_title) && !selectedOption && hasFetchedData,
    );

    return (
      <Box sx={[styles.container, sx]}>
        <Select.SingleSelect
          label={label}
          shrinkLabel
          infoIconDescription={description}
          required={required}
          error={error || showMismatchFooter}
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
          valueItemSX={styles.valueItemSX}
        />
        {showMismatchFooter && (
          <CredentialMismatchFooter
            mismatchedPrivateCredential={mismatchedPrivateCredential}
            credentialId={value?.elitea_title}
            credentialType={type}
            section={section}
          />
        )}
      </Box>
    );
  },
);

CredentialsSelect.displayName = 'CredentialsSelect';

/** @type {MuiSx} */
const styles = {
  container: { marginTop: '0.5rem' },
  refreshIcon: ({ palette }) => ({
    color: palette.text.default,
    padding: 0,
    position: 'relative',
    backgroundColor: 'transparent',
    '&:hover, &:active, &.Mui-focusVisible': {
      backgroundColor: 'transparent',
    },
    '&:hover': {
      color: palette.text.secondary,
    },
    '&:hover::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '26px',
      height: '26px',
      transform: 'translate(-21%, -18%)',
      borderRadius: '50%',
      backgroundColor: palette.background.userInputBackgroundActive,
    },
  }),
  selectedValueTypography: selectedOption => ({
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minHeight: '1.5rem',
    color: ({ palette }) => (selectedOption?.label ? palette.text.secondary : palette.text.disabled),
  }),
  valueItemSX: {
    flex: 1,
  },
};

export default CredentialsSelect;
