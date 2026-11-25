// One module row of the chat concept: icon, name, description, switch; the whole row toggles it, by the pointer or by
// Tab and then Enter or Space (the team's PlusChatButton: the switch's own checkbox). Used by «+» › Modules and
// «Model settings» › «How the AI works in this chat», so the two lists look the same.
// Not AgentModuleMenuItem: it keeps the description in an «i» tooltip and toggles agent modules by its own hook
import { memo } from 'react';

import { Box, MenuItem, Typography } from '@mui/material';

import { INTERNAL_TOOL_ICONS } from '@/[fsd]/features/agent/lib/constants';
import { Switch } from '@/[fsd]/shared/ui';
import { EntityIcon } from '@/[fsd]/shared/ui/icon';

const ConceptModuleRow = memo(props => {
  const { tool, title, description, checked, disabled, onToggle, component, sx } = props;

  const styles = conceptModuleRowStyles();
  const ToolSvg = INTERNAL_TOOL_ICONS[tool.icon];

  return (
    <MenuItem
      component={component}
      role="menuitemcheckbox"
      aria-checked={checked}
      aria-disabled={disabled}
      // the row is the one tab stop (the switch's input is out of the tab order); Enter and Space toggle it
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onToggle?.(!checked)}
      sx={[styles.row, disabled && styles.rowLocked, sx]}
      data-testid={`modules-row-${tool.name}`}
    >
      <EntityIcon
        sx={styles.icon}
        icon={
          ToolSvg && {
            component: (
              <Box
                component={ToolSvg}
                sx={styles.svg}
              />
            ),
          }
        }
        editable={false}
      />
      <Box sx={styles.text}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          {title}
        </Typography>
        <Typography
          component="div"
          variant="bodySmall"
          color="text.primary"
          onClick={event => event.target.closest('a') && event.stopPropagation()}
        >
          {description}
        </Typography>
      </Box>
      <Switch.BaseSwitch
        checked={checked}
        disabled={disabled}
        slotProps={{
          switch: {
            slotProps: { input: { tabIndex: -1, 'data-testid': `modules-toggle-${tool.name}` } },
          },
        }}
      />
    </MenuItem>
  );
});

ConceptModuleRow.displayName = 'ConceptModuleRow';

/** @type {MuiSx} */
const conceptModuleRowStyles = () => ({
  row: ({ palette }) => ({
    padding: '.5rem 1rem',
    minHeight: '3.5rem',
    gap: '.75rem',
    whiteSpace: 'normal',
    '&:hover': {
      backgroundColor: palette.background.interactiveItem.hover,
    },
  }),
  rowLocked: {
    cursor: 'default',
    '&:hover': { backgroundColor: 'transparent' },
  },
  icon: ({ palette }) => ({
    minWidth: '1.5rem',
    width: '1.5rem',
    height: '1.5rem',
    alignSelf: 'flex-start',
    marginTop: '.25rem',
    '& > div': {
      width: '1.5rem',
      height: '1.5rem',
    },
    svg: {
      path: {
        fill: palette.secondary.main,
      },
    },
  }),
  svg: {
    width: '0.875rem',
    height: '0.875rem',
    flexShrink: 0,
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
});

export default ConceptModuleRow;
