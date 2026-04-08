import { useCallback, useMemo } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';

import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { ALL_TIME_DATE } from '@/common/constants';
import { useTheme } from '@emotion/react';

export const useTrendRange = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: locationState } = location;
  const trendRange = useMemo(() => locationState?.trendRange || ALL_TIME_DATE, [locationState?.trendRange]);

  const onChangeTrendRange = useCallback(
    newRange => {
      const pagePath = location.pathname + location.search;
      navigate(pagePath, {
        replace: true,
        state: {
          ...(locationState || {}),
          trendRange: newRange,
        },
      });
    },
    [location.pathname, location.search, navigate, locationState],
  );

  return {
    trendRange,
    onChangeTrendRange,
  };
};

const SelectContainer = styled(Box)(
  () => `
  display: flex;
  margin-left: 0.5rem;
  z-index: 1001;
  align-items: flex-end;
  height: 100%;
`,
);

export default function DateRangeSelect() {
  const { trendRange, onChangeTrendRange } = useTrendRange();
  const theme = useTheme();
  const trendRangeOptions = useMemo(() => {
    const theDate = new Date();
    const dateString = theDate.toISOString().split('T')[0];
    const monthString = dateString.substring(0, dateString.lastIndexOf('-'));
    const firstDataOfThisWeek = theDate.getDate() - theDate.getDay();
    const theDateOfMonday = new Date(new Date().setDate(firstDataOfThisWeek)).toISOString().split('T')[0];
    return [
      {
        label: 'Today',
        value: dateString + 'T00:00:00',
      },
      {
        label: 'This week',
        value: theDateOfMonday + 'T00:00:00',
      },
      {
        label: 'This Month',
        value: monthString + '-01T00:00:00',
      },
      {
        label: 'All time',
        value: ALL_TIME_DATE,
      },
    ];
  }, []);

  return (
    <SelectContainer>
      <SingleSelect
        onValueChange={onChangeTrendRange}
        value={trendRange}
        options={trendRangeOptions}
        customSelectedColor={`${theme.palette.text.primary} !important`}
        customSelectedFontSize={'0.875rem'}
      />
    </SelectContainer>
  );
}
