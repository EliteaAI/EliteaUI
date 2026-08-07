import { memo, useCallback } from 'react';

import { Box } from '@mui/material';

import StateItemViewHeader from '@/[fsd]/features/pipelines/flow-editor/ui/state/StateItemViewHeader';

const StateItemView = memo(props => {
  const { onFullScreen, name, valueBefore, valueAfter } = props;

  const styles = stateItemViewStyles();

  const onBeforeValueFullScreen = useCallback(() => {
    onFullScreen(name, valueBefore);
  }, [name, onFullScreen, valueBefore]);

  const onAfterValueFullScreen = useCallback(() => {
    onFullScreen(name, valueAfter);
  }, [name, onFullScreen, valueAfter]);

  return (
    <Box sx={styles.container}>
      <Box sx={styles.section}>
        <StateItemViewHeader
          title="Before"
          onFullScreen={onBeforeValueFullScreen}
        />
        <Box sx={styles.valueBox}>{JSON.stringify(valueBefore)}</Box>
      </Box>
      <Box sx={styles.section}>
        <StateItemViewHeader
          title="After"
          onFullScreen={onAfterValueFullScreen}
        />
        <Box sx={styles.valueBox}>{JSON.stringify(valueAfter)}</Box>
      </Box>
    </Box>
  );
});

StateItemView.displayName = 'StateItemView';

/** @type {MuiSx} */
const stateItemViewStyles = () => ({
  container: {
    display: 'flex',
    maxWidth: '100%',
    width: '100%',
    paddingLeft: '1.625rem',
    boxSizing: 'border-box',
    gap: '0.625rem',
  },
  section: {
    maxHeight: '7.9375rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
    flex: 1,
    maxWidth: 'calc(50% - 0.3125rem)',
  },
  valueBox: ({ palette }) => ({
    width: '100%',
    minHeight: '2.625rem',
    flex: 1,
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    overflow: 'auto',
  }),
});

export default StateItemView;
