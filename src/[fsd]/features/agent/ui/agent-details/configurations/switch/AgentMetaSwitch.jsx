import { memo, useEffect, useState } from 'react';

import { useFormikContext } from 'formik';

import { Switch, Text } from '@/[fsd]/shared/ui';

/**
 * A toggle switch for boolean settings stored in version_details.meta
 * Unlike AgentInternalToolSwitch which manages an array of tool names,
 * this component directly sets a boolean value at the specified meta path.
 *
 * @param {string} title - Display label for the switch
 * @param {string} metaKey - Key in version_details.meta to store the boolean value
 * @param {boolean} defaultValue - Default value when not set (defaults to true)
 * @param {boolean} disabled - Whether the switch is disabled
 * @param {object} infoTooltip - Tooltip configuration with text, linkText, linkUrl
 */
const AgentMetaSwitch = memo(({ title, metaKey, defaultValue = true, disabled, infoTooltip }) => {
  const { values, setFieldValue } = useFormikContext();

  // Get current value from meta, falling back to defaultValue
  const currentValue = values?.version_details?.meta?.[metaKey];
  const [isEnabled, setIsEnabled] = useState(currentValue ?? defaultValue);

  const onChange = (event, checkedValue) => {
    setFieldValue(`version_details.meta.${metaKey}`, checkedValue);
  };

  useEffect(() => {
    // Sync local state with form values
    const newValue = values?.version_details?.meta?.[metaKey];
    setIsEnabled(newValue ?? defaultValue);
  }, [values?.version_details?.meta, metaKey, defaultValue]);

  return (
    <Switch.BaseSwitch
      label={title}
      disabled={disabled}
      infoTooltip={infoTooltip ? <Text.TextWithLink {...infoTooltip} /> : null}
      checked={isEnabled}
      onChange={onChange}
      width="auto"
      slotProps={{
        formControlLabel: { labelPlacement: 'end' },
      }}
    />
  );
});

AgentMetaSwitch.displayName = 'AgentMetaSwitch';

export default AgentMetaSwitch;
