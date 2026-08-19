import HeadingChip, { HEADING_CHIP_VARIANTS } from '@/[fsd]/shared/ui/chip/HeadingChip';

export default {
  title: 'shared/ui/HeadingChip',
  component: HeadingChip,
  argTypes: {
    label: { control: 'text' },
    variant: {
      control: { type: 'select' },
      options: Object.values(HEADING_CHIP_VARIANTS),
    },
  },
  parameters: {
    layout: 'padded',
  },
};

const Template = args => <HeadingChip {...args} />;

export const Default = Template.bind({});
Default.args = {
  label: 'Heading',
};

export const Suggestion = Template.bind({});
Suggestion.args = {
  label: 'Suggested follow-up',
  variant: HEADING_CHIP_VARIANTS.suggestion,
};
