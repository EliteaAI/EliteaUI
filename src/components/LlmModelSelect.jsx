import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, Typography } from '@mui/material';

import { Select } from '@/[fsd]/shared/ui';
import { useLazyListModelsQuery } from '@/api/configurations';
import RefreshIcon from '@/assets/refresh-icon.svg?react';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import Person from './Icons/Person';

const LlmModelSelect = memo(props => {
  const {
    label = 'LLM Model',
    description,
    required,
    error,
    helperText,
    value, // Current selected model
    onSelectModel, // Callback for selection change
    renderValue,
    disabled,
    sx,
  } = props;
  const { personal_project_id } = useSelector(state => state.user);
  const selectedProjectId = useSelectedProjectId();
  const [getModels, { isFetching }] = useLazyListModelsQuery();
  const [hasFetchedData, setHasFetchedData] = useState(false);

  const [models, setModels] = useState([]);

  const isNewConfigurationPersonal = useCallback(
    model => model.project_id === personal_project_id,
    [personal_project_id],
  );

  const onRefresh = useCallback(
    async event => {
      event?.stopPropagation();
      setModels([]);
      setHasFetchedData(false);
      let teamProjectModels = [];
      if (selectedProjectId) {
        const { data } = await getModels({
          projectId: selectedProjectId,
          include_shared: true,
          section: 'llm',
        });
        teamProjectModels = [
          ...(data?.items || []).map(item => ({
            ...item,
            id: `${item.project_id}_${item.name}`,
          })),
        ];
      }
      if (personal_project_id && personal_project_id !== selectedProjectId) {
        const { data } = await getModels({
          projectId: personal_project_id,
          include_shared: true,
          section: 'llm',
        });
        teamProjectModels = [
          ...teamProjectModels,
          ...(data?.items || []).map(item => ({
            ...item,
            id: `${item.project_id}_${item.name}`,
          })),
        ];
      }
      const uniqueModels = teamProjectModels.reduce((acc, model) => {
        if (!acc.find(existing => existing.id === model.id)) {
          acc.push(model);
        }
        return acc;
      }, []);
      setHasFetchedData(true);
      setModels(uniqueModels);
    },
    [getModels, personal_project_id, selectedProjectId],
  );

  useEffect(() => {
    onRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, personal_project_id]);

  const newModelsMenuData = useMemo(() => {
    return models.map(model => ({
      value: model.name,
      label: model.display_name || model.name,
      icon: isNewConfigurationPersonal(model) ? (
        <Person sx={{ fontSize: '0.875rem' }} />
      ) : (
        <BriefcaseIcon sx={{ fontSize: '0.875rem' }} />
      ),
    }));
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

  const isStaleValue = useMemo(
    () => Boolean(value) && hasFetchedData && !models.some(m => m.name === value),
    [value, hasFetchedData, models],
  );
  const mergedError = Boolean(error) || isStaleValue;
  const mergedHelperText = isStaleValue ? 'Your model does not match any available models.' : helperText;

  return (
    <>
      <Box sx={sx ? [{ marginTop: '0.5rem' }, sx] : { marginTop: '0.5rem' }}>
        <Select.SingleSelect
          showBorder
          disabled={disabled}
          required={required}
          label={label}
          infoIconDescription={description}
          value={hasModelsOptions ? value : ''}
          options={optionsWithActions}
          showOptionIcon
          onValueChange={onSelectModel}
          customRenderValue={customRenderSelectValue}
          error={mergedError}
          helperText={mergedHelperText}
          showEmptyPlaceholder={false}
          isListFetching={isFetching}
        />
      </Box>
    </>
  );
});

LlmModelSelect.displayName = 'LlmModelSelect';

export default LlmModelSelect;
