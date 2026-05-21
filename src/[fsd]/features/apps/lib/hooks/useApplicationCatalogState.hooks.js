import { createElement, useMemo } from 'react';

import { useTheme } from '@mui/material';

import { useGetCurrentToolkitSchemas } from '@/[fsd]/features/toolkits/lib/hooks';
import { useListToolkitTypesQuery } from '@/api/toolkits';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import {
  APPLICATION_CATALOG,
  APPLICATION_REQUEST_SUPPORT_EMAIL,
} from '../constants/applicationCatalog.constants';

const getApplicationStatusLabel = (isConfigured, canCreate) => {
  if (isConfigured) return 'Configured';
  if (canCreate) return 'Available';

  return 'By request';
};

export const useApplicationCatalogState = () => {
  const theme = useTheme();
  const projectId = useSelectedProjectId();

  const { toolkitSchemas, isFetching: isFetchingToolkitSchemas } = useGetCurrentToolkitSchemas();
  const { data: configuredTypesData, isFetching: isFetchingConfiguredTypes } = useListToolkitTypesQuery(
    { projectId, params: { application: true } },
    { skip: !projectId },
  );

  const applicationSchemas = useMemo(() => {
    return Object.entries(toolkitSchemas || {}).reduce((acc, [type, schema]) => {
      if (schema?.metadata?.application === true) {
        acc[type] = schema;
      }

      return acc;
    }, {});
  }, [toolkitSchemas]);

  const configuredTypes = useMemo(
    () => new Set(configuredTypesData?.rows || []),
    [configuredTypesData?.rows],
  );

  const applications = useMemo(() => {
    return APPLICATION_CATALOG.map(application => {
      const schema = applicationSchemas[application.type];
      const typeLabel = schema?.metadata?.label || application.name;
      const canCreate = Boolean(schema);
      const isConfigured = configuredTypes.has(application.type);
      const statusLabel = getApplicationStatusLabel(isConfigured, canCreate);
      const iconElement = application.IconComponent
        ? createElement(application.IconComponent, {
            fill: theme.palette.icon.fill.default,
            width: '1rem',
            height: '1rem',
          })
        : null;

      return {
        ...application,
        id: application.type,
        typeLabel,
        schema,
        description: application.shortDescription,
        icon_meta: iconElement ? { component: iconElement } : undefined,
        author: {
          id: 'application-support',
          name: 'EliteA Support',
        },
        tags: [
          {
            id: `${application.type}-status`,
            name: statusLabel,
          },
          {
            id: `${application.type}-type`,
            name: typeLabel,
          },
        ],
        canCreate,
        canRequest: !canCreate && !isConfigured,
        isConfigured,
        statusLabel,
        supportEmail: APPLICATION_REQUEST_SUPPORT_EMAIL,
        documentation: application.documentation,
      };
    });
  }, [applicationSchemas, configuredTypes, theme]);

  return {
    applications,
    isLoading: isFetchingToolkitSchemas || isFetchingConfiguredTypes,
  };
};
