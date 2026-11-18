import { memo, useMemo } from 'react';

import { EditEntityComparisonLayout } from '@/[fsd]/entities/edit-entity-with-ai';

import { buildPipelineRunSettingsRows, getChangedRowKeys } from '../../lib/helpers/compareVersions.helpers';
import CompareVersionHeader from '../CompareVersionHeader';
import CompareSchedulesBlock from '../schedules/CompareSchedulesBlock';
import CompareRunSettingsColumn from './CompareRunSettingsColumn';

// Pipeline step 4: the read-only run settings, then the schedules of each version
const CompareRunSettingsSchedulesStep = memo(props => {
  const {
    leftVersion,
    rightVersion,
    leftData,
    rightData,
    entityId,
    canListSchedules,
    isScheduleAdmin,
    onOpenSchedule,
  } = props;

  const leftRows = useMemo(
    () => buildPipelineRunSettingsRows(leftData.run_settings),
    [leftData.run_settings],
  );
  const rightRows = useMemo(
    () => buildPipelineRunSettingsRows(rightData.run_settings),
    [rightData.run_settings],
  );
  const changedKeys = useMemo(() => getChangedRowKeys(leftRows, rightRows), [leftRows, rightRows]);

  return (
    <EditEntityComparisonLayout
      currentLabel={<CompareVersionHeader version={leftVersion} />}
      suggestedLabel={<CompareVersionHeader version={rightVersion} />}
      currentContent={
        <CompareRunSettingsColumn
          title="Run settings"
          rows={leftRows}
          changedKeys={changedKeys}
          side="left"
        />
      }
      suggestedContent={
        <CompareRunSettingsColumn
          title="Run settings"
          rows={rightRows}
          changedKeys={changedKeys}
          side="right"
        />
      }
      bottomContent={
        canListSchedules && (
          <CompareSchedulesBlock
            entityType="pipeline"
            entityId={entityId}
            leftVersionId={leftVersion?.id}
            rightVersionId={rightVersion?.id}
            leftData={leftData}
            rightData={rightData}
            isAdmin={isScheduleAdmin}
            onOpenSchedule={onOpenSchedule}
          />
        )
      }
    />
  );
});

CompareRunSettingsSchedulesStep.displayName = 'CompareRunSettingsSchedulesStep';

export default CompareRunSettingsSchedulesStep;
