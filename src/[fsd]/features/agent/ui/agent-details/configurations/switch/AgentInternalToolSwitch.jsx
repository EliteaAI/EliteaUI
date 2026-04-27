import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, FormControlLabel, Tooltip, Typography } from '@mui/material';

import { Switch, Text } from '@/[fsd]/shared/ui';
import AttachSvgIcon from '@/assets/attach-icon.svg?react';
import CalendarIcon from '@/assets/calendar.svg?react';
import ImageSvgIcon from '@/assets/image.svg?react';
import PieChartIcon from '@/assets/pie-chart-icon.svg?react';
import PythonIcon from '@/assets/python.svg?react';
import SwarmIconSVG from '@/assets/swarm-icon.svg?react';
import ToolsIcon from '@/assets/tools-icon.svg?react';
import EntityIcon from '@/components/EntityIcon';
import InfoIcon from '@/components/Icons/InfoIcon';

const AgentInternalToolSwitch = memo(props => {
  const { title, name, disabled, infoTooltip, icon } = props;
  const { values, setFieldValue } = useFormikContext();

  const styles = agentInternalToolSwitchStyles();

  const internal_tools = useMemo(
    () => values?.version_details?.meta?.internal_tools || [],
    [values?.version_details?.meta],
  );
  const [allowTool, setAllowTool] = useState(!!values?.version_details?.meta?.attachment_toolkit_id);

  const onChange = useCallback(
    (_, checkedValue) => {
      setFieldValue(
        'version_details.meta.internal_tools',
        checkedValue ? [...internal_tools, name] : internal_tools.filter(t => t !== name),
      );
    },
    [setFieldValue, internal_tools, name],
  );

  useEffect(() => {
    setAllowTool(internal_tools.includes(name));
  }, [internal_tools, name]);

  const iconMap = useMemo(
    () => ({
      GearIcon: ToolsIcon,
      CodeIcon: PythonIcon,
      DatabaseIcon: PieChartIcon,
      CalendarIcon,
      ImageSvgIcon,
      UsersIcon: SwarmIconSVG,
      AttachSvgIcon,
    }),
    [],
  );

  const toolIcon = useMemo(() => {
    const IconComponent = iconMap[icon];
    if (!IconComponent) return null;
    return {
      component: (
        <Box
          component={IconComponent}
          sx={styles.toolSvgIcon}
        />
      ),
    };
  }, [icon, iconMap, styles.toolSvgIcon]);

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
          <Tooltip
            title={<Text.TextWithLink {...infoTooltip} />}
            placement="top"
            slotProps={{
              popper: {
                sx: {
                  zIndex: 9999,
                },
              },
            }}
          >
            <Box sx={styles.iconContainer}>
              <InfoIcon
                width={16}
                height={16}
              />
            </Box>
          </Tooltip>
        )}
      </Box>
      <FormControlLabel
        control={
          <Switch.BaseSwitch
            checked={allowTool}
            onChange={onChange}
            disabled={disabled}
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
    backgroundColor: palette.background.userInputBackground,
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
