import { useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { Typography } from '@mui/material';

import ToolIcon from '@/assets/tool-icon.svg?react';
import SingleSelectWithSearch from '@/components/SingleSelectWithSearch';
import { Create_Personal_Title, Create_Project_Title, Manual_Title } from '@/hooks/useConfigurations';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { useTheme } from '@emotion/react';

import FolderIcon from './Icons/FolderIcon';
import Person from './Icons/Person';

export default function ConfigurationSelect({
  label = 'Configuration',
  onBlur,
  error,
  helperText,
  value,
  required,
  onSelectConfiguration,
  configurations,
  onLoadMore,
  setQuery,
  query,
  isFetching,
  sx,
  configSelectProps,
  isCreationAllowed = true,
}) {
  const theme = useTheme();
  const projectId = useSelectedProjectId();
  const selectedConfiguration = useMemo(() => {
    if (![Manual_Title, Create_Personal_Title, Create_Project_Title].includes(value?.configuration_title)) {
      return `${value?.configuration_personal}_${value?.configuration_title}`;
    }
    return `${value?.configuration_title}`;
  }, [value?.configuration_personal, value?.configuration_title]);

  const { personal_project_id } = useSelector(state => state.user);
  const options = useMemo(() => {
    const filteredIntegrations = configurations.map(configuration => {
      // eslint-disable-next-line no-unused-vars
      const { title } = configuration.settings;
      const isConfigurationPersonal = configuration.project_id == personal_project_id;
      return {
        id: `${configuration.settings.title}_${configuration.project_id}`,
        value: `${isConfigurationPersonal}_${configuration.settings.title || configuration.config.name}`,
        label: (
          <span style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            {isConfigurationPersonal ? <Person fontSize={'16px'} /> : <FolderIcon fontSize={'16px'} />}
            {configuration.settings.title || configuration.settings.base_url}
            {/*{configuration.settings.title || configuration.settings.base_url || configuration.settings.organization_url}*/}
          </span>
        ),
        configuration_title: configuration.settings.title || configuration.config.name,
        configuration_personal: isConfigurationPersonal,
        settings: {},
      };
    });

    const optionsList = [
      {
        value: Manual_Title,
        label: (
          <span style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <ToolIcon
              width={16}
              height={16}
            />
            {'Create manual configuration'}
          </span>
        ),
        configuration_title: Manual_Title,
        configuration_personal: null,
      },
    ];

    if (isCreationAllowed) {
      projectId == personal_project_id
        ? optionsList.push({
            value: Create_Personal_Title,
            label: (
              <span
                style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}
              >
                <Person fontSize={'16px'} />
                {'Create private configuration'}
              </span>
            ),
            configuration_title: Create_Personal_Title,
            configuration_personal: true,
          })
        : optionsList.push(
            {
              value: Create_Personal_Title,
              label: (
                <span
                  style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}
                >
                  <Person fontSize={'16px'} />
                  {'Create private configuration'}
                </span>
              ),
              configuration_title: Create_Personal_Title,
              configuration_personal: true,
            },
            {
              value: Create_Project_Title,
              label: (
                <span
                  style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}
                >
                  <FolderIcon fontSize={'16px'} />
                  {'Create project configuration'}
                </span>
              ),
              configuration_title: Create_Project_Title,
              configuration_personal: false,
            },
          );
    }

    optionsList.push(...filteredIntegrations);

    return optionsList.filter(item =>
      projectId != personal_project_id ? true : item.value !== 'null_' + Create_Project_Title,
    );
  }, [configurations, isCreationAllowed, personal_project_id, projectId]);

  const onValueChange = useCallback(
    option => {
      const config = {
        configuration_personal: option.configuration_personal,
        configuration_title: option.configuration_title,
        settings: option.settings || {},
      };
      onSelectConfiguration(config);
    },
    [onSelectConfiguration],
  );

  const renderValue = useCallback(
    option => {
      return (
        <Typography
          variant="bodyMedium"
          component="div"
          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpaceCollapse: 'preserve' }}
          color={option?.label ? theme.palette.text.secondary : theme.palette.text.disabled}
        >
          {option?.value === Manual_Title ? (
            <span style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <ToolIcon
                width={16}
                height={16}
              />
              {'Manual configuration'}
            </span>
          ) : (
            option?.label || 'Select'
          )}
        </Typography>
      );
    },
    [theme.palette.text.disabled, theme.palette.text.secondary],
  );

  return (
    <SingleSelectWithSearch
      required={required}
      label={label}
      value={selectedConfiguration}
      onValueChange={onValueChange}
      searchString={query}
      onSearch={setQuery}
      options={options}
      isFetching={isFetching}
      onLoadMore={onLoadMore}
      error={error}
      helperText={helperText}
      onClose={onBlur}
      sx={sx}
      renderValue={renderValue}
      {...configSelectProps}
    />
  );
}
