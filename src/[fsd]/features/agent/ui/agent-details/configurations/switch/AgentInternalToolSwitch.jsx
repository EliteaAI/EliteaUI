import { memo, useCallback, useMemo } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import { INTERNAL_TOOL_ICONS } from '@/[fsd]/features/agent/lib/constants';
import { useAgentInternalToolToggle } from '@/[fsd]/features/agent/lib/hooks';
import { Switch, Text } from '@/[fsd]/shared/ui';
import { EntityIcon } from '@/[fsd]/shared/ui/icon';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';

const AgentInternalToolSwitch = memo(props => {
  const { title, name, disabled, unavailable = false, infoTooltip, icon } = props;

  const styles = agentInternalToolSwitchStyles();

  const { checked, onToggle } = useAgentInternalToolToggle({ name, unavailable });

  const onChange = useCallback((_, checkedValue) => onToggle(checkedValue), [onToggle]);

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
    <Box sx={styles.container}>
      <Box sx={styles.contentContainer}>
        <EntityIcon
          sx={styles.entityIcon}
          icon={toolIcon}
          editable={false}
        />
        <Typography sx={styles.title}>{title}</Typography>
        {infoTooltip && (
          <InfoTooltip
            infoTooltip={infoTooltip}
            TitleComponent={Text.TextWithLink}
            sx={styles.iconContainer}
          />
        )}
      </Box>
      <FormControlLabel
        control={
          <Switch.BaseSwitch
            checked={checked}
            onChange={onChange}
            disabled={disabled || unavailable}
            // NOTE: the legacy `inputProps` prop on MUI v7's <Switch> is
            // silently discarded — Switch.js unconditionally rebuilds its
            // own `slotProps.input` (merging in `role: "switch"`) and passes
            // it as an explicit `slotProps` prop to SwitchBase, which then
            // overwrites SwitchBase's own `input: inputProps` mapping via
            // object-spread order (confirmed via node_modules source,
            // ELITEA-2075). The native MUI channel is `slotProps.input`,
            // threaded here through BaseSwitch's own `slotProps.switch`
            // passthrough (BaseSwitch's `slotProps` prop has a DIFFERENT,
            // custom shape — `switch`/`container`/`label`/`formControlLabel`
            // — so `slotProps.switch` is spread directly onto the
            // underlying `<MuiSwitch>` as a real prop object).
            slotProps={{
              switch: { slotProps: { input: { 'data-testid': `agent-canvas-tools-toggle-${name}` } } },
            }}
          />
        }
        label=""
        sx={styles.switchLabel}
      />
    </Box>
  );
});

AgentInternalToolSwitch.displayName = 'AgentInternalToolSwitch';

/** @type {MuiSx} */
const agentInternalToolSwitchStyles = () => ({
  container: ({ palette }) => ({
    backgroundColor: palette.background.surface.interactive.default,
    borderRadius: '0.5rem',
    height: '2.5rem',
    padding: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    width: '100%',
  }),
  contentContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flex: 1,
    minWidth: 0,
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: '1.5rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  entityIcon: ({ palette }) => ({
    minWidth: '1.5rem',
    width: '1.5rem',
    height: '1.5rem',
    marginRight: '0.5rem',

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
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    height: '1rem',
    width: '1rem',
  },
  switchLabel: {
    margin: 0,
    padding: 0,
  },
});

export default AgentInternalToolSwitch;
