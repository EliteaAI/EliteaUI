import { memo, useCallback, useMemo } from 'react';

import { MarkdownConstants } from '@/[fsd]/shared/lib/constants';
import CodeIcon from '@/assets/code-icon.svg?react';
import OpenEyeIcon from '@/assets/open-eye-icon.svg?react';

import TabGroupButton from './TabGroupButton';

const { MARKDOWN_VIEW_MODES } = MarkdownConstants;

const DEFAULT_ICON_ORDER = [MARKDOWN_VIEW_MODES.edit, MARKDOWN_VIEW_MODES.preview];

const MODE_BUTTONS = {
  [MARKDOWN_VIEW_MODES.edit]: {
    value: MARKDOWN_VIEW_MODES.edit,
    icon: theme => <CodeIcon fill={theme.palette.icon.secondary} />,
    tooltip: 'Edit mode',
    buttonProps: { 'data-testid': 'markdown-edit-mode-toggle', 'aria-label': 'Edit mode' },
  },
  [MARKDOWN_VIEW_MODES.preview]: {
    value: MARKDOWN_VIEW_MODES.preview,
    icon: theme => <OpenEyeIcon fill={theme.palette.icon.secondary} />,
    tooltip: 'Preview mode',
    buttonProps: { 'data-testid': 'markdown-preview-mode-toggle', 'aria-label': 'Preview mode' },
  },
};

const MarkdownViewToggle = memo(props => {
  const { value, onChange, iconOrder = DEFAULT_ICON_ORDER, size = 'small', ...restProps } = props;

  const modeButtons = useMemo(() => iconOrder.map(mode => MODE_BUTTONS[mode]), [iconOrder]);

  const handleChange = useCallback((_event, newMode) => onChange(newMode), [onChange]);

  return (
    <TabGroupButton
      value={value}
      onChange={handleChange}
      size={size}
      arrayBtn={modeButtons}
      {...restProps}
    />
  );
});

MarkdownViewToggle.displayName = 'MarkdownViewToggle';

export default MarkdownViewToggle;
