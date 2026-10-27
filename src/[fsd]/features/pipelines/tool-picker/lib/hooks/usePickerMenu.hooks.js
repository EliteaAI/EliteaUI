import { useCallback, useState } from 'react';

import { PICKER_SEARCH_DEBOUNCE } from '@/[fsd]/features/pipelines/tool-picker/lib/constants/toolPicker.constants';
import { useDebounceValue } from '@/[fsd]/shared/lib/hooks';

/** Open state and search of a picker menu. Lists load only once the menu was opened. */
export const usePickerMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [hasOpened, setHasOpened] = useState(false);
  const [search, setSearch] = useState('');
  const query = useDebounceValue(search, PICKER_SEARCH_DEBOUNCE);

  const openMenu = useCallback(element => {
    setAnchorEl(element);
    setHasOpened(true);
  }, []);

  const closeMenu = useCallback(() => {
    setAnchorEl(null);
    setSearch('');
  }, []);

  return {
    anchorEl,
    isOpen: Boolean(anchorEl),
    hasOpened,
    search,
    setSearch,
    query: query.trim(),
    openMenu,
    closeMenu,
  };
};
