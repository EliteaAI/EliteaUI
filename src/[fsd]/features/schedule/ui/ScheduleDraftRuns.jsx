import { memo } from 'react';

import { useScheduleRunsView } from '../lib/hooks/useScheduleRunsView.hooks';
import ScheduleRunsCard from './ScheduleRunsCard';

// The Runs card of the Create page: a new schedule has no saved runs, only Test runs of the form.
// The entity comes from the form, because the user may still change it.
const ScheduleDraftRuns = memo(props => {
  const { entityType, applicationId, ...cardProps } = props;
  const view = useScheduleRunsView(undefined, applicationId);

  return (
    <ScheduleRunsCard
      ref={view.cardRef}
      entityType={entityType}
      applicationId={applicationId}
      view={view}
      {...cardProps}
    />
  );
});

ScheduleDraftRuns.displayName = 'ScheduleDraftRuns';

export default ScheduleDraftRuns;
