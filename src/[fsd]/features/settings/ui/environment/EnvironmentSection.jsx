import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box } from '@mui/material';

import {
  ENVIRONMENT_FIELD_DEFAULTS,
  ENVIRONMENT_FIELD_ORDER,
  ENVIRONMENT_SECTION,
} from '@/[fsd]/features/settings/lib/constants/environment.constants';
import { EnvironmentFieldHelpers } from '@/[fsd]/features/settings/lib/helpers';
import {
  useCreateConfigurationMutation,
  useGetAvailableConfigurationsTypeQuery,
  useGetConfigurationsListQuery,
  useUpdateConfigurationMutation,
} from '@/api/configurations.js';
import { PERMISSIONS, PUBLIC_PROJECT_ID } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

import EnvironmentFieldRow from './EnvironmentFieldRow';

const EnvironmentSection = memo(() => {
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const canEdit = useMemo(() => checkPermission(PERMISSIONS.configuration.update), [checkPermission]);
  const isPublicProject = projectId == PUBLIC_PROJECT_ID;
  const { toastError, toastSuccess } = useToast();

  const styles = environmentSectionStyles();

  const { data, isLoading, isFetching } = useGetConfigurationsListQuery(
    {
      projectId,
      section: ENVIRONMENT_SECTION,
      includeShared: false,
      pageSize: 100,
    },
    { skip: !projectId || !isPublicProject },
  );

  const { data: availableTypes } = useGetAvailableConfigurationsTypeQuery(
    { section: ENVIRONMENT_SECTION },
    { skip: !isPublicProject },
  );

  const [createConfiguration, { isLoading: isCreating }] = useCreateConfigurationMutation();
  const [updateConfiguration, { isLoading: isUpdating }] = useUpdateConfigurationMutation();

  const isBusy = isLoading || isFetching || isUpdating || isCreating;

  const currentConfig = useMemo(() => {
    const items = data?.items || [];
    return items.find(item => item?.section === ENVIRONMENT_SECTION);
  }, [data?.items]);

  // Extract all field definitions from the schema in explicit order
  const schemaFields = useMemo(() => {
    const schema = (availableTypes || []).find(item => item?.type === ENVIRONMENT_SECTION)?.config_schema;
    const dataProperties = schema?.properties?.data?.properties || {};

    const toField = ([key, fieldSchema]) =>
      EnvironmentFieldHelpers.buildFieldDefinition(key, fieldSchema, ENVIRONMENT_FIELD_DEFAULTS[key]);

    return ENVIRONMENT_FIELD_ORDER.filter(key => key in dataProperties).map(key =>
      toField([key, dataProperties[key]]),
    );
  }, [availableTypes]);

  // Single state object for all draft values
  const [draftValues, setDraftValues] = useState({});

  // Track the previous currentConfig reference to detect when server data arrives/changes
  const prevConfigRef = useRef(undefined);

  // Flush pending edits on page reload by blurring the active input
  useEffect(() => {
    const handleBeforeUnload = () => {
      document.activeElement?.blur();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Sync drafts with current config when it loads, falling back to schema defaults.
  // When currentConfig changes (e.g. arrives after schema), force re-sync all fields so
  // real server values are never blocked by the "already initialized" guard.
  useEffect(() => {
    if (!schemaFields.length) return;

    const configChanged = prevConfigRef.current !== currentConfig;
    prevConfigRef.current = currentConfig;

    setDraftValues(prev => {
      const allInitialized = schemaFields.every(field => prev[field.key] !== undefined);
      // Re-sync everything when config reference changed; otherwise only fill missing fields
      if (allInitialized && !configChanged) return prev;

      const next = { ...prev };
      for (const field of schemaFields) {
        if (next[field.key] === undefined || configChanged) {
          next[field.key] = String(currentConfig?.data?.[field.key] ?? field.defaultValue ?? '');
        }
      }
      return next;
    });
  }, [currentConfig, schemaFields]);

  const handleChange = useCallback((fieldKey, value) => {
    setDraftValues(prev => ({ ...prev, [fieldKey]: value }));
  }, []);

  const handleBlur = useCallback(
    async fieldKey => {
      if (!canEdit) return;

      const field = schemaFields.find(f => f.key === fieldKey);
      if (!field) return;

      const rawValue = String(draftValues[fieldKey] || '').trim();
      const parsedValue = EnvironmentFieldHelpers.parseFieldValue(rawValue, field.type);
      const savedValue = currentConfig?.data?.[fieldKey];

      if (parsedValue === savedValue) return;

      const validationError = EnvironmentFieldHelpers.validateFieldValue(rawValue, field);
      if (validationError) {
        toastError(`${field.label}: ${validationError}`);
        setDraftValues(prev => ({
          ...prev,
          [fieldKey]: String(savedValue ?? field.defaultValue ?? ''),
        }));
        return;
      }

      try {
        if (currentConfig?.id) {
          await updateConfiguration({
            projectId,
            configId: currentConfig.id,
            body: {
              label: currentConfig.label,
              shared: true,
              data: {
                ...currentConfig.data,
                [fieldKey]: parsedValue,
              },
            },
          }).unwrap();
        } else {
          await createConfiguration({
            projectId,
            body: {
              alita_title: ENVIRONMENT_SECTION,
              label: ENVIRONMENT_SECTION,
              type: ENVIRONMENT_SECTION,
              shared: true,
              data: { [fieldKey]: parsedValue },
            },
          }).unwrap();
        }

        toastSuccess(`${field.label} saved`);
      } catch (e) {
        toastError(e?.data?.error || e?.data?.message || e?.message || 'Failed to save configuration');
      }
    },
    [
      canEdit,
      createConfiguration,
      currentConfig,
      draftValues,
      schemaFields,
      projectId,
      toastError,
      toastSuccess,
      updateConfiguration,
    ],
  );

  const handleRestore = useCallback(
    async fieldKey => {
      const field = schemaFields.find(f => f.key === fieldKey);
      if (!canEdit || !currentConfig?.id || field?.defaultValue === undefined) return;

      setDraftValues(prev => ({ ...prev, [fieldKey]: String(field.defaultValue) }));

      try {
        await updateConfiguration({
          projectId,
          configId: currentConfig.id,
          body: {
            label: currentConfig?.label,
            shared: true,
            data: {
              ...currentConfig?.data,
              [fieldKey]: field.defaultValue,
            },
          },
        }).unwrap();

        toastSuccess(`${field.label} restored to default`);
      } catch (e) {
        toastError(e?.data?.error || e?.data?.message || e?.message || 'Failed to restore configuration');
      }
    },
    [canEdit, currentConfig, schemaFields, projectId, toastError, toastSuccess, updateConfiguration],
  );

  if (!isPublicProject) return null;

  return (
    <Box sx={styles.content}>
      {schemaFields.map(field => (
        <EnvironmentFieldRow
          key={field.key}
          field={field}
          value={draftValues[field.key] ?? ''}
          disabled={!canEdit || isBusy}
          onChange={handleChange}
          onBlur={handleBlur}
          onRestore={handleRestore}
        />
      ))}
    </Box>
  );
});

EnvironmentSection.displayName = 'EnvironmentSection';

/** @type {MuiSx} */
const environmentSectionStyles = () => ({
  content: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1.75rem',
    gap: '1.5rem',
    backgroundColor: palette.background.tabPanel,
    height: '100%',
  }),
});

export default EnvironmentSection;
