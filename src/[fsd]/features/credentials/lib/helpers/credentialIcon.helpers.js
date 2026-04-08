import { CredentialNameHelpers } from '@/[fsd]/features/credentials/lib/helpers';
import { getToolIconByType } from '@/common/toolkitUtils';

const getCredentialIcon = (integrationType, theme, toolkitSchemas, configurationsAsSchema) => {
  const toolType = integrationType;

  let mappedToolType = toolType;
  switch (toolType) {
    case 'test_rail':
      mappedToolType = 'testrail';
      break;
    case 'azure_devops':
      mappedToolType = 'ado_boards';
      break;
    default:
      mappedToolType = toolType;
  }

  return getToolIconByType(
    mappedToolType,
    theme,
    configurationsAsSchema.find(config => config.type === integrationType)?.config_schema?.properties.data ||
      toolkitSchemas[mappedToolType],
  );
};

export const getCredentialIconData = (credentialType, theme, toolkitSchemas, configurationsAsSchema) => {
  const iconComponent = getCredentialIcon(credentialType, theme, toolkitSchemas, configurationsAsSchema);
  const credentialTypeName = CredentialNameHelpers.extraCredentialName(credentialType);

  return {
    iconComponent,
    label: credentialTypeName,
    tags: [
      {
        id: credentialType,
        name: credentialTypeName,
        data: { type: credentialType },
      },
    ],
    icon_meta: {
      component: iconComponent,
      alt: `${credentialTypeName} icon`,
      type: 'component',
    },
  };
};
