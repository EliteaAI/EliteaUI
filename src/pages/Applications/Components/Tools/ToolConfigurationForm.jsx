import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import { genInitialToolSettings } from '@/common/getToolInitialValueBySchema.js';
import { isNullOrUndefined } from '@/common/utils';
import ConfigurationSelect from '@/components/ConfigurationSelect';
import CredentialsSelect from '@/components/CredentialsSelect';
import FormInput from '@/components/FormInput.jsx';
import useConfigurations, {
  Create_Personal_Title,
  Create_Project_Title,
  Manual_Title,
} from '@/hooks/useConfigurations';
import useGetCurrentConfigurationAsSchemas from '@/hooks/useGetCurrentConfigurationAsSchemas';

export const CONFIGURATION_VIEW_OPTIONS = {
  ConfigurationSelect: 'configuration',
  CredentialsSelect: 'credentials',
};

export default function ToolConfigurationForm({
  editToolDetail,
  editField = () => {},
  configurationErrors,
  showConfigurationValidateError,
  configurationName,
  setConfigurationName,
  configuration,
  setConfiguration,
  configSelectProps,
  isCreationAllowed = true,
  configurationViewOptions = CONFIGURATION_VIEW_OPTIONS.ConfigurationSelect,
  showOnlyConfigurationFields = false,
  hideConfigurationNameInput = false,
  specifiedProjectId,
  children,
  shouldKeepSettings,
}) {
  const { personal_project_id } = useSelector(state => state.user);
  const [originalSettings, setOriginalSettings] = useState({});
  const [showConfigurableFields, setShowConfigurableFields] = useState(true);
  const firstRender = useRef(true);

  // Use tool type directly for configuration type
  const configurationType = useMemo(() => {
    return editToolDetail?.type;
  }, [editToolDetail?.type]);

  const {
    settings: { configuration_title = '', configuration_personal = null },
  } = editToolDetail || {
    settings: {
      configuration_title: '',
    },
  };

  useEffect(() => {
    if (firstRender.current) {
      if (shouldKeepSettings) {
        const {
          // eslint-disable-next-line no-unused-vars
          settings: { configuration_title: _any1, configuration_personal: _any2, ...otherSettings },
        } = editToolDetail;
        setOriginalSettings(otherSettings);
      }
      firstRender.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use configurationType directly for useConfigurations
  const { onLoadMore, setQuery, isFetching, configurations, originalConfigurations, query } =
    useConfigurations(configurationType, specifiedProjectId);

  const { configurationsAsSchema } = useGetCurrentConfigurationAsSchemas();
  const initialToolTypeState = useMemo(() => {
    const schema = (configurationsAsSchema || {}).find(config => config.title === configurationType);
    return schema ? genInitialToolSettings(schema) : {};
  }, [configurationsAsSchema, configurationType]);

  const doesConfigurationNotMatchAnything = useMemo(
    () =>
      !!configuration_title &&
      configuration_title !== Manual_Title &&
      configuration_title !== Create_Personal_Title &&
      configuration_title !== Create_Project_Title &&
      !isFetching &&
      !originalConfigurations.find(config => {
        return config.title === configuration_title || config.data.title === configuration_title;
      }),
    [configuration_title, isFetching, originalConfigurations],
  );

  useEffect(() => {
    if (
      configuration_title &&
      configuration_title != configuration.configuration_title &&
      configuration.configuration_title !== Manual_Title &&
      configuration.configuration_title !== Create_Personal_Title &&
      configuration.configuration_title !== Create_Project_Title
    ) {
      const fullMatchedConfiguration = configurations.find(
        config =>
          config.project_id == personal_project_id &&
          configuration_personal &&
          config.settings?.title === configuration_title,
      );
      if (fullMatchedConfiguration) {
        setConfiguration({
          configuration_title: fullMatchedConfiguration.settings.title,
          configuration_personal: fullMatchedConfiguration.project_id == personal_project_id,
        });
        // eslint-disable-next-line no-unused-vars
        const { title, ...settings } = fullMatchedConfiguration.settings;
        editField('settings', {
          ...settings,
          ...(editToolDetail?.settings || {}),
          configuration_title: fullMatchedConfiguration.settings.title,
          configuration_personal: fullMatchedConfiguration.project_id == personal_project_id,
        });
      } else {
        const titleMatchedConfiguration = configurations.find(
          config => config.settings?.title === configuration_title,
        );
        if (titleMatchedConfiguration) {
          // eslint-disable-next-line no-unused-vars
          const { title, ...settings } = titleMatchedConfiguration.settings;
          setConfiguration({
            configuration_personal: titleMatchedConfiguration.project_id == personal_project_id,
            configuration_title: titleMatchedConfiguration.settings.title,
          });
          editField('settings', {
            ...settings,
            ...(editToolDetail?.settings || {}),
            configuration_title: titleMatchedConfiguration.settings.title,
            configuration_personal: titleMatchedConfiguration.project_id == personal_project_id,
          });
        } else {
          setConfiguration({
            configuration_title: Manual_Title,
            configuration_personal: null,
          });
        }
      }
    }
  }, [
    configuration_personal,
    personal_project_id,
    configuration.configuration_title,
    configurations,
    editField,
    editToolDetail?.settings,
    configuration_title,
    setConfiguration,
  ]);

  useEffect(() => {
    if (
      configurationViewOptions === CONFIGURATION_VIEW_OPTIONS.ConfigurationSelect &&
      !configuration_title &&
      isNullOrUndefined(configuration_personal)
    ) {
      setConfiguration({
        configuration_title: Manual_Title,
        configuration_personal: null,
      });
    }
  }, [configuration_personal, configuration_title, setConfiguration, configurationViewOptions]);

  const onSelectConfiguration = useCallback(
    selectedConfiguration => {
      setConfiguration(selectedConfiguration);
      const newTitle =
        selectedConfiguration?.configuration_title === Manual_Title ||
        selectedConfiguration?.configuration_title === Create_Personal_Title ||
        selectedConfiguration?.configuration_title === Create_Project_Title
          ? ''
          : selectedConfiguration?.configuration_title;
      editField(
        'settings',
        {
          ...selectedConfiguration.settings,
          ...originalSettings,
          configuration_title: newTitle,
          configuration_personal: selectedConfiguration?.configuration_personal,
        },
        false,
      );
    },
    [editField, originalSettings, setConfiguration],
  );

  return (
    <>
      {/* Always show configuration selection if configurationType is set */}
      {!!configurationType && (
        <>
          {!showOnlyConfigurationFields &&
            configurationViewOptions === CONFIGURATION_VIEW_OPTIONS.ConfigurationSelect && (
              <ConfigurationSelect
                showBorder
                label="Configuration"
                onSelectConfiguration={onSelectConfiguration}
                value={configuration}
                sx={{ marginTop: '1px' }}
                configurations={configurations}
                setQuery={setQuery}
                query={query}
                onLoadMore={onLoadMore}
                isFetching={isFetching}
                error={doesConfigurationNotMatchAnything}
                helperText={
                  doesConfigurationNotMatchAnything &&
                  "The configuration of this tool doesn't match any available configurations."
                }
                configSelectProps={configSelectProps}
                isCreationAllowed={isCreationAllowed}
              />
            )}
          {!showOnlyConfigurationFields &&
            configurationViewOptions === CONFIGURATION_VIEW_OPTIONS.CredentialsSelect && (
              <CredentialsSelect
                label="Credentials"
                onSelectConfiguration={onSelectConfiguration}
                value={configuration}
                sx={{ marginTop: '1px' }}
                configurations={configurations}
                setQuery={setQuery}
                query={query}
                onLoadMore={onLoadMore}
                isFetching={isFetching}
                error={doesConfigurationNotMatchAnything}
                helperText={
                  doesConfigurationNotMatchAnything &&
                  "The credential of this toolkit doesn't match any available credentials."
                }
                configSelectProps={configSelectProps}
                isCreationAllowed={isCreationAllowed}
                setShowConfigurableFields={setShowConfigurableFields}
                initialToolTypeState={initialToolTypeState}
              />
            )}
          {!hideConfigurationNameInput &&
            [Create_Personal_Title, Create_Project_Title].includes(configuration?.configuration_title) && (
              <FormInput
                required
                label="Configuration Name"
                value={configurationName}
                onChange={event => setConfigurationName(event.target.value)}
                sx={{
                  marginTop: '0px',
                }}
                error={showConfigurationValidateError && configurationErrors.configurationName}
                helperText={
                  showConfigurationValidateError &&
                  configurationErrors.configurationName &&
                  'Field is required'
                }
              />
            )}
        </>
      )}
      {showConfigurableFields &&
        [Manual_Title, Create_Personal_Title, Create_Project_Title].includes(
          configuration?.configuration_title,
        ) &&
        children}
    </>
  );
}
