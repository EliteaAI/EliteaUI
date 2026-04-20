import { memo, useCallback } from 'react';

import { TabGroupButton } from '@/[fsd]/shared/ui/tab-group-button';
import { ToolkitViewOptions } from '@/common/constants';

const FORM_VIEW_TABS = [
  {
    value: ToolkitViewOptions.Form,
    label: 'Form',
    tooltip: 'Form view',
  },
  {
    value: ToolkitViewOptions.Json,
    label: 'Raw Json',
    tooltip: 'Raw Json view',
  },
];

export const FormViewToggle = memo(props => {
  const { view = ToolkitViewOptions.Form, onChangeView, containerSX, disabled } = props;

  const handleChange = useCallback(
    (_, newValue) => {
      if (newValue !== null && newValue !== view) {
        onChangeView(newValue);
      }
    },
    [onChangeView, view],
  );

  return (
    <TabGroupButton
      arrayBtn={FORM_VIEW_TABS}
      value={view}
      onChange={handleChange}
      disabled={disabled}
      customSx={containerSX}
    />
  );
});

FormViewToggle.displayName = 'FormViewToggle';
