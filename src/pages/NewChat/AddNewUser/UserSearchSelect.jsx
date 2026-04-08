import { useCallback } from 'react';

import { Typography } from '@mui/material';
import { Box } from '@mui/system';

import AutoCompleteDropDown from '@/ComponentsLib/AutoCompleteDropDown';
import SearchIcon from '@/components/Icons/SearchIcon';
import UserAvatar from '@/components/UserAvatar';
import { useTheme } from '@emotion/react';

export default function UserSearchSelect({
  userList,
  selectedUsers,
  onChangeUsers,
  disabled,
  slotProps = {
    listBox: {},
  },
  ...props
}) {
  const theme = useTheme();
  const renderOptionBody = useCallback(option => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <UserAvatar
          name={option.name}
          avatar={option.avatar}
          size={22}
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
      optionList={userList.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())) || []}
      selectedOptions={selectedUsers}
      onChangedSelectedOptions={onChangeUsers}
      disabled={disabled}
      label=""
      placeholder={'Search users...'}
      nameField="name"
      avatarField="avatar"
      canInputNewValues={false}
      useInitialValue={false}
      ignoreCase={false}
      renderOptionBody={renderOptionBody}
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
      {...props}
    />
  );
}
