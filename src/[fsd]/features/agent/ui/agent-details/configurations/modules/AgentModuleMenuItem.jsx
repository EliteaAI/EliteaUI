import { memo, useCallback, useMemo } from 'react';

import { Box, MenuItem } from '@mui/material';

import { INTERNAL_TOOL_ICONS } from '@/[fsd]/features/agent/lib/constants';
import { useAgentInternalToolToggle } from '@/[fsd]/features/agent/lib/hooks';
import { DropdownConstants } from '@/[fsd]/shared/lib/constants';
import { Switch, Text } from '@/[fsd]/shared/ui';
import { EntityIcon } from '@/[fsd]/shared/ui/icon';
import { TypographyWithConditionalTooltip } from '@/[fsd]/shared/ui/tooltip';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';

const stopPropagation = event => event.stopPropagation();

const AgentModuleMenuItem = memo(props => {
  const { module, readOnly = false, ...menuItemProps } = props;
  const { name, title, icon, unavailable = false, unavailableTooltip, infoTooltip } = module;

  const isLocked = readOnly || unavailable;
  const tooltip = unavailable ? unavailableTooltip && { text: unavailableTooltip } : infoTooltip;

  const styles = agentModuleMenuItemStyles(isLocked);

  const { checked, onToggle } = useAgentInternalToolToggle({ name, unavailable });

  const handleClick = useCallback(() => {
    if (isLocked) return;
    onToggle(!checked);
  }, [isLocked, onToggle, checked]);

  const toolIcon = useMemo(() => {
    const IconComponent = INTERNAL_TOOL_ICONS[icon];
    if (!IconComponent) return null;
    return {
      component: (
        <Box
          component={IconComponent}
          sx={styles.toolSvgIcon}
        />
      ),
    };
  }, [icon, styles.toolSvgIcon]);

  return (
    <MenuItem
      {...menuItemProps}
      data-testid={`agent-module-menu-item-${name}`}
      aria-disabled={isLocked}
      aria-checked={checked}
      role="menuitemcheckbox"
      onClick={handleClick}
      sx={styles.item}
    >
      <EntityIcon
        sx={styles.entityIcon}
        icon={toolIcon}
        editable={false}
      />
      <Box sx={styles.labelContainer}>
        <TypographyWithConditionalTooltip
          title={title}
          placement="top"
          variant="bodyMedium"
          color="text.secondary"
        >
          {title}
        </TypographyWithConditionalTooltip>
        {tooltip && (
          <Box
            component="span"
            sx={styles.infoContainer}
            onClick={stopPropagation}
          >
            <InfoTooltip
              infoTooltip={tooltip}
              TitleComponent={Text.TextWithLink}
              sx={styles.infoIcon}
            />
          </Box>
        )}
      </Box>
      <Switch.BaseSwitch
        checked={checked}
        disabled={isLocked}
        slotProps={{
          switch: {
            slotProps: { input: { tabIndex: -1, 'data-testid': `agent-canvas-tools-toggle-${name}` } },
          },
        }}
      />
    </MenuItem>
  );
});

AgentModuleMenuItem.displayName = 'AgentModuleMenuItem';

/** @type {MuiSx} */
const agentModuleMenuItemStyles = isLocked => ({
  item: ({ palette }) => ({
    padding: '0.5rem 1rem',
    height: DropdownConstants.DIMENSIONS.ITEM_HEIGHT,
    gap: DropdownConstants.SPACING.ITEM_REGULAR_GAP,
    cursor: isLocked ? 'default' : 'pointer',
    '&:hover': {
      backgroundColor: isLocked ? 'transparent' : palette.background.interactiveItem.hover,
    },
  }),
  entityIcon: ({ palette }) => ({
    minWidth: '1.5rem',
    width: '1.5rem',
    height: '1.5rem',
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
  toolSvgIcon: {
    width: '0.875rem',
    height: '0.875rem',
    flexShrink: 0,
  },
  labelContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flex: 1,
    minWidth: 0,
  },
  infoContainer: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  infoIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    height: '1rem',
    width: '1rem',
  },
});

export default AgentModuleMenuItem;
