import { memo, useCallback } from 'react';

import { SHARED_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import { TabGroupButton } from '@/[fsd]/shared/ui/tab-group-button';
import { ToolkitViewOptions } from '@/common/constants';

const FORM_VIEW_TABS = [
  {
    value: ToolkitViewOptions.Form,
    label: 'Form',
    tooltip: 'Form view',
    buttonProps: { 'data-testid': 'toolkit-form-view-toggle' },
  },
  {
    value: ToolkitViewOptions.Json,
    label: 'Raw Json',
    tooltip: 'Raw Json view',
    buttonProps: {
      'data-tour': SHARED_TOUR_TARGET_IDS.rawJsonTab,
      'data-testid': 'toolkit-raw-json-view-toggle',
    },
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
