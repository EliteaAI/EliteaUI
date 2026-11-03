import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { useGetMcpExposedVersionsQuery } from '@/[fsd]/features/project-governance/api/projectGovernanceApi';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { useGetPlatformSettingsQuery } from '@/api/platformSettings';

const MAX_SHOWN = 8;
const RULE_TEXT = {
  bound: 'its approved identity',
  published: 'latest published',
  stored: 'first version',
};

// Which version of each agent external MCP clients reach through this project's MCP server (C-1009, #7341), while
// credential governance is enforced: the version with an approved identity, else the latest published one, else the
// first. Under off and audit only nothing is shown or read (the first version is reached, as before).
const McpExposedVersions = memo(() => {
  const projectId = useSelectedProjectId();
  const styles = mcpExposedVersionsStyles();
  const { data: platformSettings } = useGetPlatformSettingsQuery();
  const enforced = Boolean(platformSettings?.governance_enforced);
  const { data } = useGetMcpExposedVersionsQuery({ projectId }, { skip: !projectId || !enforced });
  const rows = data?.rows ?? [];

  if (!enforced || !rows.length) return null;

  return (
    <Box
      sx={styles.root}
      data-testid="mcp-exposed-versions"
    >
      <Typography
        variant="labelSmall"
        color="text.secondary"
      >
        External MCP clients reach
      </Typography>
      {rows.slice(0, MAX_SHOWN).map(row => (
        <Typography
          key={row.application_id}
          variant="bodySmall"
          color="text.secondary"
          sx={styles.row}
          data-testid={`mcp-exposed-version-${row.application_id}`}
        >
          {`${row.application_name} — ${row.version_name} (${RULE_TEXT[row.rule] ?? row.rule})`}
        </Typography>
      ))}
      {rows.length > MAX_SHOWN && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          {`and ${rows.length - MAX_SHOWN} more`}
        </Typography>
      )}
    </Box>
  );
});

McpExposedVersions.displayName = 'McpExposedVersions';

/** @type {MuiSx} */
const mcpExposedVersionsStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    marginBottom: '1rem',
  },
  row: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

export default McpExposedVersions;
