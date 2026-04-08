import { forwardRef, memo, useCallback, useState } from 'react';

import { ToggleButtonGroup, useTheme } from '@mui/material';

import MoonIcon from '@/assets/moon-icon.svg?react';

import TabButtonItem from './TabButtonItem.jsx';

const TAB_GROUP_BUTTON = {
  elitea: 'elitea',
};

const exampleArrayBtn = [
  {
    value: 'elitea',
    icon: theme => <MoonIcon fill={theme.palette.icon.fill.secondary} />,
    label: 'EliteA',
    tooltip: 'EliteA',
  },
  {
    value: 'codemie',
    icon: <MoonIcon />,
    label: 'Codemie',
    tooltip: 'Codemie',
  },
];

export const borderRadiusByOrder = (arrayBtn, index) => {
  if (arrayBtn.length === 1) return '0.5rem';
  if (index === 0) return '0.5rem 0 0 0.5rem';
  if (index === arrayBtn.length - 1) return '0 0.5rem 0.5rem 0';
  return '0rem';
};

const TabGroupButton = memo(
  forwardRef((props, ref) => {
    const {
      arrayBtn = exampleArrayBtn,
      onChange,
      size = 'small',
      value: controlledValue,
      defaultValue,
      customSx,
      disableTooltip = false,
      ...restProps
    } = props;

    const isControlled = controlledValue !== undefined;

    const [internalValue, setInternalValue] = useState(() => {
      if (isControlled) {
        return controlledValue;
      }
      return defaultValue ?? arrayBtn[0]?.value;
    });

    const valueTab = isControlled ? controlledValue : internalValue;

    const theme = useTheme();

    const styles = tabGroupButtonStyle();

    const handleChangeValue = useCallback(
      (event, newValue) => {
        if (newValue !== null) {
          if (!isControlled) {
            setInternalValue(newValue);
          }
          onChange?.(event, newValue);
        }
      },
      [onChange, isControlled],
    );

    return (
      <ToggleButtonGroup
        key={arrayBtn}
        orientation="horizontal"
        size={size}
        ref={ref}
        value={valueTab}
        exclusive
        onChange={handleChangeValue}
        aria-label="Toolkit View Toggler"
        {...restProps}
        sx={styles.toggleButtonGroup}
      >
        {arrayBtn?.map((item, index) => (
          <TabButtonItem
            key={`${index}_${item.value}`}
            item={item}
            borderRadius={borderRadiusByOrder(arrayBtn, index)}
            customSx={customSx}
            theme={theme}
            disableTooltip={disableTooltip}
          />
        ))}
      </ToggleButtonGroup>
    );
  }),
);

const tabGroupButtonStyle = () => ({
  toggleButtonGroup: { ml: 0, zIndex: 2000 },
});

export const colorTabGroupButtonStyle = theme => ({
  [TAB_GROUP_BUTTON.elitea]: {
    default: {
      color: theme.palette.text.tabButton.default,
      fill: theme.palette.text.tabButton.default,
      background: theme.palette.background.tabButton.default,
    },
    hover: {
      color: theme.palette.text.tabButton.hover,
      fill: theme.palette.text.tabButton.hover,
      background: theme.palette.background.tabButton.hover,
    },
    active: {
      color: theme.palette.text.tabButton.active,
      fill: theme.palette.text.tabButton.active,
      pressed: theme.palette.background.button.secondary.pressed,
      background: theme.palette.background.tabButton.active,
    },
    disabled: {
      color: theme.palette.text.tabButton.disabled,
      fill: theme.palette.text.tabButton.disabled,
      background: theme.palette.background.tabButton.disabled,
    },
  },
});

export const eliteaTabGroupButtonStyle = theme => ({
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: '0rem',
  padding: '0.375rem 0.5rem',
  textTransform: 'none',
  fontFamily: theme.typography.fontFamily,
  fontFeatureSettings: theme.typography.fontFeatureSettings,
  ...theme.typography.labelSmall,
  '&&.MuiToggleButtonGroup-grouped': {
    border: 'none',
  },
  '&&.MuiToggleButtonGroup-groupedHorizontal:not(:last-of-type)': {
    borderRight: 'none',
  },
  '&&.MuiToggleButtonGroup-groupedHorizontal:not(:first-of-type)': {
    borderLeft: 'none',
    marginLeft: 0,
  },
});

export const eliteaTabGroupVariants = [
  {
    props: { variant: TAB_GROUP_BUTTON.elitea },
    style: ({ theme }) => ({
      ...eliteaTabGroupButtonStyle(theme),

      color: colorTabGroupButtonStyle(theme)[TAB_GROUP_BUTTON.elitea].default.color,
      fill: colorTabGroupButtonStyle(theme)[TAB_GROUP_BUTTON.elitea].default.fill,
      backgroundColor: colorTabGroupButtonStyle(theme)[TAB_GROUP_BUTTON.elitea].default.background,

      '&:hover': {
        color: colorTabGroupButtonStyle(theme)[TAB_GROUP_BUTTON.elitea].hover.color,
        fill: colorTabGroupButtonStyle(theme)[TAB_GROUP_BUTTON.elitea].hover.fill,
        backgroundColor: colorTabGroupButtonStyle(theme)[TAB_GROUP_BUTTON.elitea].hover.background,
      },
      '&:active': {
        color: colorTabGroupButtonStyle(theme)[TAB_GROUP_BUTTON.elitea].active.color,
        fill: colorTabGroupButtonStyle(theme)[TAB_GROUP_BUTTON.elitea].active.fill,
        backgroundColor: colorTabGroupButtonStyle(theme)[TAB_GROUP_BUTTON.elitea].active.pressed,
      },
      '&.Mui-selected': {
        color: colorTabGroupButtonStyle(theme)[TAB_GROUP_BUTTON.elitea].active.color,
        fill: colorTabGroupButtonStyle(theme)[TAB_GROUP_BUTTON.elitea].active.fill,
        backgroundColor: colorTabGroupButtonStyle(theme)[TAB_GROUP_BUTTON.elitea].active.background,
      },
      '&:disabled': {
        color: colorTabGroupButtonStyle(theme)[TAB_GROUP_BUTTON.elitea].disabled.color,
        fill: colorTabGroupButtonStyle(theme)[TAB_GROUP_BUTTON.elitea].disabled.fill,
        backgroundColor: colorTabGroupButtonStyle(theme)[TAB_GROUP_BUTTON.elitea].disabled.background,
      },
      '& svg': {
        fontSize: '1rem',
      },
    }),
  },
];

TabGroupButton.displayName = 'TabGroupButton';

export default TabGroupButton;
