import { memo, useCallback, useMemo } from 'react';

import { Typography } from '@mui/material';

import { PeriodHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { SingleSelect } from '@/[fsd]/shared/ui/select';

const FOOTER_VALUE = '__period_select_footer__';

const FOOTER_OPTION = {
  value: FOOTER_VALUE,
  label: 'Only months with usage are listed.',
  disabled: true,
  style: ({ palette }) => ({
    pointerEvents: 'none',
    opacity: 1,
    borderTop: `0.0625rem solid ${palette.border.lines}`,
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    '& .MuiTypography-root': {
      fontSize: '0.6875rem',
      color: palette.text.metrics || palette.text.disabled,
      fontStyle: 'italic',
    },
  }),
};

const UsagePeriodSelect = memo(props => {
  const { availablePeriods = [], period, onChange } = props;

  const currentPeriod = availablePeriods[0] || '';
  const currentValue = period || currentPeriod;

  const options = useMemo(() => {
    const periodOptions = availablePeriods.map((p, idx) => {
      const label = PeriodHelpers.formatPeriodLabel(p);
      return {
        value: p,
        label: idx === 0 ? `${label} · current` : label,
        description: PeriodHelpers.formatPeriodDateRange(p, currentPeriod),
      };
    });
    return [...periodOptions, FOOTER_OPTION];
  }, [availablePeriods, currentPeriod]);

  const renderTriggerValue = useCallback(
    option => (
      <Typography
        variant="labelMedium"
        color="inherit"
        component="div"
      >
        {PeriodHelpers.formatPeriodLabel(option?.value ?? currentValue)}
      </Typography>
    ),
    [currentValue],
  );

  return (
    <SingleSelect
      separateLabel
      label=""
      value={currentValue}
      options={options}
      onValueChange={onChange}
      showOptionDescription
      customRenderValue={renderTriggerValue}
      data-testid="usage-period-select"
    />
  );
});

UsagePeriodSelect.displayName = 'UsagePeriodSelect';

export default UsagePeriodSelect;
