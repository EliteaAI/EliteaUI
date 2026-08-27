import { useCallback, useMemo, useState } from 'react';

export const useVersionSelectSearch = options => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const q = searchQuery.toLowerCase();
    return options.filter(opt => opt.searchText?.includes(q));
  }, [options, searchQuery]);

  const handleSearch = useCallback(q => setSearchQuery(q), []);

  return { searchQuery, filteredOptions, handleSearch };
};
