import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { useToolkitToolOptions } from '@/[fsd]/features/toolkits/lib/hooks';
import { Input } from '@/[fsd]/shared/ui';

const ToolkitTestEmptyState = memo(props => {
  const { toolkitId, onChangeTool, toolGroups, sx = {} } = props;
  const { allToolsOptions } = useToolkitToolOptions({ toolkitId });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTool, setSelectedTool] = useState(null);
  const styles = toolkitTestEmptyStateStyles();

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return allToolsOptions;
    const lower = searchTerm.toLowerCase();
    return allToolsOptions.filter(opt => opt.label?.toLowerCase().includes(lower));
  }, [allToolsOptions, searchTerm]);

  const groupedOptions = useMemo(() => {
    if (!toolGroups || Object.keys(toolGroups).length === 0) {
      return [{ groupLabel: null, tools: filteredOptions }];
    }

    const grouped = {};
    const ungrouped = [];

    filteredOptions.forEach(opt => {
      const toolValue = typeof opt.value === 'string' ? opt.value : (opt.value?.name ?? '');
      const groupKey = Object.entries(toolGroups).find(([, tools]) => tools.includes(toolValue))?.[0];
      if (groupKey) {
        grouped[groupKey] = grouped[groupKey] ?? [];
        grouped[groupKey].push(opt);
      } else {
        ungrouped.push(opt);
      }
    });

    const result = Object.entries(grouped).map(([groupLabel, tools]) => ({ groupLabel, tools }));
    if (ungrouped.length) result.push({ groupLabel: null, tools: ungrouped });
    return result;
  }, [filteredOptions, toolGroups]);

  const handleSelectTool = useCallback(
    opt => {
      setSelectedTool(opt.value);
      onChangeTool(opt.value);
    },
    [onChangeTool],
  );

  return (
    <Box sx={[styles.root, sx]}>
      <Typography
        variant="bodyMedium"
        color="text.secondary"
        sx={styles.hint}
      >
        Pick a tool to configure its parameters and run a test.
      </Typography>

      <Input.SimpleSearchBar
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchClear={() => setSearchTerm('')}
        placeholder="Search tools..."
        sx={styles.searchBar}
        data-testid="toolkit-test-start-search"
      />

      <Box sx={styles.groupsContainer}>
        {groupedOptions.map(({ groupLabel, tools }) => (
          <Box
            key={groupLabel ?? '__ungrouped__'}
            sx={styles.group}
          >
            {groupLabel && (
              <Typography
                variant="labelSmall"
                sx={styles.groupLabel}
              >
                {groupLabel}
              </Typography>
            )}
            <Box sx={styles.chipsGrid}>
              {tools.map(opt => {
                const toolKey = typeof opt.value === 'string' ? opt.value : opt.value?.name;
                const isSelected = selectedTool === opt.value;
                return (
                  <Box
                    key={toolKey}
                    sx={styles.chip(isSelected)}
                    onClick={() => handleSelectTool(opt)}
                    data-testid="toolkit-test-start-tool-chip"
                  >
                    <Typography variant="bodyMedium">{opt.label}</Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
});

ToolkitTestEmptyState.displayName = 'ToolkitTestEmptyState';

export default ToolkitTestEmptyState;

/** @type {MuiSx} */
const toolkitTestEmptyStateStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '1rem',
    padding: '1rem 2rem',
    overflowY: 'auto',
  },
  hint: {
    textAlign: 'center',
  },
  searchBar: {
    flexShrink: 0,
  },
  groupsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  groupLabel: ({ palette }) => ({
    color: palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.045rem',
  }),
  chipsGrid: ({ breakpoints }) => ({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
    [breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr',
    },
  }),
  chip:
    isSelected =>
    ({ palette }) => ({
      display: 'flex',
      alignItems: 'center',
      padding: '0.25rem 1rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      backgroundColor: isSelected
        ? (palette.background.toolSelected ?? 'rgba(106,232,250,0.2)')
        : (palette.background.surface?.interactive?.default ?? 'rgba(255,255,255,0.05)'),
      '&:hover': {
        backgroundColor: isSelected
          ? (palette.background.toolSelected ?? 'rgba(106,232,250,0.2)')
          : (palette.background.surface?.interactive?.hover ?? 'rgba(255,255,255,0.08)'),
      },
    }),
});
