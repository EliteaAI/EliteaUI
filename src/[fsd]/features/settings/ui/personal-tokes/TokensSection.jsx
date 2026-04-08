import { memo, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { Box } from '@mui/material';

import { TokensTable } from '@/[fsd]/features/settings/ui/personal-tokes';
import { useTokenListQuery } from '@/api/auth';

const TokensSection = memo(props => {
  const { search, showDownload, onIdeSettingsDownload, onPreviewSettings } = props;
  const styles = tokensSectionStyles();
  const user = useSelector(state => state.user);

  // Get tokens data for filtering
  const { data: tokens = [] } = useTokenListQuery({ skip: !user.personal_project_id });

  // Filter tokens based on search
  const filteredTokens = useMemo(() => {
    if (!search) return tokens;
    return tokens.filter(token => token.name.toLowerCase().includes(search.toLowerCase()));
  }, [tokens, search]);

  return (
    <Box sx={styles.container}>
      <Box sx={styles.tableWrapper}>
        <TokensTable
          showDownload={showDownload}
          onIdeSettingsDownload={onIdeSettingsDownload}
          onPreviewSettings={onPreviewSettings}
          filteredTokens={filteredTokens}
          search={search}
        />
      </Box>
    </Box>
  );
});

TokensSection.displayName = 'TokensSection';

/** @type {MuiSx} */
const tokensSectionStyles = () => ({
  container: {
    width: '100%',
    minWidth: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  tableWrapper: {
    flex: 1,
    minHeight: 0,
  },
});

export default TokensSection;
