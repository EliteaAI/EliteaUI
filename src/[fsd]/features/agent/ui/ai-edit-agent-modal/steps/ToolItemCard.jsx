import { memo, useCallback, useMemo } from 'react';

import { Box, IconButton, Tooltip, Typography, useTheme } from '@mui/material';

import OpenNewIcon from '@/assets/open-new-icon.svg?react';
import { SearchParams } from '@/common/constants';
import { getToolIconByType } from '@/common/toolkitUtils';
import EntityIcon from '@/components/EntityIcon';
import { getBasename } from '@/routes';

const ENTITY_TYPE_LABELS = {
  toolkit: 'Toolkit',
  mcp: 'MCP',
  agent: 'Agent',
  pipeline: 'Pipeline',
  skill: 'Skill',
};

const ToolItemCard = memo(props => {
  const { item, entityType } = props;
  const theme = useTheme();

  const icon = useMemo(() => {
    if (entityType === 'toolkit' && item.type) return { component: getToolIconByType(item.type, theme) };

    return null;
  }, [entityType, item.type, theme]);

  const secondaryText = entityType === 'toolkit' ? item.type : item.description;
  const showSecondary = secondaryText && secondaryText !== item.name;
  const resolvedEntityType = entityType === 'toolkit' ? undefined : entityType;
  const typeLabel = ENTITY_TYPE_LABELS[entityType] || entityType;
  const openTooltipText = `Open ${typeLabel.toLowerCase()} in new tab`;

  const isDisabled = item.type === 'application' ? !item.settings?.application_id : !item.id;

  const handleOpenClick = useCallback(
    e => {
      e.stopPropagation();
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const basename = getBasename();
      const viewMode = new URLSearchParams(window.location.search).get(SearchParams.ViewMode);
      const nameParam = encodeURIComponent(item.name);

      if (item.type === 'application') {
        const entityId = item.settings?.application_id;
        const versionId = item.settings?.application_version_id;
        const route = item.agent_type === 'pipeline' ? 'pipelines' : 'agents';
        if (!entityId) return;
        let url = `${baseUrl}${basename}/${route}/all/${entityId}`;
        if (versionId) url += `/${versionId}`;
        url += `?${SearchParams.ViewMode}=${viewMode}&name=${nameParam}`;
        window.open(url, '_blank');
      } else {
        const routeMap = {
          toolkit: 'toolkits',
          mcp: 'mcps',
          agent: 'agents',
          pipeline: 'pipelines',
          skill: 'skills',
        };
        const route = routeMap[entityType] || 'agents';
        const url = `${baseUrl}${basename}/${route}/all/${item.id}?${SearchParams.ViewMode}=${viewMode}&name=${nameParam}`;
        window.open(url, '_blank');
      }
    },
    [entityType, item],
  );

  return (
    <Box sx={styles.card}>
      <EntityIcon
        icon={icon}
        entityType={resolvedEntityType}
        specifiedFontSize="1rem"
      />
      <Box sx={styles.cardContent}>
        <Typography
          sx={styles.itemName}
          noWrap
        >
          {item.name}
        </Typography>
        {showSecondary && (
          <Typography
            sx={styles.secondaryText}
            noWrap
          >
            {secondaryText}
          </Typography>
        )}
      </Box>

      <Tooltip
        title={openTooltipText}
        placement="top"
      >
        <IconButton
          className="open-link-btn"
          variant="elitea"
          color="tertiary"
          size="small"
          onClick={handleOpenClick}
          disabled={isDisabled}
          sx={styles.openLinkBtn}
        >
          <OpenNewIcon
            sx={styles.openLinkIcon}
            fill={!isDisabled ? theme.palette.icon.fill.default : theme.palette.icon.fill.disabled}
          />
        </IconButton>
      </Tooltip>

      <Box sx={styles.typeBadge}>
        <Typography sx={styles.typeBadgeText}>{typeLabel}</Typography>
      </Box>
    </Box>
  );
});

ToolItemCard.displayName = 'ToolItemCard';

/** @type {MuiSx} */
const styles = {
  card: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flex: 1,
    minWidth: 0,
    height: '3.75rem',
    padding: '0.5rem 1rem',
    borderRadius: '0.75rem',
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid ${palette.border.lines}`,
    '& .open-link-btn': {
      opacity: 0,
      transition: 'opacity 0.15s ease',
    },
    '&:hover .open-link-btn': {
      opacity: 1,
    },
  }),
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minWidth: 0,
    flex: 1,
    height: '2.75rem',
  },
  itemName: {
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
    color: 'text.secondary',
  },
  secondaryText: {
    fontSize: '0.75rem',
    lineHeight: '1.25rem',
    color: 'text.primary',
  },
  openLinkBtn: {
    flexShrink: 0,
  },
  openLinkIcon: {
    fontSize: '1rem',
  },
  typeBadge: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '0.125rem 0.5rem',
    borderRadius: '0.875rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    flexShrink: 0,
  }),
  typeBadgeText: {
    fontSize: '0.75rem',
    lineHeight: '1rem',
    color: 'text.primary',
    whiteSpace: 'nowrap',
  },
};

export default ToolItemCard;
