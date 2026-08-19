import { memo, useCallback, useMemo } from 'react';

import OpenEyeIcon from '@/assets/open-eye-icon.svg?react';
import { ToolkitViewOptions } from '@/common/constants';
import CodeIcon from '@/components/Icons/CodeIcon';

import TabGroupButton from './TabGroupButton';

const FormViewToggle = memo(props => {
  const { view = ToolkitViewOptions.Form, onChangeView, containerSX, disabled, jsonViewTourTarget } = props;

  const viewTabs = useMemo(
    () => [
      {
        value: ToolkitViewOptions.Form,
        icon: <OpenEyeIcon fill="currentColor" />,
        tooltip: 'Form view',
        buttonProps: { 'data-testid': 'toolkit-form-view-toggle', 'aria-label': 'Form view' },
      },
      {
        value: ToolkitViewOptions.Json,
        icon: <CodeIcon fill="currentColor" />,
        tooltip: 'Raw JSON view',
        buttonProps: {
          'data-tour': jsonViewTourTarget,
          'data-testid': 'toolkit-raw-json-view-toggle',
          'aria-label': 'Raw JSON view',
        },
      },
    ],
    [jsonViewTourTarget],
  );

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
      arrayBtn={viewTabs}
      value={view}
      onChange={handleChange}
      disabled={disabled}
      customSx={containerSX}
    />
  );
});

FormViewToggle.displayName = 'FormViewToggle';

export default FormViewToggle;
