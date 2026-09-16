import { memo, useCallback, useMemo, useState } from 'react';

import { Typography, useTheme } from '@mui/material';
import { Box } from '@mui/system';

import AutoCompleteDropDown from '@/ComponentsLib/AutoCompleteDropDown';
import { useApplicationListQuery } from '@/api/applications';
import { ChatParticipantType } from '@/common/constants';
import { EntityTypeIcon } from '@/components/EntityIcon';
import SearchIcon from '@/components/Icons/SearchIcon';

const filterOptionsIdentity = options => options;

const ParticipantSearchSelect = memo(props => {
  const {
    selectedParticipants,
    onChangeParticipants,
    projectId,
    disabled,
    slotProps = { listBox: {} },
    ...restProps
  } = props;

  const theme = useTheme();
  const [query, setQuery] = useState('');

  const { data: applicationsData, isFetching } = useApplicationListQuery(
    {
      projectId,
      page: 0,
      pageSize: 50,
      params: {
        sort_by: 'name',
        sort_order: 'asc',
        query,
      },
    },
    { skip: !projectId },
  );

  const selectedIds = useMemo(() => new Set(selectedParticipants.map(p => p.id)), [selectedParticipants]);

  const optionList = useMemo(() => {
    const rows = applicationsData?.rows ?? [];
    const fromApi = rows
      .filter(app => !selectedIds.has(app.id))
      .map(app => ({
        id: app.id,
        name: app.name || '',
        project_id: app.project_id,
        entity_name: ChatParticipantType.Applications,
      }));
    // Always include currently selected items so AutoCompleteDropDown's internal
    // validation (canInputNewValues=false) doesn't strip them on chip removal.
    return [...selectedParticipants, ...fromApi];
  }, [applicationsData, selectedIds, selectedParticipants]);

  const handleInputChange = useCallback((_event, newInputValue) => {
    setQuery(newInputValue);
  }, []);

  const renderOptionBody = useCallback(option => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <EntityTypeIcon
          type={option.entity_name}
          specifiedFontSize="1rem"
        />
        <Typography
          variant="bodyMedium"
          color="text.secondary"
        >
          {option.name}
        </Typography>
      </Box>
    );
  }, []);

  return (
    <AutoCompleteDropDown
      optionList={optionList}
      selectedOptions={selectedParticipants}
      onChangedSelectedOptions={onChangeParticipants}
      disabled={disabled || isFetching}
      label=""
      placeholder="Search AI participants..."
      nameField="name"
      canInputNewValues={false}
      useInitialValue={false}
      ignoreCase={false}
      renderOptionBody={renderOptionBody}
      filterOptions={filterOptionsIdentity}
      onInputChange={handleInputChange}
      slotProps={{
        listbox: slotProps.listBox,
      }}
      showSearchIcon
      slots={{
        SearchIcon: (
          <SearchIcon
            width={16}
            height={16}
            fill={theme.palette.icon.fill.default}
          />
        ),
      }}
      {...restProps}
    />
  );
});

ParticipantSearchSelect.displayName = 'ParticipantSearchSelect';

export default ParticipantSearchSelect;
