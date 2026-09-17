import { memo, useCallback, useMemo, useState } from 'react';

import { Typography, useTheme } from '@mui/material';
import { Box } from '@mui/system';

import AutoCompleteDropDown from '@/ComponentsLib/AutoCompleteDropDown';
import { ChatParticipantType } from '@/common/constants';
import { EntityTypeIcon } from '@/components/EntityIcon';
import SearchIcon from '@/components/Icons/SearchIcon';
import useParticipants from '@/hooks/chat/useParticipants';

const filterOptionsIdentity = options => options;

const AiParticipantSearchSelect = memo(props => {
  const {
    selectedParticipants,
    onChangeParticipants,
    disabled,
    slotProps = { listBox: {} },
    ...restProps
  } = props;

  const theme = useTheme();
  const [query, setQuery] = useState('');

  const { participants, isFetching } = useParticipants({
    sortBy: 'name',
    sortOrder: 'asc',
    query,
    pageSize: 50,
    types: [ChatParticipantType.Applications],
  });

  const selectedIds = useMemo(() => new Set(selectedParticipants.map(p => p.id)), [selectedParticipants]);

  const optionList = useMemo(() => {
    const fromApi = participants
      .filter(p => !selectedIds.has(p.id))
      .map(p => ({
        id: p.id,
        name: p.name || '',
        project_id: p.project_id,
        entity_name:
          p.agent_type === 'pipeline' ? ChatParticipantType.Pipelines : ChatParticipantType.Applications,
      }));
    // Always include currently selected items so AutoCompleteDropDown's internal
    // validation (canInputNewValues=false) doesn't strip them on chip removal.
    return [...selectedParticipants, ...fromApi];
  }, [participants, selectedIds, selectedParticipants]);

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

  const renderChipLabel = useCallback(option => {
    return (
      <Box
        height="100%"
        display="flex"
        alignItems="center"
        flexDirection="row"
        gap="0.25rem"
      >
        <EntityTypeIcon
          type={option.entity_name}
          specifiedFontSize="0.75rem"
        />
        <Typography
          variant="bodySmall"
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
      renderChipLabel={renderChipLabel}
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
            fill={theme.palette.icon.default}
          />
        ),
      }}
      {...restProps}
    />
  );
});

AiParticipantSearchSelect.displayName = 'AiParticipantSearchSelect';

export default AiParticipantSearchSelect;
