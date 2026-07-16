import { memo, useCallback, useMemo, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { Box, Divider, TextField, Typography, alpha, useTheme } from '@mui/material';

import { AgentsTab } from '@/[fsd]/features/agent-hub/ui';
import { SkillsTab } from '@/[fsd]/features/skill-hub/ui';
import { BaseTab, BaseTabs } from '@/[fsd]/shared/ui/tabs';
import SkillsIcon from '@/assets/skill-icon.svg?react';
import ApplicationsIcon from '@/components/Icons/ApplicationsIcon';
import SearchIcon from '@/components/Icons/SearchIcon';

const CATALOG_TABS = {
  agents: 'agents',
  skills: 'skills',
};

const SEARCH_PLACEHOLDER = 'Search for agents and skills';

const EliteaCatalog = memo(() => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [agentQuery, setAgentQuery] = useState('');
  const [skillQuery, setSkillQuery] = useState('');
  const theme = useTheme();

  const activeTab = useMemo(() => {
    const tab = searchParams.get('tab');
    return tab === CATALOG_TABS.skills ? CATALOG_TABS.skills : CATALOG_TABS.agents;
  }, [searchParams]);

  const isSkillsTab = activeTab === CATALOG_TABS.skills;

  const handleChangeTab = useCallback(
    (event, nextTab) => {
      if (!nextTab || nextTab === activeTab) return;
      const next = new URLSearchParams(searchParams);
      next.set('tab', nextTab);
      setSearchParams(next, { replace: true });
    },
    [activeTab, searchParams, setSearchParams],
  );

  const handleSearchChange = useCallback(
    event => {
      const value = event?.target?.value || '';
      if (isSkillsTab) {
        setSkillQuery(value);
      } else {
        setAgentQuery(value);
      }
    },
    [isSkillsTab],
  );

  const styles = eliteaCatalogStyles();

  return (
    <Box sx={styles.page}>
      <Box sx={styles.header}>
        <Typography
          variant="headingLarge"
          sx={styles.title}
        >
          Welcome to ELITEA Catalog!
        </Typography>

        <Box sx={styles.searchContainer}>
          <Box sx={styles.searchIconContainer}>
            <SearchIcon fill={theme.palette.text.secondary} />
          </Box>
          <TextField
            placeholder={SEARCH_PLACEHOLDER}
            value={isSkillsTab ? skillQuery : agentQuery}
            onChange={handleSearchChange}
            sx={styles.searchField}
            variant="outlined"
            size="small"
          />
        </Box>

        <BaseTabs
          value={activeTab}
          onChange={handleChangeTab}
          sx={styles.tabs}
        >
          <BaseTab
            value={CATALOG_TABS.agents}
            label="Agents"
            icon={<ApplicationsIcon />}
          />
          <BaseTab
            value={CATALOG_TABS.skills}
            label="Skills"
            icon={<SkillsIcon />}
          />
        </BaseTabs>
      </Box>

      <Divider sx={styles.divider} />

      <Box sx={styles.body}>
        {isSkillsTab ? <SkillsTab query={skillQuery} /> : <AgentsTab query={agentQuery} />}
      </Box>
    </Box>
  );
});

EliteaCatalog.displayName = 'EliteaCatalog';

/** @type {MuiSx} */
const eliteaCatalogStyles = () => ({
  page: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    boxSizing: 'border-box',
    backgroundColor: palette.background.tabPanel,
  }),
  header: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '1.5rem 1.5rem 1.25rem 1.5rem',
    // Soft brand glow centered behind the title, matching the design's header.
    background: `radial-gradient(40rem 12rem at 50% -3rem, ${alpha(palette.primary.main, 0.12)}, transparent 70%)`,
  }),
  title: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  searchContainer: {
    width: '40rem',
    maxWidth: '100%',
    position: 'relative',
  },
  searchIconContainer: {
    position: 'absolute',
    left: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
    '& svg': {
      width: '1rem',
      height: '1rem',
    },
  },
  searchField: ({ palette, typography }) => ({
    width: '100%',
    '& .MuiOutlinedInput-root': {
      ...typography.bodyMedium,
      backgroundColor: palette.background.userInputBackground,
      border: `0.0625rem solid ${palette.border.lines}`,
      borderRadius: '1.75rem',
      height: '2.25rem',
      transition: 'border 0.3s ease, background-color 0.3s ease',
      '&:hover': {
        borderColor: palette.border.hover,
      },
      '&.Mui-focused': {
        border: `0.0625rem solid ${palette.border.flowNode}`,
        backgroundColor: palette.background.userInputBackgroundActive,
      },
      '& fieldset': {
        border: 'none',
      },
      '&:hover fieldset': {
        border: 'none',
      },
      '&.Mui-focused fieldset': {
        border: 'none',
      },
    },
    '& .MuiInputBase-input': {
      padding: '0.375rem 0.75rem',
      paddingLeft: '2.5rem',
      ...typography.bodyMedium,
      color: palette.text.secondary,
      '&::placeholder': {
        color: palette.text.disabled,
        opacity: 1,
      },
    },
  }),
  tabs: {
    minHeight: '2rem',
  },
  divider: ({ palette }) => ({
    borderColor: palette.border.table,
  }),
  body: {
    flex: 1,
    minHeight: 0,
  },
});

export default EliteaCatalog;
