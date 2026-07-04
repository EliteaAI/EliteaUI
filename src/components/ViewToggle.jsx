import { useCallback, useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import TabGroupButton from '@/[fsd]/shared/ui/tab-group-button/TabGroupButton';
import { SearchParams, ViewOptions } from '@/common/constants';
import { useSetUrlSearchParams } from '@/hooks/useCardNavigate';

import CardsViewIcon from './Icons/CardsViewIcon';
import TableViewIcon from './Icons/TableViewIcon';

export default function ViewToggle({
  defaultView,
  tableViewTestId = 'agent-table-view-button',
  cardViewTestId = 'agent-card-view-button',
}) {
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
        buttonProps: { 'data-testid': tableViewTestId },
      },
      {
        value: ViewOptions.Cards,
        icon: <CardsViewIcon />,
        tooltip: 'Card list view',
        buttonProps: { 'data-testid': cardViewTestId },
      },
    ],
    [tableViewTestId, cardViewTestId],
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
