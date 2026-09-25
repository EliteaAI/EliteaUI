import { memo, useCallback, useMemo, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { Box, Divider, Typography, alpha } from '@mui/material';

import { AgentsTab } from '@/[fsd]/features/agent-hub/ui';
import { SkillsTab } from '@/[fsd]/features/skill-hub/ui';
import { Input } from '@/[fsd]/shared/ui';
import { BaseTab, BaseTabs } from '@/[fsd]/shared/ui/tabs';
import SkillsIcon from '@/assets/skill-icon.svg?react';
import ApplicationsIcon from '@/components/Icons/ApplicationsIcon';

const CATALOG_TABS = {
  agents: 'agents',
  skills: 'skills',
};

const SEARCH_PLACEHOLDERS = {
  [CATALOG_TABS.agents]: 'Search for agents',
  [CATALOG_TABS.skills]: 'Search for skills',
};

const EliteaCatalog = memo(() => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [agentQuery, setAgentQuery] = useState('');
  const [skillQuery, setSkillQuery] = useState('');
  const [totalAgents, setTotalAgents] = useState(0);
  const [totalSkills, setTotalSkills] = useState(0);
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
    value => {
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
          data-testid="catalog-page-heading"
        >
          Welcome to ELITEA Catalog!
        </Typography>

        <Box sx={styles.searchContainer}>
          <Input.SimpleSearchBar
            placeholder={SEARCH_PLACEHOLDERS[activeTab]}
            searchQuery={isSkillsTab ? skillQuery : agentQuery}
            onSearchChange={handleSearchChange}
            sx={styles.searchField}
            autoFocus={false}
            data-testid="catalog-search-input"
          />
        </Box>

        <BaseTabs
          value={activeTab}
          onChange={handleChangeTab}
          sx={styles.tabs}
        >
          <BaseTab
            data-testid="catalog-agents-tab"
            value={CATALOG_TABS.agents}
            label={totalAgents > 0 ? `Agents (${totalAgents})` : 'Agents'}
            icon={<ApplicationsIcon />}
          />
          <BaseTab
            data-testid="catalog-skills-tab"
            value={CATALOG_TABS.skills}
            label={totalSkills > 0 ? `Skills (${totalSkills})` : 'Skills'}
            icon={<SkillsIcon />}
          />
        </BaseTabs>
      </Box>

      <Divider sx={styles.divider} />

      <Box sx={styles.body}>
        {isSkillsTab ? (
          <SkillsTab
            query={skillQuery}
            onTotalCountChange={setTotalSkills}
          />
        ) : (
          <AgentsTab
            query={agentQuery}
            onTotalCountChange={setTotalAgents}
          />
        )}
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
    backgroundColor: palette.background.default.tertiary,
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
  },
  searchField: {
    width: '100%',
  },
  tabs: {
    minHeight: '2rem',
  },
  divider: ({ palette }) => ({
    borderColor: palette.border.default,
  }),
  body: {
    flex: 1,
    minHeight: 0,
  },
});

export default EliteaCatalog;
