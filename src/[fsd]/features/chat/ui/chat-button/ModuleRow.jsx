import { memo, useCallback } from 'react';

import { Box, MenuItem, Typography } from '@mui/material';

import { INTERNAL_TOOL_ICONS } from '@/[fsd]/features/agent/lib/constants';
import { Switch } from '@/[fsd]/shared/ui';
import { EntityIcon } from '@/[fsd]/shared/ui/icon';

const ModuleRow = memo(props => {
  const { tool, title, description, checked = false, disabled = false, onToggle, component, sx = {} } = props;

  const styles = moduleRowStyles();
  const ToolSvg = INTERNAL_TOOL_ICONS[tool.icon];

  const handleToggle = useCallback(() => {
    if (!disabled) onToggle?.(!checked);
  }, [disabled, checked, onToggle]);

  // A link in the description opens without toggling the row
  const handleDescriptionClick = useCallback(event => {
    if (event.target.closest('a')) event.stopPropagation();
  }, []);

  return (
    <MenuItem
      component={component}
      role="menuitemcheckbox"
      aria-checked={checked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleToggle}
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
          sx={styles.title}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            component="div"
            variant="bodySmall"
            sx={styles.description}
            onClick={handleDescriptionClick}
          >
            {description}
          </Typography>
        )}
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

ModuleRow.displayName = 'ModuleRow';

/** @type {MuiSx} */
const moduleRowStyles = () => ({
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
    width: '.875rem',
    height: '.875rem',
    flexShrink: 0,
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  description: ({ palette }) => ({
    color: palette.text.primary,
  }),
});

export default ModuleRow;
