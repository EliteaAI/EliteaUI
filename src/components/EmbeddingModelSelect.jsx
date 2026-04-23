import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, Typography } from '@mui/material';

import { Select } from '@/[fsd]/shared/ui';
import { useLazyListModelsQuery, useListModelsQuery } from '@/api/configurations';
import RefreshIcon from '@/assets/refresh-icon.svg?react';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import Person from './Icons/Person';

const EmbeddingModelSelect = memo(
  ({
    label = 'Embedding Model',
    description,
    required,
    error,
    helperText,
    value, // Current selected model
    onSelectModel, // Callback for selection change
    renderValue,
    disabled,
  }) => {
    const { personal_project_id } = useSelector(state => state.user);
    const selectedProjectId = useSelectedProjectId();
    const [getModels, { isFetching }] = useLazyListModelsQuery();

    const {
      data: embeddingModelsData = {
        items: [],
        total: 0,
        default_model_name: '',
        default_model_project_id: '',
      },
    } = useListModelsQuery(
      { projectId: selectedProjectId, include_shared: true, section: 'embedding' },
      { skip: !selectedProjectId },
    );

    const projectDefaultEmbeddingModel = useMemo(
      () => embeddingModelsData?.default_model_name || '',
      [embeddingModelsData?.default_model_name],
    );

    const [models, setModels] = useState([]);
    const defaultValueForSelect = value || projectDefaultEmbeddingModel || '';

    const isNewConfigurationPersonal = useCallback(
      model => model.project_id === personal_project_id,
      [personal_project_id],
    );

    const onRefresh = useCallback(
      async event => {
        event?.stopPropagation();
        setModels([]);
        let teamProjectModels = [];
        if (selectedProjectId) {
          const { data } = await getModels({
            projectId: selectedProjectId,
            include_shared: true,
            section: 'embedding',
          });
          // Add regular models with unified ID
          teamProjectModels = [
            ...(data?.items || []).map(item => ({
              ...item,
              id: `${item.project_id}_${item.name}`, // Unified ID pattern
            })),
          ];
        }
        if (personal_project_id && personal_project_id !== selectedProjectId) {
          const { data } = await getModels({
            projectId: personal_project_id,
            include_shared: true,
            section: 'embedding',
          });
          // Add personal models with unified ID
          teamProjectModels = [
            ...teamProjectModels,
            ...(data?.items || []).map(item => ({
              ...item,
              id: `${item.project_id}_${item.name}`, // Unified ID pattern
            })),
          ];
        }
        // Remove duplicates by unified ID
        const uniqueModels = teamProjectModels.reduce((acc, model) => {
          if (!acc.find(existing => existing.id === model.id)) {
            acc.push(model);
          }
          return acc;
        }, []);
        setModels(uniqueModels);
      },
      [getModels, personal_project_id, selectedProjectId],
    );

    useEffect(() => {
      onRefresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProjectId, personal_project_id]);

    const newModelsMenuData = useMemo(() => {
      const modelsOptions = models.map(model => ({
        value: model.name,
        label: model.display_name || model.name,
        icon: isNewConfigurationPersonal(model) ? (
          <Person sx={{ fontSize: '0.875rem' }} />
        ) : (
          <BriefcaseIcon sx={{ fontSize: '0.875rem' }} />
        ),
      }));

      return modelsOptions;
    }, [models, isNewConfigurationPersonal]);

    const optionsWithActions = useMemo(() => {
      const actionOption = {
        value: 'refresh-models',
        label: 'Refresh',
        icon: <RefreshIcon sx={{ fontSize: '1rem' }} />,
        variant: 'action',
        onActivate: onRefresh,
      };

      return [actionOption, ...newModelsMenuData];
    }, [newModelsMenuData, onRefresh]);

    const hasModelsOptions = useMemo(() => newModelsMenuData.length > 0, [newModelsMenuData]);

    const customRenderSelectValue = useCallback(
      foundOption => {
        if (renderValue) return renderValue(foundOption);

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {foundOption?.icon}
            <Typography variant="labelMedium">{foundOption?.label}</Typography>
          </Box>
        );
      },
      [renderValue],
    );

    return (
      <>
        <Box sx={{ marginTop: '0.5rem' }}>
          <Select.SingleSelect
            showBorder
            disabled={disabled}
            required={required}
            label={label}
            infoIconDescription={description}
            value={hasModelsOptions ? defaultValueForSelect : ''}
            options={optionsWithActions}
            showOptionIcon
            onValueChange={onSelectModel}
            customRenderValue={customRenderSelectValue}
            error={error}
            helperText={helperText}
            showEmptyPlaceholder={false}
            isListFetching={isFetching}
          />
        </Box>
      </>
    );
  },
);

EmbeddingModelSelect.displayName = 'EmbeddingModelSelect';

export default EmbeddingModelSelect;
