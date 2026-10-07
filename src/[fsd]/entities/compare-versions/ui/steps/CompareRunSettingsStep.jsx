import { memo, useMemo } from 'react';

import { EditEntityComparisonLayout } from '@/[fsd]/entities/edit-entity-with-ai';

import { buildRunSettingsRows } from '../../lib/helpers/compareVersions.helpers';
import CompareVersionHeader from '../CompareVersionHeader';
import CompareRunSettingsColumn from './CompareRunSettingsColumn';

const CompareRunSettingsStep = memo(props => {
  const { leftVersion, rightVersion, leftData, rightData } = props;

  const leftRows = useMemo(() => buildRunSettingsRows(leftData.run_settings), [leftData.run_settings]);
  const rightRows = useMemo(() => buildRunSettingsRows(rightData.run_settings), [rightData.run_settings]);
  const changedKeys = useMemo(
    () => new Set(leftRows.filter((row, index) => row.value !== rightRows[index].value).map(row => row.key)),
    [leftRows, rightRows],
  );

  return (
    <EditEntityComparisonLayout
      currentLabel={<CompareVersionHeader version={leftVersion} />}
      suggestedLabel={<CompareVersionHeader version={rightVersion} />}
      currentContent={
        <CompareRunSettingsColumn
          rows={leftRows}
          changedKeys={changedKeys}
          side="left"
        />
      }
      suggestedContent={
        <CompareRunSettingsColumn
          rows={rightRows}
          changedKeys={changedKeys}
          side="right"
        />
      }
    />
  );
});

CompareRunSettingsStep.displayName = 'CompareRunSettingsStep';

export default CompareRunSettingsStep;
