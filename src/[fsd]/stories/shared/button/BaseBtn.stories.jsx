import { Box, Typography } from '@mui/material';

import BaseBtn, { eliteaButtonColors } from '@/[fsd]/shared/ui/button/BaseBtn';
import PlusIcon from '@/assets/plus-icon.svg?react';

export default {
  title: 'shared/ui/BaseBtn',
  component: BaseBtn,
  argTypes: {
    children: { control: 'text' },
    variant: {
      control: { type: 'select' },
      options: [
        'contained',
        'secondary',
        'text',
        'special',
        'alarm',
        'auxiliary',
        'icon',
        'iconCounter',
        'maxi',
        'iconLabel',
      ],
    },
    size: {
      control: { type: 'select' },
      options: ['medium'],
    },
    disabled: { control: 'boolean' },
    disableRipple: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
  parameters: {
    layout: 'padded',
  },
};

const Template = args => <BaseBtn {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  children: 'Primary Button',
  variant: 'contained',
  disabled: false,
};

export const Secondary = Template.bind({});
Secondary.args = {
  children: 'Secondary Button',
  variant: 'secondary',
  disabled: false,
};

export const Text = Template.bind({});
Text.args = {
  children: 'Text Button',
  variant: 'text',
  disabled: false,
};

export const Special = Template.bind({});
Special.args = {
  children: 'Special Button',
  variant: 'special',
  disabled: false,
};

export const Alarm = Template.bind({});
Alarm.args = {
  children: 'Alarm Button',
  variant: 'alarm',
  disabled: false,
};

export const AlarmIcon = Template.bind({});
AlarmIcon.args = {
  children: 'Label',
  variant: 'alarm',
  startIcon: <PlusIcon />,
  disabled: false,
};

export const NeutralIcon = Template.bind({});
NeutralIcon.args = {
  children: 'Label',
  variant: 'neutral',
  startIcon: <PlusIcon />,
  disabled: false,
};

export const PositiveIcon = Template.bind({});
PositiveIcon.args = {
  children: 'Label',
  variant: 'positive',
  startIcon: <PlusIcon />,
  disabled: false,
};

export const Auxiliary = Template.bind({});
Auxiliary.args = {
  children: 'Auxiliary Button',
  variant: 'auxiliary',
  disabled: false,
};

export const IconLabel = Template.bind({});
IconLabel.args = {
  children: 'Icon Label',
  variant: 'iconLabel',
  startIcon: <PlusIcon />,
  disabled: false,
};

const variantsConfig = [
  {
    title: 'Special',
    props: { variant: 'special', startIcon: <PlusIcon />, disableRipple: true, children: 'Label' },
  },
  {
    title: 'Special',
    props: {
      variant: 'special',
      startIcon: <PlusIcon />,
      disableRipple: true,
    },
  },
  {
    title: 'Primary',
    props: { variant: 'contained', children: 'Label', disableRipple: true },
  },
  {
    title: 'Primary',
    props: {
      variant: 'contained',
      startIcon: <PlusIcon />,
      disableRipple: true,
    },
  },
  {
    title: 'Secondary',
    props: { variant: 'secondary', children: 'Label', disableRipple: true },
  },
  {
    title: 'Secondary',
    props: {
      variant: 'secondary',
      startIcon: <PlusIcon />,
      disableRipple: true,
    },
  },
  {
    title: 'Icon + Counter',
    props: { variant: 'iconCounter', startIcon: <PlusIcon />, endIcon: <span>10</span>, disableRipple: true },
  },
  {
    title: 'Icon + Label',
    props: { variant: 'iconLabel', startIcon: <PlusIcon />, children: 'Label', disableRipple: true },
  },
  {
    title: 'Tertiary',
    props: { variant: 'tertiary', children: 'Label', disableRipple: true },
  },
  {
    title: 'Tertiary Icon',
    props: {
      variant: 'tertiary',
      startIcon: <PlusIcon />,
      disableRipple: true,
    },
  },
  {
    title: 'Auxiliary',
    props: { variant: 'auxiliary', children: 'Label', disableRipple: true },
  },
  {
    title: 'Auxiliary Icon',
    props: {
      variant: 'auxiliary',
      startIcon: <PlusIcon />,
      disableRipple: true,
    },
  },
  {
    title: 'Alarm',
    props: { variant: 'alarm', children: 'Label', disableRipple: true },
  },
  {
    title: 'Alarm',
    props: {
      variant: 'alarm',
      startIcon: <PlusIcon />,
      children: 'Label',
      disableRipple: true,
    },
  },
  {
    title: 'Neutral',
    props: {
      variant: 'neutral',
      startIcon: <PlusIcon />,
      children: 'Label',
      disableRipple: true,
    },
  },
  {
    title: 'Positive',
    props: {
      variant: 'positive',
      startIcon: <PlusIcon />,
      children: 'Label',
      disableRipple: true,
    },
  },
];

const LoadingButtonType = {
  PRIMARY_CIRCULAR: 'PRIMARY_CIRCULAR',
  PRIMARY_WITH_LABEL: 'PRIMARY_WITH_LABEL',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
};

const getLoadingButtonType = (isPrimary, isCircularIcon) => {
  if (!isPrimary) {
    return LoadingButtonType.NOT_APPLICABLE;
  }
  return isCircularIcon ? LoadingButtonType.PRIMARY_CIRCULAR : LoadingButtonType.PRIMARY_WITH_LABEL;
};

const ButtonStatesRow = ({ title, props }) => {
  const isCircularIcon =
    props.sx?.borderRadius === '50%' ||
    ((props.children === undefined || props.children === null) && Boolean(props.startIcon));
  const isPrimary = props.variant === 'contained';

  const loadingType = getLoadingButtonType(isPrimary, isCircularIcon);
  return (
    <>
      <Typography
        variant="body2"
        sx={{
          alignSelf: 'center',
          justifySelf: 'start',
          opacity: title ? 1 : 0,
        }}
      >
        {title}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <BaseBtn {...props} />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <BaseBtn
          {...props}
          sx={[
            props.sx,
            theme => {
              if (!eliteaButtonColors(theme)[props.variant]) return {};

              return {
                backgroundColor: eliteaButtonColors(theme)[props.variant].hover.background,
                color: eliteaButtonColors(theme)[props.variant].hover.color,
                ...(props.variant === 'iconLabel' ? { border: 'transparent' } : {}),
                '& .MuiButton-startIcon': {
                  color: eliteaButtonColors(theme)[props.variant].hover.colorIcon,
                },
              };
            },
          ]}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <BaseBtn
          {...props}
          sx={[
            props.sx,
            theme => {
              if (!eliteaButtonColors(theme)[props.variant]) return {};

              return {
                backgroundColor: eliteaButtonColors(theme)[props.variant].active.background,
                color: eliteaButtonColors(theme)[props.variant].active.color,
                border: eliteaButtonColors(theme)[props.variant].active.border,
                '& .MuiButton-startIcon': {
                  color: eliteaButtonColors(theme)[props.variant].active.colorIcon,
                },
              };
            },
          ]}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <BaseBtn
          {...props}
          disabled
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {(() => {
          switch (loadingType) {
            case LoadingButtonType.PRIMARY_CIRCULAR:
              return (
                <BaseBtn
                  variant={props.variant}
                  sx={props.sx}
                  loading
                  disabled
                />
              );
            case LoadingButtonType.PRIMARY_WITH_LABEL:
              return (
                <BaseBtn
                  {...props}
                  loading
                  loadingPosition="start"
                  disabled
                />
              );
            case LoadingButtonType.NOT_APPLICABLE:
            default:
              return null;
          }
        })()}
      </Box>
    </>
  );
};

export const AllButtons = () => {
  const groupedVariants = variantsConfig.reduce((acc, variant) => {
    (acc[variant.title] = acc[variant.title] || []).push(variant);
    return acc;
  }, {});

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '120px repeat(5, 1fr)',
          gap: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography variant="subtitle2">BUTTON</Typography>
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'center' }}
        >
          Default
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'center' }}
        >
          Hover
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'center' }}
        >
          Pressed
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'center' }}
        >
          Disabled
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'center' }}
        >
          Loading
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '120px repeat(5, 1fr)',
          gap: '1rem',
          rowGap: '2rem',
        }}
      >
        {Object.keys(groupedVariants).map(groupTitle =>
          groupedVariants[groupTitle].map((variant, index) => (
            <ButtonStatesRow
              key={`${groupTitle}-${index}`}
              title={index === 0 ? groupTitle : ''}
              props={variant.props}
            />
          )),
        )}
      </Box>
    </Box>
  );
};

AllButtons.args = {
  disabled: false,
};

export const Sizes = args => (
  <Box sx={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <BaseBtn
      {...args}
      size="medium"
    >
      Medium
    </BaseBtn>
  </Box>
);

Sizes.args = {
  variant: 'contained',
  disabled: false,
};

export const Disabled = Template.bind({});

Disabled.args = {
  children: 'Disabled Button',
  variant: 'contained',
  disabled: true,
};
