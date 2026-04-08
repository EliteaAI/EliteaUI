import { memo } from 'react';

import { Box, Input, InputAdornment } from '@mui/material';

import { typographyVariants } from '@/MainTheme';
import SearchIcon from '@/components/Icons/SearchIcon.jsx';

const SearchInput = memo(({ search, onChangeSearch, sx, placeholder = 'Search' }) => {
  const styles = getStyles();

  return (
    <Box sx={[styles.container, sx]}>
      <Input
        sx={styles.searchInput}
        disableUnderline
        variant="standard"
        placeholder={placeholder}
        value={search}
        onChange={onChangeSearch}
        startAdornment={
          <InputAdornment
            sx={styles.inputAdornment}
            position="start"
          >
            <SearchIcon sx={styles.searchIcon} />
          </InputAdornment>
        }
      />
    </Box>
  );
});

SearchInput.displayName = 'StyledSearchInput';

/** @type {MuiSx} */
const getStyles = () => ({
  container: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '0.5rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    padding: '0.25rem 0.75rem',
  }),
  searchInput: {
    width: '20.3125rem',
    ...typographyVariants.bodyMedium,
  },
  inputAdornment: {
    width: '1rem',
    height: '1rem',
    fill: 'white',
  },
  searchIcon: {
    fill: 'white',
  },
});

export default SearchInput;
