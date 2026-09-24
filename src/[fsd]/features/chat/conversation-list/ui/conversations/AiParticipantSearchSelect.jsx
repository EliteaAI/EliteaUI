import { memo, useCallback, useMemo, useState } from 'react';

import { Typography, useTheme } from '@mui/material';
import { Box } from '@mui/system';

import AutoCompleteDropDown from '@/ComponentsLib/AutoCompleteDropDown';
import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';
import { EntityTypeIcon } from '@/components/EntityIcon';
import SearchIcon from '@/components/Icons/SearchIcon';
import useParticipants from '@/hooks/chat/useParticipants';

import { makeRenderOptionBody, participantRenderBaseStyles } from './participantRender.helpers';

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
  const styles = useMemo(() => aiParticipantSearchSelectStyles(), []);
  const [query, setQuery] = useState('');

  const { participants, isFetching } = useParticipants({
    sortBy: 'name',
    sortOrder: 'asc',
    query,
    pageSize: 50,
    types: [ChatParticipantType.Applications],
  });

  const getEntityName = useCallback(
    p => (p.agent_type === 'pipeline' ? ChatParticipantType.Pipelines : ChatParticipantType.Applications),
    [],
  );

  const getUniqueKey = useCallback(
    p => `${p.entity_name ?? getEntityName(p)}:${p.project_id}:${p.id}`,
    [getEntityName],
  );

  const enrichedSelectedParticipants = useMemo(
    () => selectedParticipants.map(p => ({ ...p, uniqueKey: getUniqueKey(p) })),
    [selectedParticipants, getUniqueKey],
  );

  const selectedUniqueKeys = useMemo(
    () => new Set(enrichedSelectedParticipants.map(p => p.uniqueKey)),
    [enrichedSelectedParticipants],
  );

  const optionList = useMemo(() => {
    const fromApi = participants
      .filter(p => !selectedUniqueKeys.has(`${getEntityName(p)}:${p.project_id}:${p.id}`))
      .map(p => {
        const entity_name = getEntityName(p);
        return {
          id: p.id,
          name: p.name || '',
          project_id: p.project_id,
          entity_name,
          agent_type: p.agent_type,
          uniqueKey: `${entity_name}:${p.project_id}:${p.id}`,
        };
      });
    // Always include currently selected items so AutoCompleteDropDown's internal
    // validation (canInputNewValues=false) doesn't strip them on chip removal.
    return [...enrichedSelectedParticipants, ...fromApi];
  }, [participants, selectedUniqueKeys, enrichedSelectedParticipants, getEntityName]);

  const handleInputChange = useCallback((_event, newInputValue) => {
    setQuery(newInputValue);
  }, []);

  const renderBaseOptionBody = useMemo(() => makeRenderOptionBody(styles), [styles]);

  const renderOptionBody = useCallback(
    option => {
      const isPublic = option.project_id === PUBLIC_PROJECT_ID;
      return (
        <>
          {renderBaseOptionBody(option)}
          {isPublic && (
            <Box sx={styles.publicBadge}>
              <Typography
                variant="bodySmall"
                sx={styles.publicBadgeText}
              >
                Public
              </Typography>
            </Box>
          )}
        </>
      );
    },
    [renderBaseOptionBody, styles],
  );

  const renderChipLabel = useCallback(
    option => {
      const isPublic = option.project_id === PUBLIC_PROJECT_ID;
      return (
        <Box sx={styles.chipLabel}>
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
          {isPublic && (
            <Box sx={styles.chipPublicBadge}>
              <Typography
                variant="bodySmall"
                sx={styles.chipPublicText}
              >
                Public
              </Typography>
            </Box>
          )}
        </Box>
      );
    },
    [styles],
  );

  return (
    <AutoCompleteDropDown
      optionList={optionList}
      selectedOptions={enrichedSelectedParticipants}
      onChangedSelectedOptions={onChangeParticipants}
      idField="uniqueKey"
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

/** @type {MuiSx} */
const aiParticipantSearchSelectStyles = () => ({
  ...participantRenderBaseStyles,
  publicBadge: ({ palette }) => ({
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0.125rem 0.375rem',
    height: '1.25rem',
    borderRadius: '0.875rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    flexShrink: 0,
    marginRight: '1rem',
    'li[aria-selected="true"] &': {
      border: `0.0625rem solid ${palette.border.hover}`,
    },
  }),
  publicBadgeText: {
    color: ({ palette }) => palette.text.metrics,
  },
  chipLabel: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    gap: '0.25rem',
  },
  chipPublicBadge: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0.125rem 0.375rem',
    height: '1.25rem',
    borderRadius: '0.875rem',
    border: ({ palette }) => `0.0625rem solid ${palette.border.lines}`,
    flexShrink: 0,
  },
  chipPublicText: {
    color: ({ palette }) => palette.text.metrics,
  },
});

export default AiParticipantSearchSelect;
