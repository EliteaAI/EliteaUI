import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import BaseCheckbox from '@/[fsd]/shared/ui/checkbox/BaseCheckbox';
import { getToolIconByType } from '@/common/toolkitUtils';
import EntityIcon from '@/components/EntityIcon';
import { useTheme } from '@emotion/react';

const SuggestionItem = memo(props => {
  const { item, checked, onToggle, entityType } = props;
  const theme = useTheme();

  const icon = useMemo(() => {
    if (entityType === 'toolkit' && item.type) return { component: getToolIconByType(item.type, theme) };

    return null;
  }, [entityType, item.type, theme]);

  const secondaryText = entityType === 'toolkit' ? item.type : item.description;
  const showSecondary = secondaryText && secondaryText !== item.name;

  const entityTypeMap = { toolkit: undefined, skill: 'skill' };
  const resolvedEntityType = entityTypeMap[entityType] ?? 'agent';

  return (
    <Box
      sx={styles.item}
      onClick={() => onToggle(item.id)}
    >
      <BaseCheckbox
        size="small"
        checked={checked}
        onChange={() => onToggle(item.id)}
        onClick={e => e.stopPropagation()}
        sx={styles.checkbox}
      />
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
      </Box>
    </Box>
  );
});

SuggestionItem.displayName = 'SuggestionItem';

/** @type {MuiSx} */
const styles = {
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    cursor: 'pointer',
  },
  checkbox: {
    padding: '0.25rem',
    flexShrink: 0,
  },
  card: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flex: 1,
    minWidth: 0,
    padding: '0.5rem 1rem',
    borderRadius: '0.75rem',
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minWidth: 0,
    flex: 1,
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
};

export default SuggestionItem;
