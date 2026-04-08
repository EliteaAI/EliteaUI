import { useCallback, useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import TabGroupButton from '@/[fsd]/shared/ui/tab-group-button/TabGroupButton';
import { SearchParams, ViewOptions } from '@/common/constants';
import { useSetUrlSearchParams } from '@/hooks/useCardNavigate';

import CardsViewIcon from './Icons/CardsViewIcon';
import TableViewIcon from './Icons/TableViewIcon';

export default function ViewToggle({ defaultView }) {
  const [searchParams] = useSearchParams();
  const setUrlSearchParams = useSetUrlSearchParams();
  const view = useMemo(
    () => searchParams.get(SearchParams.View) || defaultView || ViewOptions.Cards,
    [defaultView, searchParams],
  );

  const onChange = useCallback(
    (_, newValue) => {
      if (newValue !== null && newValue !== view) {
        setUrlSearchParams({
          [SearchParams.View]: newValue,
        });
      }
    },
    [setUrlSearchParams, view],
  );

  const toggleButtons = useMemo(
    () => [
      {
        value: ViewOptions.Table,
        icon: <TableViewIcon />,
        tooltip: 'Table view',
      },
      {
        value: ViewOptions.Cards,
        icon: <CardsViewIcon />,
        tooltip: 'Card list view',
      },
    ],
    [],
  );

  return (
    <TabGroupButton
      size="small"
      value={view}
      onChange={onChange}
      arrayBtn={toggleButtons}
      aria-label="Small View Toggler"
    />
  );
}
