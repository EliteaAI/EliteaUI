import { DEFAULT_PARTICIPANT_NAME } from '@/common/constants';

export const convertCredentialConfigSchema = (
  configSchema,
  toolSchema,
  systemSenderName = DEFAULT_PARTICIPANT_NAME,
) => {
  if (
    !configSchema ||
    Object.keys(configSchema).length === 0 ||
    (configSchema.sections === 'credentials' && !toolSchema)
  ) {
    return {};
  }
  const { properties, required, ...rest } = configSchema;
  const { data, shared, title, label, elitea_title } = properties || {};
  const { properties: dataProperties, required: dataRequired, metadata = {} } = data || {};
  // eslint-disable-next-line no-unused-vars
  const { title: _dataTitle, ...resetProperties } = dataProperties || {};
  const { sections, ...restMetadata } = metadata || {};
  const nonConfigPropsOfData = Object.keys(resetProperties || {})
    .filter(key => !resetProperties[key].$ref)
    .reduce((acc, key) => {
      acc[key] = resetProperties[key];
      return acc;
    }, {});
  const keysOfConfigPropsOfData = Object.keys(resetProperties || {}).filter(
    key => resetProperties[key].$ref || resetProperties[key].anyOf?.some(item => item.$ref),
  );
  const configPropsOfData = keysOfConfigPropsOfData
    .filter(key => resetProperties[key].$ref || resetProperties[key].anyOf?.some(item => item.$ref))
    .reduce((acc, key) => {
      acc[key] = resetProperties[key];
      return acc;
    }, {});
  const nestConfigPropsOfData = keysOfConfigPropsOfData.reduce((acc, key) => {
    acc[key] = {
      ...configPropsOfData[key],
      type: 'configuration',
    };
    return acc;
  }, {});

  // Convert the config_schema to a more usable format
  const convertedSchema = {
    ...rest,
    required: [
      ...(required || []),
      ...Object.keys(nonConfigPropsOfData || {}).filter(key => dataRequired?.includes(key)),
    ].filter(key => key !== 'type'),
    properties: elitea_title
      ? {
          label: label || { title: 'Label', type: 'string' },
          elitea_title: elitea_title
            ? {
                ...elitea_title,
                title:
                  elitea_title.title?.replace('EliteA Title', `${systemSenderName} title`) ||
                  `${systemSenderName} title`,
              }
            : { title: `${systemSenderName} title`, type: 'string' },
          ...nonConfigPropsOfData,
          ...nestConfigPropsOfData,
          shared,
        }
      : {
          title,
          ...resetProperties,
          shared,
        },
    metadata: {
      ...restMetadata,
      sections: sections || toolSchema?.metadata?.sections || {},
    },
  };
  // console.log('convertedSchema', convertedSchema)
  return convertedSchema;
};
