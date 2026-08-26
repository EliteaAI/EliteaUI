import { memo, useCallback, useState } from 'react';

import { Box } from '@mui/material';

import { Tab } from '@/[fsd]/shared/ui';

import { EVAL_TAB_VIEW } from '../lib/constants';
import { DatasetsView } from './datasets';
import { LibraryView } from './library';
import { SuiteConfigView } from './suite';

const SUB_NAV_BUTTONS = [
  {
    value: EVAL_TAB_VIEW.suite,
    label: 'Suite config',
    tooltip: 'Configure the evaluation suite for this agent',
  },
  { value: EVAL_TAB_VIEW.library, label: 'Library', tooltip: 'Reusable dimensions and code validations' },
  { value: EVAL_TAB_VIEW.datasets, label: 'Datasets', tooltip: 'Manage test-case datasets for this project' },
];

const EvaluationTab = memo(props => {
  const { isFetching, isError, applicationId, applicationVersionId } = props;

  const [view, setView] = useState(EVAL_TAB_VIEW.suite);
  const [datasetsInitialId, setDatasetsInitialId] = useState(null);

  const handleChangeView = useCallback((event, newValue) => {
    setDatasetsInitialId(null);
    setView(newValue);
  }, []);

  const handleOpenDatasets = useCallback((datasetId = null) => {
    setDatasetsInitialId(datasetId);
    setView(EVAL_TAB_VIEW.datasets);
  }, []);

  const styles = evaluationTabStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="evaluation-tab-content"
    >
      <Box sx={styles.subNav}>
        <Tab.TabGroupButton
          arrayBtn={SUB_NAV_BUTTONS}
          value={view}
          onChange={handleChangeView}
          disableTooltip
        />
      </Box>

      <Box sx={styles.body}>
        {view === EVAL_TAB_VIEW.suite && (
          <SuiteConfigView
            isFetching={isFetching}
            isError={isError}
            applicationId={applicationId}
            applicationVersionId={applicationVersionId}
            onOpenDatasets={handleOpenDatasets}
          />
        )}
        {view === EVAL_TAB_VIEW.library && (
          <LibraryView
            isFetching={isFetching}
            isError={isError}
            applicationId={applicationId}
          />
        )}
        {view === EVAL_TAB_VIEW.datasets && (
          <DatasetsView
            isFetching={isFetching}
            isError={isError}
            initialDatasetId={datasetsInitialId}
            applicationId={applicationId}
          />
        )}
      </Box>
    </Box>
  );
});

EvaluationTab.displayName = 'EvaluationTab';

/** @type {MuiSx} */
const evaluationTabStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  subNav: ({ palette }) => ({
    display: 'flex',
    padding: '0.75rem 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  body: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
});

export default EvaluationTab;
