import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { ConfigurationConstants } from '@/[fsd]/features/settings/lib/constants';
import { ConfigurationHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { Select } from '@/[fsd]/shared/ui';
import { PERMISSIONS } from '@/common/constants.js';
import useCheckPermission from '@/hooks/useCheckPermission';

import ConfigurationCard from './ConfigurationCard';

const { DEFAULT_SETTINGS_LAYOUT } = ConfigurationConstants;

// Define group display order
const GROUP_ORDER = ['OpenAI', 'Anthropic', 'Other LLM Providers'];

const ConfigurationSection = memo(props => {
  const {
    title,
    configurations,
    isLoading,
    hasDefaultSetting,
    defaultSettingLabel,
    defaultSettingValue,
    defaultSettingOptions,
    onChangeDefaultSetting,
    additionalDefaultSettings = [],
    defaultSettingsLayout = DEFAULT_SETTINGS_LAYOUT.STACK,
    groupTheModelsByProvider = false,
  } = props;

  const groupedConfigurations = useMemo(() => {
    if (!groupTheModelsByProvider) {
      return null;
    }

    const groups = configurations.reduce((result, config) => {
      const groupLabel = ConfigurationHelpers.getConfigurationGroup(config.name, config.type, config.label);
      if (!result[groupLabel]) {
        result[groupLabel] = [];
      }
      result[groupLabel].push(config);
      return result;
    }, {});

    // Sort configurations within each group by displayName
    Object.keys(groups).forEach(groupLabel => {
      groups[groupLabel].sort(ConfigurationHelpers.sortConfigurationsByDisplayName);
    });

    return groups;
  }, [configurations, groupTheModelsByProvider]);

  // Sort ungrouped configurations by displayName
  const sortedConfigurations = useMemo(() => {
    if (groupTheModelsByProvider) {
      return configurations;
    }
    return [...configurations].sort(ConfigurationHelpers.sortConfigurationsByDisplayName);
  }, [configurations, groupTheModelsByProvider]);

  const { checkPermission } = useCheckPermission();
  const canEdit = useMemo(() => checkPermission(PERMISSIONS.configuration.update), [checkPermission]);
  const styles = getStyles(defaultSettingsLayout);
  const locationState = useMemo(() => ({ from: [], routeStack: [] }), []);

  if (isLoading) {
    return (
      <Box sx={styles.container}>
        <Typography
          variant="headingSmall"
          sx={styles.title}
        >
          {title}
        </Typography>
        <Typography
          variant="bodyMedium"
          color="text.primary"
        >
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!configurations || configurations.length === 0) {
    return null;
  }

  return (
    <Box sx={styles.container}>
      <Typography
        variant="headingSmall"
        sx={styles.title}
      >
        {title}
      </Typography>
      {hasDefaultSetting && (
        <Box sx={styles.defaultSettingsContainer}>
          <Select.SingleSelect
            separateLabel
            label={defaultSettingLabel}
            value={defaultSettingValue}
            onValueChange={onChangeDefaultSetting}
            options={defaultSettingOptions}
            disabled={!canEdit}
            showOptionIcon
          />

          {additionalDefaultSettings
            .filter(setting => setting)
            .map(setting => (
              <Select.SingleSelect
                separateLabel
                key={setting.key || setting.label}
                label={setting.label}
                value={setting.value}
                onValueChange={setting.onChange}
                options={setting.options}
                disabled={!canEdit}
                showOptionIcon
              />
            ))}
        </Box>
      )}
      {groupTheModelsByProvider ? (
        GROUP_ORDER.map((groupLabel, idx) => {
          const groupConfigs = groupedConfigurations[groupLabel];
          if (!groupConfigs || groupConfigs.length === 0) return null;

          return (
            <Box
              key={groupLabel}
              sx={styles.groupContainer({ showBorder: idx < GROUP_ORDER.length - 1 })}
            >
              <Typography
                variant="subtitle"
                color="text.primary"
              >
                {groupLabel}
              </Typography>
              <Box sx={styles.configurationsContainer({ isGroup: true })}>
                {groupConfigs.map((configuration, index) => (
                  <ConfigurationCard
                    key={`${configuration.id || configuration.name}-${index}`}
                    configuration={configuration}
                    canEdit={canEdit}
                    locationState={locationState}
                    isDefault={
                      defaultSettingValue === `${configuration.data?.name}<<>>${configuration.project_id}`
                    }
                  />
                ))}
              </Box>
            </Box>
          );
        })
      ) : (
        <Box sx={styles.configurationsContainer()}>
          {sortedConfigurations.map((configuration, index) => (
            <ConfigurationCard
              key={`${configuration.id || configuration.name}-${index}`}
              configuration={configuration}
              canEdit={canEdit}
              locationState={locationState}
              isDefault={defaultSettingValue === `${configuration.data?.name}<<>>${configuration.project_id}`}
            />
          ))}
        </Box>
      )}
    </Box>
  );
});

ConfigurationSection.displayName = 'ConfigurationSection';

/** @type {MuiSx} */
const getStyles = defaultSettingsLayout => ({
  container: {
    padding: '1rem 1.5rem',
    gap: '.5rem',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  defaultSettingsContainer: {
    display: 'flex',
    flexDirection: defaultSettingsLayout === DEFAULT_SETTINGS_LAYOUT.INLINE ? 'row' : 'column',
    flexWrap: defaultSettingsLayout === DEFAULT_SETTINGS_LAYOUT.INLINE ? 'wrap' : 'nowrap',
    alignItems: defaultSettingsLayout === DEFAULT_SETTINGS_LAYOUT.INLINE ? 'center' : 'stretch',
    justifyContent: 'flex-start',
    gap: '1.5rem',
  },
  defaultSettingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
  },
  defaultSettingLabel: width => ({
    width,
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    whiteSpace: 'nowrap',
  }),
  configurationsContainer: ({ isGroup } = {}) => ({
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '0.75rem',
    justifyContent: 'flex-start',
    marginTop: isGroup ? '1rem' : undefined,
  }),
  groupContainer: ({ showBorder }) => ({
    display: 'flex',
    flexDirection: 'column',
    paddingTop: '.5rem',
    paddingBottom: '1rem',
    borderBottom: showBorder ? '0.0625rem solid' : 'none',
    borderColor: ({ palette }) => palette.border.sidebarDivider,
  }),
});

export default ConfigurationSection;
