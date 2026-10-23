import { memo, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { ToolGroupConstants } from '@/[fsd]/features/toolkits/lib/constants';
import { useToolkitToolOptions } from '@/[fsd]/features/toolkits/lib/hooks';
import { Button, Input } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

const { UNCLASSIFIED_GROUP, TOOL_GROUP_ORDER, KNOWN_GROUPS } = ToolGroupConstants;

const ToolkitTestEmptyState = memo(props => {
  const { toolkitId, onChangeTool, toolGroups, sx = {} } = props;
  const { allToolsOptions } = useToolkitToolOptions({ toolkitId });
  const [searchTerm, setSearchTerm] = useState('');
  const styles = toolkitTestEmptyStateStyles();

  const hasGroups = toolGroups && Object.keys(toolGroups).length > 0;

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return allToolsOptions;
    const lower = searchTerm.toLowerCase();
    return allToolsOptions.filter(opt => opt.label?.toLowerCase().includes(lower));
  }, [allToolsOptions, searchTerm]);

  const groupedOptions = useMemo(() => {
    if (!hasGroups) {
      return [{ groupKey: null, groupLabel: null, tools: filteredOptions }];
    }

    return TOOL_GROUP_ORDER.map(group => {
      const tools = filteredOptions
        .filter(opt =>
          group.key === UNCLASSIFIED_GROUP
            ? !KNOWN_GROUPS.has(toolGroups[opt.value])
            : toolGroups[opt.value] === group.key,
        )
        .sort((a, b) => (a.label || '').toLowerCase().localeCompare((b.label || '').toLowerCase()));
      return { groupKey: group.key, groupLabel: group.label, tools };
    }).filter(g => g.tools.length > 0);
  }, [hasGroups, filteredOptions, toolGroups]);

  const noResults = filteredOptions.length === 0 && searchTerm.trim().length > 0;

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

      {noResults ? (
        <Typography
          variant="bodySmall"
          color="text.secondary"
          data-testid="toolkit-test-start-no-results"
        >
          No tools match &quot;{searchTerm.trim()}&quot;.
        </Typography>
      ) : (
        <Box sx={styles.groupsContainer}>
          {groupedOptions.map(({ groupKey, groupLabel, tools }) => (
            <Box
              key={groupKey ?? '__ungrouped__'}
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
                  return (
                    <Button.BaseBtn
                      key={toolKey}
                      variant={BUTTON_VARIANTS.secondary}
                      sx={styles.chip}
                      onClick={() => onChangeTool(opt.value)}
                      data-testid="toolkit-test-start-tool-chip"
                    >
                      {opt.label}
                    </Button.BaseBtn>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>
      )}
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
  chip: ({ palette }) => ({
    justifyContent: 'flex-start',
    padding: '0.25rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.components.chip.background.default,
    color: palette.components.chip.text.default,
    '&:hover': {
      backgroundColor: palette.background.interactiveItem.hover,
    },
  }),
});
