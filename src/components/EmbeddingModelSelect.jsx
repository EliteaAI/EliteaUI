import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, FormControl, FormHelperText, Tooltip, Typography } from '@mui/material';

import { Select } from '@/[fsd]/shared/ui';
import { BaseBtn } from '@/[fsd]/shared/ui/button';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { useLazyListModelsQuery, useListModelsQuery } from '@/api/configurations';
import RefreshIcon from '@/assets/refresh-icon.svg?react';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import Person from './Icons/Person';

const EmbeddingModelSelect = memo(props => {
  const {
    label = 'Embedding Model',
    description,
    required,
    error,
    helperText,
    value, // Current selected model
    onSelectModel, // Callback for selection change
    renderValue,
    disabled,
  } = props;
  const hasAutoSelectedRef = useRef(false);

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
      if (selectedProjectId) {
        const { data } = await getModels({
          projectId: selectedProjectId,
          include_shared: true,
          section: 'embedding',
        });
        setModels(
          (data?.items || []).map(item => ({
            ...item,
            id: `${item.project_id}_${item.name}`,
          })),
        );
      }
    },
    [getModels, selectedProjectId],
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

  const optionGroups = useMemo(() => {
    const refreshButton = (
      <Tooltip
        title="Refresh the models"
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

    return [
      {
        key: 'embedding-models',
        title: 'Embedding Models',
        headerEnd: refreshButton,
        emptyLabel: 'No embedding models available',
        options: newModelsMenuData,
      },
    ];
  }, [newModelsMenuData, onRefresh]);

  const hasFetchedData = models.length > 0;
  const selectedOption = useMemo(
    () => newModelsMenuData.find(opt => opt.value === value),
    [newModelsMenuData, value],
  );
  const canAutoSwitch = value && !selectedOption && newModelsMenuData.length > 0;
  const showMismatchFooter = Boolean(value && !selectedOption && hasFetchedData && !canAutoSwitch);
  const suppressModelError = !hasFetchedData || canAutoSwitch || !!selectedOption;

  useEffect(() => {
    if (!hasFetchedData || selectedOption || hasAutoSelectedRef.current) return;
    if (!value) return;

    const fallback =
      newModelsMenuData.find(opt => opt.value === projectDefaultEmbeddingModel) || newModelsMenuData[0];
    if (fallback) {
      hasAutoSelectedRef.current = true;
      onSelectModel?.(fallback.value, { isAutoSelect: true });
    }
  }, [hasFetchedData, selectedOption, value, newModelsMenuData, projectDefaultEmbeddingModel, onSelectModel]);

  useEffect(() => {
    hasAutoSelectedRef.current = false;
  }, [value]);

  const customRenderSelectValue = useCallback(
    foundOption => {
      if (renderValue) return renderValue(foundOption);
      if (!foundOption) return null;

      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {foundOption.icon}
          <Typography variant="labelMedium">{foundOption.label}</Typography>
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
          value={defaultValueForSelect}
          optionGroups={optionGroups}
          options={[]}
          showOptionIcon
          onValueChange={onSelectModel}
          customRenderValue={customRenderSelectValue}
          error={suppressModelError ? false : error || showMismatchFooter}
          helperText={suppressModelError ? '' : helperText}
          showEmptyPlaceholder={false}
          isListFetching={isFetching}
        />
        {showMismatchFooter && !helperText && (
          <FormControl
            error
            fullWidth
          >
            <FormHelperText>Your model does not match any available models.</FormHelperText>
          </FormControl>
        )}
      </Box>
    </>
  );
});

EmbeddingModelSelect.displayName = 'EmbeddingModelSelect';

/** @type {MuiSx} */
const styles = {
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
      width: '1.625rem',
      height: '1.625rem',
      transform: 'translate(-21%, -18%)',
      borderRadius: '50%',
      backgroundColor: palette.background.userInputBackgroundActive,
    },
  }),
};

export default EmbeddingModelSelect;
