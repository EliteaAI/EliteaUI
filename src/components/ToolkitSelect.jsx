import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, FormControl, FormHelperText, IconButton, InputLabel, Tooltip, Typography } from '@mui/material';

import { Select } from '@/[fsd]/shared/ui';
import { toolkitsApi } from '@/api/toolkits';
import RefreshIcon from '@/assets/refresh-icon.svg?react';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import Person from './Icons/Person';

const MULTI_SELECT_ID = 'elitea-toolkit-select-multiple';
const REFRESH_VALUE = 'refresh-toolkits';
const STALE_TOOLKIT_MESSAGE = 'Your toolkit does not match any available toolkits.';

const getToolkitIdString = unifiedId => String(unifiedId).split('_')[0];

const ToolkitSelect = memo(
  ({
    label = 'Toolkit',
    required,
    error,
    helperText,
    value,
    onSelectToolkit,
    sx,
    disabled,
    multiple = false,
    filters = {},
  }) => {
    const { personal_project_id } = useSelector(state => state.user);
    const selectedProjectId = useSelectedProjectId();
    const [getToolkits, { isFetching }] = toolkitsApi.useLazyToolkitsListQuery();
    const [hasFetchedData, setHasFetchedData] = useState(false);
    const [toolkits, setToolkits] = useState([]);

    const serializedFilters = JSON.stringify(filters);

    const onRefresh = useCallback(
      async event => {
        event?.stopPropagation();
        setToolkits([]);
        setHasFetchedData(false);
        let teamProjectToolkits = [];

        const queryParams = {
          ...JSON.parse(serializedFilters),
        };

        if (selectedProjectId) {
          const { data } = await getToolkits({
            projectId: selectedProjectId,
            page: 0,
            page_size: 500,
            params: queryParams,
          });
          teamProjectToolkits = [
            ...(data?.rows || []).map(item => ({
              ...item,
              id: `${item.id}_${selectedProjectId}`,
              project_id: selectedProjectId,
            })),
          ];
        }
        if (personal_project_id && personal_project_id !== selectedProjectId) {
          const { data } = await getToolkits({
            projectId: personal_project_id,
            page: 0,
            page_size: 500,
            params: queryParams,
          });
          teamProjectToolkits = [
            ...teamProjectToolkits,
            ...(data?.rows || []).map(item => ({
              ...item,
              id: `${item.id}_${personal_project_id}`,
              project_id: personal_project_id,
            })),
          ];
        }

        const uniqueToolkits = teamProjectToolkits.reduce((acc, toolkit) => {
          if (!acc.find(existing => existing.id === toolkit.id)) {
            acc.push(toolkit);
          }
          return acc;
        }, []);

        setHasFetchedData(true);
        setToolkits(uniqueToolkits);
      },
      [getToolkits, personal_project_id, selectedProjectId, serializedFilters],
    );

    useEffect(() => {
      onRefresh();
    }, [onRefresh]);

    const isToolkitPersonal = useCallback(
      t => t.project_id === personal_project_id,
      [personal_project_id],
    );

    const newToolkitOptions = useMemo(
      () =>
        toolkits.map(toolkit => {
          const idStr = getToolkitIdString(toolkit.id);
          return {
            value: idStr,
            label: toolkit.name,
            description: toolkit.type,
            icon: isToolkitPersonal(toolkit) ? (
              <Person sx={{ fontSize: '0.875rem' }} />
            ) : (
              <BriefcaseIcon sx={{ fontSize: '0.875rem' }} />
            ),
          };
        }),
      [isToolkitPersonal, toolkits],
    );

    const optionsWithActions = useMemo(() => {
      const actionOption = {
        value: REFRESH_VALUE,
        label: 'Refresh',
        icon: <RefreshIcon sx={{ fontSize: '1rem' }} />,
        variant: 'action',
        onActivate: onRefresh,
      };
      return [actionOption, ...newToolkitOptions];
    }, [newToolkitOptions, onRefresh]);

    const hasToolkitOptions = useMemo(() => newToolkitOptions.length > 0, [newToolkitOptions]);

    const stringMultiValue = useMemo(
      () => (Array.isArray(value) ? value.map(v => String(v)) : []),
      [value],
    );

    const customRenderSelectValue = useCallback(foundOption => {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {foundOption?.icon}
          <Typography variant="labelMedium">{foundOption?.label}</Typography>
        </Box>
      );
    }, []);

    const handleSingleValueChange = useCallback(
      newVal => {
        onSelectToolkit(newVal === '' || newVal == null ? null : parseInt(newVal, 10));
      },
      [onSelectToolkit],
    );

    const handleMultiValueChange = useCallback(
      newVal => {
        const arr = Array.isArray(newVal) ? newVal : [];
        onSelectToolkit(arr.map(v => parseInt(String(v), 10)));
      },
      [onSelectToolkit],
    );

    const hasStaleSingleValue = useMemo(
      () =>
        value != null &&
        value !== '' &&
        hasFetchedData &&
        !toolkits.some(t => getToolkitIdString(t.id) === String(value)),
      [value, hasFetchedData, toolkits],
    );

    const hasStaleMultiValue = useMemo(() => {
      if (!Array.isArray(value) || !value.length || !hasFetchedData) return false;
      return value.some(
        v => !toolkits.some(t => getToolkitIdString(t.id) === String(v)),
      );
    }, [value, hasFetchedData, toolkits]);

    const { effectiveSingleError, effectiveSingleHelperText } = useMemo(() => {
      if (error && Boolean(helperText)) {
        return { effectiveSingleError: true, effectiveSingleHelperText: helperText };
      }
      if (hasStaleSingleValue) {
        return { effectiveSingleError: true, effectiveSingleHelperText: STALE_TOOLKIT_MESSAGE };
      }
      return { effectiveSingleError: Boolean(error), effectiveSingleHelperText: helperText || '' };
    }, [error, helperText, hasStaleSingleValue]);

    const multiFieldMessage = useMemo(() => {
      if (error && Boolean(helperText)) return helperText;
      if (hasStaleMultiValue) return STALE_TOOLKIT_MESSAGE;
      return '';
    }, [error, helperText, hasStaleMultiValue]);

    const multiLabelNode = useMemo(
      () => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            pr: 0.5,
          }}
        >
          <InputLabel
            id={`${MULTI_SELECT_ID}-label`}
            required={required}
            sx={[
              {
                left: '0.75rem',
                fontSize: '1rem',
                fontWeight: 500,
                position: 'relative',
                transform: 'none',
                '&:not(.MuiInputLabel-shrink)': { top: '0.5rem' },
                ...(required && {
                  '& .MuiInputLabel-asterisk, & .MuiFormLabel-asterisk': { display: 'none' },
                }),
              },
            ]}
            shrink
          >
            {label}
            {required && ' *'}
          </InputLabel>
          <Tooltip
            title="Refresh the toolkits"
            placement="top"
          >
            <Box
              component="span"
              sx={{ display: 'inline-flex' }}
            >
              <IconButton
                type="button"
                variant="elitea"
                color="tertiary"
                onClick={e => onRefresh(e)}
                onMouseDown={e => e.stopPropagation()}
                disabled={disabled}
                size="small"
                aria-label="Refresh toolkits"
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </Tooltip>
        </Box>
      ),
      [disabled, label, onRefresh, required],
    );

    const singleValueForSelect = useMemo(() => {
      if (!hasToolkitOptions) return '';
      if (value == null || value === '') return '';
      return String(value);
    }, [hasToolkitOptions, value]);

    if (multiple) {
      return (
        <>
          <Box sx={sx ? [{ marginTop: '0.5rem' }, sx] : { marginTop: '0.5rem' }}>
            <Select.SingleSelect
              id={MULTI_SELECT_ID}
              showBorder
              disabled={disabled}
              required={required}
              label=""
              labelNode={multiLabelNode}
              value={stringMultiValue}
              options={newToolkitOptions}
              showOptionIcon
              showOptionDescription
              onValueChange={handleMultiValueChange}
              isListFetching={isFetching}
              showEmptyPlaceholder={false}
              multiple
              error={error || hasStaleMultiValue}
            />
            {Boolean(multiFieldMessage) && (
              <FormControl
                error
                fullWidth
                sx={{ marginTop: 0, width: '100%' }}
              >
                <FormHelperText>{multiFieldMessage}</FormHelperText>
              </FormControl>
            )}
          </Box>
        </>
      );
    }

    return (
      <Box sx={sx ? [{ marginTop: '0.5rem' }, sx] : { marginTop: '0.5rem' }}>
        <Select.SingleSelect
          showBorder
          disabled={disabled}
          required={required}
          label={label}
          value={singleValueForSelect}
          options={optionsWithActions}
          showOptionIcon
          showOptionDescription
          onValueChange={handleSingleValueChange}
          customRenderValue={customRenderSelectValue}
          error={effectiveSingleError}
          helperText={effectiveSingleHelperText}
          showEmptyPlaceholder={false}
          isListFetching={isFetching}
          optionTextColumnSx={{ flexDirection: 'row', gap: '1rem', alignItems: 'center' }}
        />
      </Box>
    );
  },
);

ToolkitSelect.displayName = 'ToolkitSelect';

export default ToolkitSelect;
