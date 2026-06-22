import { useState } from 'react';

import { Box, Typography } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Checkbox, Modal } from '@/[fsd]/shared/ui';

export default {
  title: 'shared/ui/Modal',
  component: Modal.BaseModal,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: Object.values(ModalConstants.MODAL_VARIANT),
      description: 'Modal variant',
    },
    titleIcon: {
      control: 'select',
      options: [null, ...Object.values(ModalConstants.MODAL_ICON_TYPE)],
      description: 'Icon type (only for simple variant)',
    },
    fullscreen: {
      control: 'boolean',
      description: 'Fullscreen mode (only for complex variant)',
    },
  },
};

const Template = args => <Modal.BaseModal {...args} />;

export const BaseModal = Template.bind({});
BaseModal.args = {
  open: true,
  variant: 'simple',
  title: 'Base Modal',
  content: 'This is a simple modal with some content.',
  titleIcon: 'warning',
  onClose: () => {},
  onConfirm: () => {},
};

const DeleteEntityTemplate = args => {
  const [checked, setChecked] = useState(false);

  const customActions = args.withCustomActions ? (
    <>
      <Button.BaseBtn
        variant="elitea"
        color="secondary"
        onClick={() => {}}
      >
        Discard changes
      </Button.BaseBtn>
      <Button.BaseBtn
        variant="elitea"
        onClick={() => {}}
      >
        Save changes
      </Button.BaseBtn>
    </>
  ) : undefined;

  return (
    <Modal.DeleteEntityModal
      {...args}
      extraContent={
        args.withExtraContent ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Checkbox.BaseCheckbox
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
            />
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              Also delete from attachment storage
            </Typography>
          </Box>
        ) : undefined
      }
      actions={customActions}
    />
  );
};

export const DeleteEntityModal = DeleteEntityTemplate.bind({});
DeleteEntityModal.args = {
  open: true,
  name: 'My Entity Name',
  shouldRequestInputName: false,
  withExtraContent: true,
  withCustomActions: false,
};
DeleteEntityModal.argTypes = {
  variant: { table: { disable: true } },
  fullscreen: { table: { disable: true } },
  shouldRequestInputName: {
    control: 'boolean',
    description: 'Show TextField to confirm entity name',
  },
  withExtraContent: {
    control: 'boolean',
    description: 'Show extra content with checkbox',
  },
  withCustomActions: {
    control: 'boolean',
    description: 'Use custom action buttons instead of default Cancel/Delete',
  },
  titleIcon: {
    control: 'select',
    options: Object.values(ModalConstants.MODAL_ICON_TYPE),
    description: 'Icon type',
  },
};

const ExpandedViewerModalTemplate = args => (
  <Modal.ExpandedViewerModal {...args}>
    <Box
      sx={{
        padding: '1rem',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography
        variant="bodyMedium"
        color="text.secondary"
      >
        Code editor content goes here
      </Typography>
    </Box>
  </Modal.ExpandedViewerModal>
);

export const ExpandedViewerModal = ExpandedViewerModalTemplate.bind({});
ExpandedViewerModal.args = {
  open: true,
  title: 'View Code - very-long-filename-that-should-be-truncated-with-ellipsis.ts',
  value: 'const example = "code to copy";',
  specifiedLanguage: 'javascript',
  disableSelectLanguage: false,
};
ExpandedViewerModal.argTypes = {
  variant: { table: { disable: true } },
  fullscreen: { table: { disable: true } },
  titleIcon: { table: { disable: true } },
  title: {
    control: 'text',
    description: 'Modal title (truncates with tooltip when long)',
  },
  value: {
    control: 'text',
    description: 'Value to copy to clipboard',
  },
  specifiedLanguage: {
    control: 'text',
    description: 'Initial language for syntax highlighting',
  },
  disableSelectLanguage: {
    control: 'boolean',
    description: 'Disable language selector',
  },
};
