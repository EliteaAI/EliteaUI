import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';

import { Box, FormControlLabel, Switch as MuiSwitch, Tooltip, Typography } from '@mui/material';

import { Text } from '@/[fsd]/shared/ui';
import AttachSvgIcon from '@/assets/attach-icon.svg?react';
import CalendarIcon from '@/assets/calendar.svg?react';
import ImageSvgIcon from '@/assets/image.svg?react';
import PieChartIcon from '@/assets/pie-chart-icon.svg?react';
import PythonIcon from '@/assets/python.svg?react';
import SwarmIconSVG from '@/assets/swarm-icon.svg?react';
import ToolsIcon from '@/assets/tools-icon.svg?react';
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

  const renderToolIcon = () => {
    const iconProps = {
      width: 14,
      height: 14,
      style: { flexShrink: 0 },
    };

    switch (icon) {
      case 'GearIcon':
        return <ToolsIcon {...iconProps} />;
      case 'CodeIcon':
        return <PythonIcon {...iconProps} />;
      case 'DatabaseIcon':
        return <PieChartIcon {...iconProps} />;
      case 'CalendarIcon':
        return <CalendarIcon {...iconProps} />;
      case 'ImageSvgIcon':
        return (
          <Box
            component={ImageSvgIcon}
            sx={{ width: '.875rem', height: '0.875rem', flexShrink: 0 }}
          />
        );
      case 'UsersIcon':
        return <SwarmIconSVG {...iconProps} />;
      case 'AttachSvgIcon':
        return <AttachSvgIcon {...iconProps} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={styles.container}>
      <Box sx={styles.contentContainer}>
        <Box sx={styles.toolIconWrapper}>{renderToolIcon()}</Box>
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
          <MuiSwitch
            checked={allowTool}
            onChange={onChange}
            disabled={disabled}
            size="small"
            variant="alita"
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
  toolIconWrapper: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '1.5rem',
    height: '1.5rem',
    borderRadius: '50%',

    background:
      palette.mode === 'light'
        ? 'linear-gradient(45.36deg, rgba(158, 168, 175, 0.3) 16.25%, rgba(158, 168, 175, 0.09) 87.07%)'
        : 'linear-gradient(45.36deg, rgba(169, 183, 193, 0.3) 16.25%, rgba(80, 86, 91, 0.3) 87.07%)',
    marginRight: '0.5rem',

    svg: {
      path: {
        fill: palette.secondary.main,
      },
    },
  }),
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
