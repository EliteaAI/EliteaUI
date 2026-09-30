import { memo, useCallback, useMemo } from 'react';

import { Typography, useTheme } from '@mui/material';
import { Box } from '@mui/system';

import AutoCompleteDropDown from '@/ComponentsLib/AutoCompleteDropDown';
import SearchIcon from '@/components/Icons/SearchIcon';
import UserAvatar from '@/components/UserAvatar';

const UserSearchSelect = memo(props => {
  const {
    userList,
    selectedUsers,
    onChangeUsers,
    disabled,
    slotProps = { listBox: {} },
    ...restProps
  } = props;
  const styles = useMemo(() => userSearchSelectStyles(), []);

  const theme = useTheme();
  const renderOptionBody = useCallback(
    option => {
      return (
        <Box sx={styles.option}>
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
    },
    [styles],
  );
  return (
    <AutoCompleteDropDown
      optionList={
        userList.sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase())) ||
        []
      }
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
            fill={theme.palette.icon.default}
          />
        ),
      }}
      {...restProps}
    />
  );
});

UserSearchSelect.displayName = 'UserSearchSelect';

/** @type {MuiSx} */
const userSearchSelectStyles = () => ({
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
});

export default UserSearchSelect;
